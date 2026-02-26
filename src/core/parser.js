const SUPPORTED_SCHEMES = new Set([
  'vless', 'vmess', 'trojan', 'ss', 'ssr', 'socks', 'socks5',
  'wireguard', 'wg', 'hysteria2', 'hy2', 'hysteria', 'tuic', 'snell', 'ssh', 'anytls', 'http', 'https'
]);

export function parseFlexibleInput(text) {
  const direct = parseMixedInput(text);
  if (direct.length) return direct;

  const normalized = text.trim();
  const decoded = tryDecodeBase64(normalized);
  if (decoded) {
    const parsedDecoded = parseMixedInput(decoded);
    if (parsedDecoded.length) return parsedDecoded;
  }

  const maybeLineDecoded = normalized
    .split(/\r?\n/)
    .map((line) => tryDecodeBase64(line.trim()) || '')
    .join('\n');

  if (maybeLineDecoded.trim()) {
    const parsedLineDecoded = parseMixedInput(maybeLineDecoded);
    if (parsedLineDecoded.length) return parsedLineDecoded;
  }

  return [];
}

export function parseMixedInput(text) {
  const rows = [];
  const uriMatches = text.match(/[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s"'<>]+/g) ?? [];
  for (const raw of uriMatches) {
    const parsed = parseUri(raw.trim());
    if (parsed) rows.push(parsed);
  }

  const wgBlocks = text.match(/\[Interface\][\s\S]*?(?=\n\s*\[Interface\]|$)/g) ?? [];
  for (const block of wgBlocks) {
    const parsed = parseWireguardConf(block);
    if (parsed) rows.push(parsed);
  }

  return dedupeRows(rows);
}

export function parseSubscriptionPayload(text) {
  const trimmed = text.trim();
  const decoded = tryDecodeBase64(trimmed);
  const source = decoded && decoded.includes('://') ? decoded : text;
  return parseMixedInput(source);
}

export function exportRowsToUriText(rows) {
  return rows.map(toShareUri).filter(Boolean).join('\n');
}

function parseUri(input) {
  const clean = input.replace(/[),.;]+$/, '');
  const scheme = (clean.split('://')[0] || '').toLowerCase();
  if (!SUPPORTED_SCHEMES.has(scheme)) return null;

  if (scheme === 'vmess') return parseVmess(clean);
  if (scheme === 'ss') return parseSs(clean);
  if (scheme === 'ssr') return parseSsr(clean);
  if (scheme === 'socks' || scheme === 'socks5') return parseSocks(clean);
  if (scheme === 'wireguard' || scheme === 'wg') return parseWireguard(clean);
  if (scheme === 'hysteria2' || scheme === 'hy2' || scheme === 'hysteria') return parseHysteria(clean, scheme);
  if (scheme === 'tuic') return parseTuic(clean);
  if (scheme === 'snell') return parseSnell(clean);
  if (scheme === 'ssh') return parseSsh(clean);
  if (scheme === 'http' || scheme === 'https') return parseHttp(clean);
  return parseUrlLike(clean, scheme);
}

function parseVmess(input) {
  const payload = input.slice('vmess://'.length);
  const decoded = tryDecodeBase64(payload);
  if (!decoded) return parseUrlLike(input, 'vmess');

  try {
    const json = JSON.parse(decoded);
    const net = String(json.net || 'tcp').toLowerCase();
    const tlsRaw = String(json.tls || '').toLowerCase();
    const security = tlsRaw && tlsRaw !== 'none' && tlsRaw !== 'false' ? tlsRaw : 'none';

    return makeRow({
      name: json.ps || json.name || `vmess-${json.add || 'node'}`,
      protocolId: 'vmess',
      transportId: normalizeTransport(net),
      mainConfig: {
        server: String(json.add || ''),
        port: Number(json.port || 0),
        id: String(json.id || '')
      },
      optionalConfig: {
        security,
        scy: String(json.scy || json.security || 'auto'),
        alterId: String(json.aid ?? json.alterId ?? '0'),
        sni: String(json.sni || ''),
        alpn: String(json.alpn || ''),
        fp: String(json.fp || ''),
        host: String(json.host || ''),
        path: String(json.path || ''),
        type: String(json.type || ''),
        allowInsecure: String(json.allowInsecure ?? json.insecure ?? '')
      },
      transportMain: {
        path: String(json.path || ''),
        serviceName: String(json.serviceName || '')
      },
      transportOptional: {
        host: String(json.host || ''),
        type: String(json.type || '')
      }
    });
  } catch {
    return null;
  }
}

function parseUrlLike(input, scheme) {
  try {
    const url = new URL(input);
    const q = url.searchParams;
    const type = (q.get('type') || q.get('network') || 'raw').toLowerCase();

    const mainConfig = { server: url.hostname };
    if (url.port) mainConfig.port = Number(url.port);

    if (scheme === 'vless' || scheme === 'vmess') {
      mainConfig.id = decodeURIComponent(url.username || '');
      if (q.get('encryption')) mainConfig.encryption = q.get('encryption');
    }

    if (scheme === 'trojan' || scheme === 'anytls') {
      mainConfig.password = decodeURIComponent(url.username || url.password || '');
    }

    const optionalConfig = {};
    copyQuery(q, optionalConfig, [
      'security', 'sni', 'alpn', 'fp', 'flow', 'insecure', 'allowInsecure',
      'host', 'headerType', 'obfs', 'obfs-password', 'pbk', 'sid', 'serviceName', 'peer', 'servername'
    ]);

    const transportMain = {};
    const transportOptional = {};
    if (q.get('path')) transportMain.path = decodeURIComponent(q.get('path'));
    if (q.get('serviceName')) transportMain.serviceName = q.get('serviceName');
    if (q.get('host')) transportOptional.host = q.get('host');

    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `${scheme}-${url.hostname}`,
      protocolId: scheme,
      transportId: normalizeTransport(type),
      mainConfig,
      optionalConfig,
      transportMain,
      transportOptional
    });
  } catch {
    return null;
  }
}

