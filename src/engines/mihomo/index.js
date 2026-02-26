import { mihomoInbounds } from './protocols/inbounds.js';
import { mihomoProxies } from './protocols/proxies.js';
import { mihomoTransports } from './protocols/transports.js';

export const mihomoEngine = {
  id: 'mihomo',
  name: 'Mihomo',
  enabled: true,
  protocols: {
    inbounds: mihomoInbounds,
    outbounds: mihomoProxies,
    transports: mihomoTransports
  }
};
