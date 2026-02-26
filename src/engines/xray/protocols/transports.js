const bool = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' }
];

export const xrayTransports = [
  {
    id: 'raw',
    label: 'RAW',
    primaryFields: [
      { key: 'transportSecurity', label: 'Security', type: 'select', options: [{ value: 'none', label: 'none' }, { value: 'tls', label: 'tls' }, { value: 'reality', label: 'reality' }] }
    ],
    optionalFields: [
      { key: 'tcpHeaderType', label: 'TCP Header Type', type: 'select', options: [{ value: 'none', label: 'none' }, { value: 'http', label: 'http' }] }
    ]
  },
  {
    id: 'xhttp',
    label: 'XHTTP',
    primaryFields: [
      { key: 'path', label: 'Path', type: 'text', placeholder: '/xhttp' },
      { key: 'host', label: 'Host', type: 'text' }
    ],
    optionalFields: [
      { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'auto', label: 'auto' }, { value: 'packet-up', label: 'packet-up' }, { value: 'stream-up', label: 'stream-up' }] },
      { key: 'extra', label: 'Extra (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'mkcp',
    label: 'mKCP',
    primaryFields: [
      { key: 'seed', label: 'Seed', type: 'text' },
      { key: 'headerType', label: 'Header Type', type: 'select', options: [{ value: 'none', label: 'none' }, { value: 'srtp', label: 'srtp' }, { value: 'utp', label: 'utp' }, { value: 'wechat-video', label: 'wechat-video' }] }
    ],
    optionalFields: [
      { key: 'mtu', label: 'MTU', type: 'number' },
      { key: 'tti', label: 'TTI', type: 'number' },
      { key: 'uplinkCapacity', label: 'Uplink Capacity', type: 'number' },
      { key: 'downlinkCapacity', label: 'Downlink Capacity', type: 'number' },
      { key: 'congestion', label: 'Congestion', type: 'select', options: bool }
    ]
  },
  {
    id: 'grpc',
    label: 'gRPC',
    primaryFields: [
      { key: 'serviceName', label: 'Service Name', type: 'text' }
    ],
    optionalFields: [
      { key: 'multiMode', label: 'Multi Mode', type: 'select', options: bool },
      { key: 'idleTimeout', label: 'Idle Timeout', type: 'number' },
      { key: 'healthCheckTimeout', label: 'Health Check Timeout', type: 'number' }
    ]
  },
  {
    id: 'websocket',
    label: 'WebSocket',
    primaryFields: [
      { key: 'path', label: 'Path', type: 'text', placeholder: '/ws' }
    ],
    optionalFields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea' },
      { key: 'maxEarlyData', label: 'Max Early Data', type: 'number' },
      { key: 'earlyDataHeaderName', label: 'Early Data Header Name', type: 'text' }
    ]
  },
  {
    id: 'httpupgrade',
    label: 'HTTPUpgrade',
    primaryFields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'path', label: 'Path', type: 'text', placeholder: '/upgrade' }
    ],
    optionalFields: [
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea' }
    ]
  },
  {
    id: 'hysteria',
    label: 'Hysteria Transport',
    primaryFields: [
      { key: 'protocol', label: 'Protocol', type: 'select', options: [{ value: 'udp', label: 'udp' }, { value: 'wechat-video', label: 'wechat-video' }, { value: 'faketcp', label: 'faketcp' }] }
    ],
    optionalFields: [
      { key: 'hopInterval', label: 'Hop Interval', type: 'number' },
      { key: 'obfs', label: 'Obfs', type: 'text' },
      { key: 'disableMtuDiscovery', label: 'Disable MTU Discovery', type: 'select', options: bool }
    ]
  }
];