function parseSs(input) {
  const body = input.slice(5);
  const [beforeHash, hashPart] = body.split('#');
  const [main] = beforeHash.split('?');
  let serverPart = main;
  let userInfo = '';

  if (main.includes('@')) {
    [userInfo, serverPart] = main.split('@');
  } else {
    const decoded = tryDecodeBase64(main);
    if (!decoded || !decoded.includes('@')) return null;
    [userInfo, serverPart] = decoded.split('@');
  }

  const decodedUser = userInfo.includes(':') ? userInfo : tryDecodeBase64(userInfo) || userInfo;
  if (!decodedUser.includes(':')) return null;
  const idx = decodedUser.indexOf(':');
  const method = decodedUser.slice(0, idx);
  const password = decodedUser.slice(idx + 1);

  const [server, portStr] = serverPart.split(':');
  return makeRow({
    name: decodeURIComponent(hashPart || '') || `ss-${server}`,
    protocolId: 'shadowsocks',
    transportId: 'raw',
    mainConfig: { server, port: Number(portStr || 0), method, password }
  });
}

function parseSsr(input) {
  const decoded = tryDecodeBase64(input.slice('ssr://'.length));
  if (!decoded) return null;

  const [left, paramsPart] = decoded.split('/?');
  const parts = left.split(':');
  if (parts.length < 6) return null;

  const [server, port, protocol, method, obfs, passwordB64] = parts;
  const password = tryDecodeBase64(passwordB64) || passwordB64;
  const params = new URLSearchParams(paramsPart || '');
  const remarks = params.get('remarks');

  return makeRow({
    name: safeDecode(tryDecodeBase64(remarks || '') || remarks || `ssr-${server}`),
    protocolId: 'ssr',
    transportId: 'raw',
    mainConfig: { server, port: Number(port || 0), method, password },
    optionalConfig: {
      protocol,
      obfs,
      'protocol-param': safeDecode(tryDecodeBase64(params.get('protoparam') || '') || params.get('protoparam') || ''),
      'obfs-param': safeDecode(tryDecodeBase64(params.get('obfsparam') || '') || params.get('obfsparam') || '')
    }
  });
}

