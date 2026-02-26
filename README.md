# Proxy Config Studio

A modern, modular static web app for **GitHub Pages** to manage proxy definitions.

## What is implemented now

- Xray-first modular architecture (Sing-box and Mihomo are ready as future engines).
- Schema-driven editor with protocol-aware fields.
- Editor layout: **main fields first**, then **optional fields**.
- Protocol-specific transport selection (only valid transports are shown for selected protocol).
- Import proxies from:
  - messy text
  - clipboard
  - file (`.txt`, `.json`, `.conf`)
  - subscription URL payload
- Supports parsing common links: `vless`, `vmess`, `trojan`, `ss`, `socks`, `wireguard`, `hysteria2` and WireGuard INI-like `.conf` blocks.
- Parsed proxies are shown in table and remain fully editable.
- Output supported as:
  - copy to clipboard
  - downloadable file (`proxies.txt`)
- GitHub Pages friendly and includes favicon.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Deploy to GitHub Pages

1. Push to GitHub.
2. Settings → Pages.
3. Select branch and root `/`.
4. Save.
