const bool = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' }
];

export const xrayInbounds = [
  {
    id: 'tunnel',
    label: 'Tunnel',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text', placeholder: '0.0.0.0' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'network', label: 'Network', type: 'select', options: [{ value: 'tcp', label: 'tcp' }, { value: 'udp', label: 'udp' }, { value: 'tcp,udp', label: 'tcp,udp' }] }
    ],
    optionalFields: [
      { key: 'tag', label: 'Inbound Tag', type: 'text' },
      { key: 'sniffingEnabled', label: 'Sniffing Enabled', type: 'select', options: bool },
      { key: 'sniffingDestOverride', label: 'Sniffing destOverride', type: 'text', placeholder: 'http,tls,quic' }
    ]
  },
  {
    id: 'http',
    label: 'HTTP',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text', placeholder: '0.0.0.0' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 8080 },
      { key: 'accounts', label: 'Accounts (JSON)', type: 'textarea', placeholder: '[{"user":"u","pass":"p"}]' }
    ],
    optionalFields: [
      { key: 'allowTransparent', label: 'Allow Transparent', type: 'select', options: bool },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number' },
      { key: 'userLevel', label: 'User Level', type: 'number' }
    ]
  },
  {
    id: 'shadowsocks',
    label: 'Shadowsocks',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text', placeholder: '0.0.0.0' },
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
      { key: 'network', label: 'Network', type: 'select', options: [{ value: 'tcp', label: 'tcp' }, { value: 'udp', label: 'udp' }, { value: 'tcp,udp', label: 'tcp,udp' }] },
      { key: 'ivCheck', label: 'IV Check', type: 'select', options: bool },
      { key: 'email', label: 'Client Email', type: 'text' },
      { key: 'level', label: 'Client Level', type: 'number' }
    ]
  },
  {
    id: 'socks',
    label: 'SOCKS',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text', placeholder: '0.0.0.0' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 1080 },
      { key: 'auth', label: 'Auth', type: 'select', options: [{ value: 'noauth', label: 'noauth' }, { value: 'password', label: 'password' }] }
    ],
    optionalFields: [
      { key: 'udp', label: 'UDP', type: 'select', options: bool },
      { key: 'accounts', label: 'Accounts (JSON)', type: 'textarea', placeholder: '[{"user":"u","pass":"p"}]' },
      { key: 'ip', label: 'Bind IP', type: 'text' }
    ]
  },
  {
    id: 'trojan',
    label: 'Trojan',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'passwords', label: 'Passwords (JSON)', type: 'textarea', placeholder: '[{"password":"..."}]' }
    ],
    optionalFields: [
      { key: 'fallbacks', label: 'Fallbacks (JSON)', type: 'textarea' },
      { key: 'clients', label: 'Clients (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'vless',
    label: 'VLESS',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 443 },
      { key: 'clients', label: 'Clients (JSON)', type: 'textarea', placeholder: '[{"id":"uuid","flow":"xtls-rprx-vision"}]' }
    ],
    optionalFields: [
      { key: 'decryption', label: 'Decryption', type: 'text', placeholder: 'none' },
      { key: 'fallbacks', label: 'Fallbacks (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'vmess',
    label: 'VMess',
    primaryFields: [
      { key: 'listen', label: 'Listen IP', type: 'text' },
      { key: 'port', label: 'Port', type: 'number', defaultValue: 10086 },
      { key: 'clients', label: 'Clients (JSON)', type: 'textarea', placeholder: '[{"id":"uuid","alterId":0}]' }
    ],
    optionalFields: [
      { key: 'disableInsecureEncryption', label: 'Disable Insecure Encryption', type: 'select', options: bool },
      { key: 'defaultLevel', label: 'Default Level', type: 'number' }
    ]
  },
  {
    id: 'wireguard',
    label: 'WireGuard',
    primaryFields: [
      { key: 'secretKey', label: 'Secret Key', type: 'text' },
      { key: 'address', label: 'Address (comma separated)', type: 'text', placeholder: '10.0.0.2/32,fd00::2/128' },
      { key: 'mtu', label: 'MTU', type: 'number', defaultValue: 1420 }
    ],
    optionalFields: [
      { key: 'workers', label: 'Workers', type: 'number' },
      { key: 'domainStrategy', label: 'Domain Strategy', type: 'select', options: [{ value: 'AsIs', label: 'AsIs' }, { value: 'UseIP', label: 'UseIP' }] },
      { key: 'peers', label: 'Peers (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'tun',
    label: 'TUN',
    primaryFields: [
      { key: 'name', label: 'Device Name', type: 'text', placeholder: 'tun0' },
      { key: 'mtu', label: 'MTU', type: 'number', defaultValue: 9000 },
      { key: 'stack', label: 'Stack', type: 'select', options: [{ value: 'system', label: 'system' }, { value: 'gvisor', label: 'gvisor' }, { value: 'mixed', label: 'mixed' }] }
    ],
    optionalFields: [
      { key: 'autoRoute', label: 'Auto Route', type: 'select', options: bool },
      { key: 'strictRoute', label: 'Strict Route', type: 'select', options: bool },
      { key: 'dnsHijack', label: 'DNS Hijack (JSON/array)', type: 'textarea', placeholder: '["any:53"]' }
    ]
  }
];