function parseSocks(input) {
  try {
    const url = new URL(input.replace(/^socks5:\/\//i, 'socks://'));
    const server = url.hostname;
    const port = Number(url.port || 1080);
    const userRaw = decodeURIComponent(url.username || '');
    const decoded = userRaw.includes(':') ? userRaw : tryDecodeBase64(userRaw) || userRaw;
    let user = '';
    let pass = '';
    if (decoded.includes(':')) {
      const idx = decoded.indexOf(':');
      user = decoded.slice(0, idx);
      pass = decoded.slice(idx + 1);
    }

    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `socks-${server}`,
      protocolId: 'socks',
      transportId: 'raw',
      mainConfig: { server, port },
      optionalConfig: { user, pass }
    });
  } catch {
    return null;
  }
}

function parseHysteria(input, scheme) {
  try {
    const url = new URL(input.replace(/^hy2:\/\//i, 'hysteria2://'));
    const q = url.searchParams;
    const protocolId = (scheme === 'hysteria2' || scheme === 'hy2') ? 'hysteria2' : 'hysteria';

    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `${protocolId}-${url.hostname}`,
      protocolId,
      transportId: 'hysteria',
      mainConfig: { server: url.hostname, port: Number(url.port || 443), auth: decodeURIComponent(url.username || '') },
      optionalConfig: {
        security: q.get('security') || '',
        obfs: q.get('obfs') || '',
        'obfs-password': q.get('obfs-password') || '',
        sni: q.get('sni') || q.get('peer') || ''
      }
    });
  } catch {
    return null;
  }
}

function parseWireguard(input) {
  try {
    const url = new URL(input.replace(/^wg:\/\//i, 'wireguard://'));
    const q = url.searchParams;
    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || 'wireguard',
      protocolId: 'wireguard',
      transportId: 'raw',
      mainConfig: {
        secretKey: decodeURIComponent(url.username || q.get('private-key') || ''),
        address: decodeURIComponent(q.get('address') || q.get('ip') || ''),
        publicKey: decodeURIComponent(q.get('publickey') || q.get('public-key') || ''),
        server: url.hostname,
        port: Number(url.port || 0)
      },
      optionalConfig: {
        reserved: decodeURIComponent(q.get('reserved') || ''),
        mtu: q.get('mtu') || '',
        keepalive: q.get('keepalive') || ''
      }
    });
  } catch {
    return null;
  }
}

function parseTuic(input) {
  try {
    const url = new URL(input);
    const q = url.searchParams;
    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `tuic-${url.hostname}`,
      protocolId: 'tuic',
      transportId: 'raw',
      mainConfig: {
        server: url.hostname,
        port: Number(url.port || 443),
        id: decodeURIComponent(url.username || ''),
        password: decodeURIComponent(url.password || '')
      },
      optionalConfig: {
        sni: q.get('sni') || '',
        alpn: q.get('alpn') || ''
      }
    });
  } catch {
    return null;
  }
}

function parseSnell(input) {
  try {
    const url = new URL(input);
    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `snell-${url.hostname}`,
      protocolId: 'snell',
      transportId: 'raw',
      mainConfig: {
        server: url.hostname,
        port: Number(url.port || 443),
        password: decodeURIComponent(url.username || url.searchParams.get('psk') || '')
      },
      optionalConfig: {
        version: url.searchParams.get('version') || '2'
      }
    });
  } catch {
    return null;
  }
}

function parseSsh(input) {
  try {
    const url = new URL(input);
    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `ssh-${url.hostname}`,
      protocolId: 'ssh',
      transportId: 'raw',
      mainConfig: {
        server: url.hostname,
        port: Number(url.port || 22),
        user: decodeURIComponent(url.username || ''),
        password: decodeURIComponent(url.password || '')
      }
    });
  } catch {
    return null;
  }
}

function parseHttp(input) {
  try {
    const url = new URL(input);
    return makeRow({
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `http-${url.hostname}`,
      protocolId: 'http',
      transportId: 'raw',
      mainConfig: {
        server: url.hostname,
        port: Number(url.port || (url.protocol === 'https:' ? 443 : 80))
      },
      optionalConfig: {
        user: decodeURIComponent(url.username || ''),
        pass: decodeURIComponent(url.password || ''),
        security: url.protocol === 'https:' ? 'tls' : 'none'
      }
    });
  } catch {
    return null;
  }
}

