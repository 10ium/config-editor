import { xrayEngine } from './xray/index.js';
import { mihomoEngine } from './mihomo/index.js';

export const engines = [
  xrayEngine,
  {
    id: 'sing-box',
    name: 'Sing-box',
    enabled: false,
    protocols: { inbounds: [], outbounds: [], transports: [] }
  },
  mihomoEngine
];

export function getEngine(engineId) {
  return engines.find((engine) => engine.id === engineId) ?? engines[0];
}
