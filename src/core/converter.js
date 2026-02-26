export function adaptRowsToEngine(rows, engineId) {
  if (engineId !== 'mihomo') {
    return rows.map((row) => ({ ...row, engineId }));
  }

  return rows.map((row) => ({
    ...row,
    engineId: 'mihomo',
    protocolId: mapProtocolToMihomo(row.protocolId),
    mainConfig: { ...row.mainConfig },
    optionalConfig: { ...row.optionalConfig }
  }));
}

export function toMihomoYaml(rows) {
  const proxies = rows.map(convertRowToMihomoProxy).filter(Boolean);
  const lines = ['proxies:'];
  for (const proxy of proxies) {
    lines.push(`  - name: ${yaml(proxy.name || 'proxy')}`);
    lines.push(`    type: ${yaml(proxy.type)}`);
    for (const [key, value] of Object.entries(proxy)) {
      if (key === 'name' || key === 'type' || value === '' || value === undefined || value === null) continue;
      lines.push(`    ${key}: ${yaml(value)}`);
    }
  }
  return lines.join('\n');
}

function convertRowToMihomoProxy(row) {
  const type = mapProtocolToMihomo(row.protocolId);
  const server = row.mainConfig?.server || '';
  const port = Number(row.mainConfig?.port || 0) || undefined;
  const name = row.name || `${type}-${server}`;
  const security = row.optionalConfig?.security || 'none';
  const tls = security === 'tls' || security === 'reality';

  const common = {
    name,
    type,
    server,
    port,
    sni: row.optionalConfig?.sni,
    alpn: row.optionalConfig?.alpn,
    'skip-cert-verify': boolFromString(row.optionalConfig?.allowInsecure)
  };

  if (type === 'vless' || type === 'vmess') {
    return {
      ...common,
      uuid: row.mainConfig?.id,
      cipher: row.optionalConfig?.scy || 'auto',
      tls,
      network: mapTransport(row.transportId),
      'ws-opts.path': row.transportMain?.path,
      'ws-opts.headers.Host': row.transportOptional?.host || row.optionalConfig?.host,
      'grpc-opts.grpc-service-name': row.transportMain?.serviceName,
      'reality-opts.public-key': row.optionalConfig?.pbk,
      'reality-opts.short-id': row.optionalConfig?.sid,
      'client-fingerprint': row.optionalConfig?.fp
    };
  }

  if (type === 'trojan') {
    return {
      ...common,
      password: row.mainConfig?.password,
      tls,
      network: mapTransport(row.transportId),
      'ws-opts.path': row.transportMain?.path,
      'grpc-opts.grpc-service-name': row.transportMain?.serviceName,
      'client-fingerprint': row.optionalConfig?.fp
    };
  }

  if (type === 'ss') {
    return {
      ...common,
      cipher: row.mainConfig?.method,
      password: row.mainConfig?.password
    };
  }

  if (type === 'socks5') {
    return {
      ...common,
      username: row.optionalConfig?.user,
      password: row.optionalConfig?.pass,
      tls
    };
  }

  if (type === 'hysteria2') {
    return {
      ...common,
      password: row.mainConfig?.auth,
      tls,
      sni: row.optionalConfig?.sni
    };
  }

  if (type === 'anytls') {
    return {
      ...common,
      password: row.mainConfig?.password,
      tls: true,
      'client-fingerprint': row.optionalConfig?.fp || row.optionalConfig?.fingerprint
    };
  }

  if (type === 'ssr') {
    return {
      ...common,
      cipher: row.mainConfig?.method,
      password: row.mainConfig?.password,
      protocol: row.optionalConfig?.protocol,
      obfs: row.optionalConfig?.obfs,
      'protocol-param': row.optionalConfig?.['protocol-param'],
      'obfs-param': row.optionalConfig?.['obfs-param']
    };
  }

  if (type === 'snell') {
    return {
      ...common,
      psk: row.mainConfig?.password,
      version: row.optionalConfig?.version || '2'
    };
  }

  if (type === 'tuic') {
    return {
      ...common,
      uuid: row.mainConfig?.id,
      password: row.mainConfig?.password,
      sni: row.optionalConfig?.sni,
      alpn: row.optionalConfig?.alpn
    };
  }

  if (type === 'http') {
    return {
      ...common,
      username: row.optionalConfig?.user,
      password: row.optionalConfig?.pass,
      tls
    };
  }

  if (type === 'ssh') {
    return {
      ...common,
      user: row.mainConfig?.user,
      username: row.mainConfig?.user,
      password: row.mainConfig?.password
    };
  }

  if (type === 'wg') {
    return {
      ...common,
      'private-key': row.mainConfig?.secretKey,
      'public-key': row.mainConfig?.publicKey,
      ip: row.mainConfig?.address
    };
  }

  return { ...common };
}

function mapProtocolToMihomo(protocolId = '') {
  const map = {
    shadowsocks: 'ss',
    socks: 'socks5',
    wireguard: 'wg',
    hysteria: 'hysteria2',
    hysteria2: 'hysteria2'
  };
  return map[protocolId] || protocolId;
}

function mapTransport(transportId = 'raw') {
  const map = { raw: 'tcp', websocket: 'ws', grpc: 'grpc' };
  return map[transportId] || transportId;
}

function yaml(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  const str = String(value ?? '');
  if (!str) return '""';
  return `"${str.replaceAll('"', '\\"')}"`;
}

function boolFromString(v) {
  return String(v || '').toLowerCase() === '1' || String(v || '').toLowerCase() === 'true';
}