function parseWireguardConf(text) {
  const map = parseIniLike(text);
  if (!map.Interface && !map.Peer) return null;
  const iface = map.Interface || {};
  const peer = map.Peer || {};
  const endpoint = normalizeEndpoint(peer.Endpoint);
  return makeRow({
    name: 'wireguard-conf',
    protocolId: 'wireguard',
    transportId: 'raw',
    mainConfig: {
      secretKey: iface.PrivateKey || '',
      address: iface.Address || '',
      publicKey: peer.PublicKey || '',
      server: endpoint.host,
      port: endpoint.port || ''
    },
    optionalConfig: {
      mtu: iface.MTU || '',
      dns: iface.DNS || '',
      keepalive: peer.PersistentKeepalive || ''
    }
  });
}

function parseIniLike(text) {
  const out = {};
  let section = '';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      section = sec[1];
      if (!out[section]) out[section] = {};
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0 || !section) continue;
    out[section][line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

function normalizeEndpoint(endpoint = '') {
  if (!endpoint) return { host: '', port: '' };
  const cleaned = endpoint.replace(/^\[/, '').replace(/\]$/, '');
  const idx = cleaned.lastIndexOf(':');
  if (idx < 0) return { host: cleaned, port: '' };
  return { host: cleaned.slice(0, idx), port: Number(cleaned.slice(idx + 1) || 0) };
}

function normalizeTransport(value) {
  const map = { ws: 'websocket', grpc: 'grpc', httpupgrade: 'httpupgrade', xhttp: 'xhttp', mkcp: 'mkcp', tcp: 'raw', raw: 'raw', hysteria: 'hysteria' };
  return map[value] || 'raw';
}

function copyQuery(q, dest, keys) {
  for (const key of keys) {
    const value = q.get(key);
    if (value !== null && value !== '') dest[key] = value;
  }
}

function dedupeRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.protocolId}|${row.mainConfig?.server || ''}|${row.mainConfig?.port || ''}|${row.mainConfig?.id || row.mainConfig?.password || row.mainConfig?.secretKey || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function toShareUri(row) {
  if (row.direction !== 'outbound') return '';
  if (row.protocolId === 'vless' || row.protocolId === 'trojan') {
    const cred = encodeURIComponent(row.mainConfig?.id || row.mainConfig?.password || '');
    const host = row.mainConfig?.server || '';
    const port = row.mainConfig?.port || '';
    const query = new URLSearchParams();
    if (row.transportId && row.transportId !== 'raw') query.set('type', reverseTransport(row.transportId));
    if (row.transportMain?.path) query.set('path', row.transportMain.path);
    if (row.optionalConfig?.security) query.set('security', row.optionalConfig.security);
    if (row.optionalConfig?.sni) query.set('sni', row.optionalConfig.sni);
    if (row.optionalConfig?.fp) query.set('fp', row.optionalConfig.fp);
    return `${row.protocolId}://${cred}@${host}:${port}?${query.toString()}#${encodeURIComponent(row.name || row.protocolId)}`;
  }

  if (row.protocolId === 'shadowsocks') {
    const user = `${row.mainConfig?.method || ''}:${row.mainConfig?.password || ''}`;
    const encoded = btoa(user);
    const host = row.mainConfig?.server || '';
    const port = row.mainConfig?.port || '';
    return `ss://${encoded}@${host}:${port}#${encodeURIComponent(row.name || 'ss')}`;
  }

  return '';
}

function reverseTransport(id) {
  const map = { websocket: 'ws' };
  return map[id] || id;
}

function makeRow({ name, protocolId, transportId = 'raw', mainConfig = {}, optionalConfig = {}, transportMain = {}, transportOptional = {} }) {
  return {
    id: createId(),
    engineId: 'xray',
    name: name || `${protocolId}-${mainConfig.server || 'node'}`,
    direction: 'outbound',
    protocolId,
    transportId,
    mainConfig,
    optionalConfig,
    transportMain,
    transportOptional
  };
}

function safeDecode(v) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function tryDecodeBase64(input) {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}
