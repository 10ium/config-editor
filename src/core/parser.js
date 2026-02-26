const SUPPORTED_SCHEMES = new Set(['vless', 'vmess', 'trojan', 'ss', 'socks', 'wireguard', 'hysteria2', 'hysteria']);

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

  if (scheme === 'ss') return parseSs(clean);
  if (scheme === 'socks') return parseSocks(clean);
  if (scheme === 'wireguard') return parseWireguard(clean);
  if (scheme === 'hysteria2' || scheme === 'hysteria') return parseHysteria(clean);
  return parseUrlLike(clean, scheme);
}

function parseUrlLike(input, scheme) {
  try {
    const url = new URL(input);
    const host = url.hostname;
    const port = url.port ? Number(url.port) : undefined;
    const q = url.searchParams;
    const type = (q.get('type') || q.get('network') || 'raw').toLowerCase();
    const transportId = normalizeTransport(type);
    const name = decodeURIComponent((url.hash || '').replace(/^#/, '')) || `${scheme}-${host}`;

    const mainConfig = { server: host };
    if (port) mainConfig.port = port;

    if (scheme === 'vless' || scheme === 'vmess') {
      mainConfig.id = decodeURIComponent(url.username || '');
      if (q.get('encryption')) mainConfig.encryption = q.get('encryption');
    }

    if (scheme === 'trojan') {
      mainConfig.password = decodeURIComponent(url.username || '');
    }

    const optionalConfig = {};
    copyQuery(q, optionalConfig, ['security', 'sni', 'alpn', 'fp', 'flow', 'insecure', 'allowInsecure', 'host', 'headerType', 'obfs', 'obfs-password']);

    const transportMain = {};
    const transportOptional = {};
    if (q.get('path')) transportMain.path = decodeURIComponent(q.get('path'));
    if (q.get('serviceName')) transportMain.serviceName = q.get('serviceName');
    if (q.get('host')) transportOptional.host = q.get('host');

    return {
      id: createId(),
      engineId: 'xray',
      name,
      direction: 'outbound',
      protocolId: scheme,
      transportId,
      mainConfig,
      optionalConfig,
      transportMain,
      transportOptional
    };
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

  let method = '';
  let password = '';
  const decodedUser = userInfo.includes(':') ? userInfo : tryDecodeBase64(userInfo) || userInfo;
  if (decodedUser.includes(':')) {
    const idx = decodedUser.indexOf(':');
    method = decodedUser.slice(0, idx);
    password = decodedUser.slice(idx + 1);
  }

  const [server, portStr] = serverPart.split(':');
  const name = decodeURIComponent(hashPart || '') || `ss-${server}`;

  return {
    id: createId(),
    engineId: 'xray',
    name,
    direction: 'outbound',
    protocolId: 'shadowsocks',
    transportId: 'raw',
    mainConfig: { server, port: Number(portStr || 0), method, password },
    optionalConfig: {},
    transportMain: {},
    transportOptional: {}
  };
}

function parseSocks(input) {
  try {
    const url = new URL(input);
    const server = url.hostname;
    const port = Number(url.port || 1080);
    const hash = decodeURIComponent((url.hash || '').replace(/^#/, ''));
    const userRaw = decodeURIComponent(url.username || '');
    const decoded = userRaw.includes(':') ? userRaw : tryDecodeBase64(userRaw) || userRaw;
    let user = '';
    let pass = '';
    if (decoded.includes(':')) {
      const idx = decoded.indexOf(':');
      user = decoded.slice(0, idx);
      pass = decoded.slice(idx + 1);
    }

    return {
      id: createId(),
      engineId: 'xray',
      name: hash || `socks-${server}`,
      direction: 'outbound',
      protocolId: 'socks',
      transportId: 'raw',
      mainConfig: { server, port },
      optionalConfig: { user, pass },
      transportMain: {},
      transportOptional: {}
    };
  } catch {
    return null;
  }
}

function parseHysteria(input) {
  try {
    const url = new URL(input);
    const server = url.hostname;
    const port = Number(url.port || 443);
    const q = url.searchParams;
    return {
      id: createId(),
      engineId: 'xray',
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || `hysteria-${server}`,
      direction: 'outbound',
      protocolId: 'hysteria',
      transportId: 'hysteria',
      mainConfig: { server, port, auth: decodeURIComponent(url.username || '') },
      optionalConfig: {
        security: q.get('security') || '',
        obfs: q.get('obfs') || '',
        'obfs-password': q.get('obfs-password') || '',
        sni: q.get('sni') || ''
      },
      transportMain: {},
      transportOptional: {}
    };
  } catch {
    return null;
  }
}

function parseWireguard(input) {
  try {
    const url = new URL(input);
    const q = url.searchParams;
    return {
      id: createId(),
      engineId: 'xray',
      name: decodeURIComponent((url.hash || '').replace(/^#/, '')) || 'wireguard',
      direction: 'outbound',
      protocolId: 'wireguard',
      transportId: 'raw',
      mainConfig: {
        secretKey: decodeURIComponent(url.username || ''),
        address: decodeURIComponent(q.get('address') || ''),
        publicKey: decodeURIComponent(q.get('publickey') || ''),
        server: url.hostname,
        port: Number(url.port || 0)
      },
      optionalConfig: {
        reserved: decodeURIComponent(q.get('reserved') || ''),
        mtu: q.get('mtu') || '',
        keepalive: q.get('keepalive') || ''
      },
      transportMain: {},
      transportOptional: {}
    };
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
  return {
    id: createId(),
    engineId: 'xray',
    name: 'wireguard-conf',
    direction: 'outbound',
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
    },
    transportMain: {},
    transportOptional: {}
  };
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
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    out[section][key] = value;
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
    const key = `${row.protocolId}|${row.mainConfig?.server || ''}|${row.mainConfig?.port || ''}|${row.mainConfig?.id || row.mainConfig?.password || ''}`;
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
    const scheme = row.protocolId;
    return `${scheme}://${cred}@${host}:${port}?${query.toString()}#${encodeURIComponent(row.name || row.protocolId)}`;
  }

  if (row.protocolId === 'shadowsocks') {
    const user = `${row.mainConfig?.method || ''}:${row.mainConfig?.password || ''}`;
    const encoded = btoa(user);
    const host = row.mainConfig?.server || '';
    const port = row.mainConfig?.port || '';
    return `ss://${encoded}@${host}:${port}#${encodeURIComponent(row.name || 'ss')}`;
  }

  if (row.protocolId === 'wireguard') {
    const query = new URLSearchParams();
    if (row.mainConfig?.address) query.set('address', row.mainConfig.address);
    if (row.mainConfig?.publicKey) query.set('publickey', row.mainConfig.publicKey);
    return `wireguard://${encodeURIComponent(row.mainConfig?.secretKey || '')}@${row.mainConfig?.server || ''}:${row.mainConfig?.port || ''}?${query.toString()}#${encodeURIComponent(row.name || 'wireguard')}`;
  }

  return '';
}

function reverseTransport(id) {
  const map = { websocket: 'ws' };
  return map[id] || id;
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
