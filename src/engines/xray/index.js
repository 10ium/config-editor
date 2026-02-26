import { xrayInbounds } from './protocols/inbounds.js';
import { xrayOutbounds } from './protocols/outbounds.js';
import { xrayTransports } from './protocols/transports.js';

export const xrayEngine = {
  id: 'xray',
  name: 'Xray',
  enabled: true,
  protocols: {
    inbounds: xrayInbounds,
    outbounds: xrayOutbounds,
    transports: xrayTransports
  }
};
