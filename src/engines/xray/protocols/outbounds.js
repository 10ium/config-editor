const bool = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' }
];

export const xrayOutbounds = [
  {
    id: 'blackhole',
    label: 'Blackhole',
    primaryFields: [
      { key: 'responseType', label: 'Response Type', type: 'select', options: [{ value: 'none', label: 'none' }, { value: 'http', label: 'http' }] }
    ],
    optionalFields: [{ key: 'tag', label: 'Outbound Tag', type: 'text' }]
  },
  {
    id: 'dns',
    label: 'DNS',
    primaryFields: [
      { key: 'address', label: 'DNS Address', type: 'text', placeholder: '8.8.8.8' },
      { key: 'port', label: 'DNS Port', type: 'number', defaultValue: 53 }
    ],
    optionalFields: [
      { key: 'network', label: 'Network', type: 'select', options: [{ value: 'udp', label: 'udp' }, { value: 'tcp', label: 'tcp' }] },
      { key: 'userLevel', label: 'User Level', type: 'number' }
    ]
  },
  {
    id: 'freedom',
    label: 'Freedom',
    primaryFields: [
      { key: 'domainStrategy', label: 'Domain Strategy', type: 'select', options: [{ value: 'AsIs', label: 'AsIs' }, { value: 'UseIP', label: 'UseIP' }, { value: 'UseIPv4', label: 'UseIPv4' }, { value: 'UseIPv6', label: 'UseIPv6' }] }
    ],
    optionalFields: [
      { key: 'redirect', label: 'Redirect', type: 'text', placeholder: 'host:port' },
      { key: 'fragment', label: 'Fragment (JSON)', type: 'textarea' },
      { key: 'noises', label: 'Noises (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'http',
    label: 'HTTP',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 8080 }
    ],
    optionalFields: [
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'text' },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'loopback',
    label: 'Loopback',
    primaryFields: [
      { key: 'inboundTag', label: 'Inbound Tag', type: 'text' }
    ],
    optionalFields: [
      { key: 'destinationOverride', label: 'Destination Override', type: 'text' }
    ]
  },
  {
    id: 'shadowsocks',
    label: 'Shadowsocks',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 8388 },
      { key: 'method', label: 'Method', type: 'select', options: [
        { value: 'aes-128-gcm', label: 'aes-128-gcm' },
        { value: 'aes-256-gcm', label: 'aes-256-gcm' },
        { value: 'chacha20-ietf-poly1305', label: 'chacha20-ietf-poly1305' },
        { value: '2022-blake3-aes-128-gcm', label: '2022-blake3-aes-128-gcm' },
        { value: '2022-blake3-aes-256-gcm', label: '2022-blake3-aes-256-gcm' }
      ] },
      { key: 'password', label: 'Password', type: 'text' }
    ],
    optionalFields: [
      { key: 'uot', label: 'UoT', type: 'select', options: bool },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'level', label: 'Level', type: 'number' }
    ]
  },
  {
    id: 'socks',
    label: 'SOCKS',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 1080 }
    ],
    optionalFields: [
      { key: 'user', label: 'Username', type: 'text' },
      { key: 'pass', label: 'Password', type: 'text' },
      { key: 'udpOverTcp', label: 'UDP over TCP', type: 'select', options: bool }
    ]
  },
  {
    id: 'trojan',
    label: 'Trojan',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'password', label: 'Password', type: 'text' }
    ],
    optionalFields: [
      { key: 'flow', label: 'Flow', type: 'text' },
      { key: 'sni', label: 'SNI', type: 'text' },
      { key: 'fingerprint', label: 'uTLS Fingerprint', type: 'select', options: [{ value: 'chrome', label: 'chrome' }, { value: 'firefox', label: 'firefox' }, { value: 'safari', label: 'safari' }, { value: 'edge', label: 'edge' }] }
    ]
  },
  {
    id: 'vless',
    label: 'VLESS',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'id', label: 'UUID', type: 'text' }
    ],
    optionalFields: [
      { key: 'encryption', label: 'Encryption', type: 'text', placeholder: 'none' },
      { key: 'flow', label: 'Flow', type: 'text', placeholder: 'xtls-rprx-vision' },
      { key: 'sni', label: 'SNI', type: 'text' }
    ]
  },
  {
    id: 'vmess',
    label: 'VMess',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'id', label: 'UUID', type: 'text' }
    ],
    optionalFields: [
      { key: 'alterId', label: 'AlterId', type: 'number', defaultValue: 0 },
      { key: 'security', label: 'Security', type: 'select', options: [{ value: 'auto', label: 'auto' }, { value: 'aes-128-gcm', label: 'aes-128-gcm' }, { value: 'chacha20-poly1305', label: 'chacha20-poly1305' }, { value: 'none', label: 'none' }] },
      { key: 'globalPadding', label: 'Global Padding', type: 'select', options: bool }
    ]
  },
  {
    id: 'wireguard',
    label: 'WireGuard',
    primaryFields: [
      { key: 'secretKey', label: 'Secret Key', type: 'text' },
      { key: 'address', label: 'Address', type: 'text', placeholder: '10.0.0.2/32' },
      { key: 'publicKey', label: 'Peer Public Key', type: 'text' }
    ],
    optionalFields: [
      { key: 'preSharedKey', label: 'Pre Shared Key', type: 'text' },
      { key: 'endpoint', label: 'Endpoint', type: 'text', placeholder: 'host:port' },
      { key: 'reserved', label: 'Reserved (JSON array)', type: 'textarea' }
    ]
  },
  {
    id: 'hysteria',
    label: 'Hysteria',
    primaryFields: [
      { key: 'server', label: 'Server', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'auth', label: 'Auth', type: 'text' }
    ],
    optionalFields: [
      { key: 'upMbps', label: 'Up Mbps', type: 'number' },
      { key: 'downMbps', label: 'Down Mbps', type: 'number' },
      { key: 'obfs', label: 'Obfs', type: 'text' },
      { key: 'sni', label: 'SNI', type: 'text' }
    ]
  }
];
