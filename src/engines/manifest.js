import { xrayEngine } from './xray/index.js';

export const engines = [
  xrayEngine,
  {
    id: 'sing-box',
    name: 'Sing-box',
    enabled: false,
    protocols: { inbounds: [], outbounds: [], transports: [] }
  },
  {
    id: 'mihomo',
    name: 'Mihomo',
    enabled: false,
    protocols: { inbounds: [], outbounds: [], transports: [] }
  }
];

export function getEngine(engineId) {
  return engines.find((engine) => engine.id === engineId) ?? engines[0];
}
