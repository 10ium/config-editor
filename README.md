# Proxy Config Studio

A modern, modular static web app designed for **GitHub Pages** to manage proxy definitions.

## Current scope

- ✅ Xray engine support with dynamic schema-driven proxy editing
- ✅ Modular engine architecture for adding Sing-box and Mihomo later
- ✅ Separate files for Xray protocol groups:
  - `inbounds.js`
  - `outbounds.js`
  - `transports.js`
- ✅ Each protocol includes **main fields** and **optional fields**
- ✅ Form fields support both selectable options (`select`) and typed input (`text`, `number`, `textarea`)
- ✅ Node/proxy table with create, edit, delete, search, import, export
- ✅ English-first i18n architecture (easy to add more locales)

## Implemented Xray catalogs

### Inbounds
`tunnel`, `http`, `shadowsocks`, `socks`, `trojan`, `vless`, `vmess`, `wireguard`, `tun`

### Outbounds
`blackhole`, `dns`, `freedom`, `http`, `loopback`, `shadowsocks`, `socks`, `trojan`, `vless`, `vmess`, `wireguard`, `hysteria`

### Transports
`raw`, `xhttp`, `mkcp`, `grpc`, `websocket`, `httpupgrade`, `hysteria`

## Project structure

```text
src/
  core/
    i18n.js
    storage.js
  engines/
    manifest.js
    xray/
      index.js
      protocols/
        inbounds.js
        outbounds.js
        transports.js
  ui/
    app.js
```

## Run locally

```bash
python3 -m http.server 4173
```

Open: `http://localhost:4173`

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open repository **Settings → Pages**.
3. Select branch (for example `main`) and root `/`.
4. Save.

## Next phase

- Add Sing-box catalogs under `src/engines/sing-box/protocols/`.
- Add Mihomo catalogs under `src/engines/mihomo/protocols/`.
- Add additional locales in `src/core/i18n.js`.
