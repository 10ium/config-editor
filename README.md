# Proxy Config Studio

A modern, modular static web app for **GitHub Pages** to manage proxy definitions.

## What is implemented now

- Xray-first modular architecture (Sing-box and Mihomo are ready as future engines).
- Schema-driven editor with protocol-aware fields and protocol-specific transport options.
- Editor layout: **main fields first**, then **optional fields**.
- Import proxies from plain text or Base64 payloads.
- Import sources:
  - textarea input
  - clipboard
  - file (`.txt`, `.json`, `.conf`)
  - subscription URL payload
- Supports parsing common links: `vless`, `vmess`, `trojan`, `ss`, `socks`, `wireguard`, `hysteria2` and WireGuard INI-like `.conf` blocks.
- Pagination with configurable rows-per-page.
- Row selection with checkboxes for bulk actions.
- Bulk rename for selected/all rows with optional unique incremental numbering (`1-prefix`, `2-prefix`, ...).
- Output options:
  - copy selected/all rows to clipboard
  - download selected/all rows to file (`proxies.txt`)
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
