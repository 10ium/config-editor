# Proxy Config Studio

A modern, modular static web app for **GitHub Pages** to manage proxy definitions.

## What is implemented now

- Modular architecture with active Xray and Mihomo engines (Sing-box is ready for next phase).
- Schema-driven editor with protocol-aware fields and protocol-specific transport options.
- Editor layout: **main fields first**, then **optional fields**.
- Import proxies from plain text or Base64 payloads.
- Import sources:
  - textarea input
  - clipboard
  - file (`.txt`, `.json`, `.conf`)
  - subscription URL payload
- Supports parsing common links: `vless`, `vmess`, `trojan`, `ss`, `socks`, `wireguard`, `hysteria2` and WireGuard INI-like `.conf` blocks.
- Mihomo support (proxy catalogs and inbounds catalog) is added.
- Mihomo proxy catalog now includes: direct, dns, http, socks5, ss, ssr, snell, vmess, vless, trojan, anytls, mieru, sudoku, hysteria, hysteria2, tuic, wg, ssh, masque; inbound listeners are also cataloged.
- When current engine is Mihomo, output export is generated as Mihomo YAML (`proxies:` list), including conversion from imported Xray-like rows.
- Pagination with configurable rows-per-page.
- Row selection with checkboxes, including Select All (filtered) and Clear Selection.
- Bulk actions: rename selected/all, delete selected, and optional unique incremental numbering (`1-prefix`, `2-prefix`, ...).
- Output options:
  - copy selected/all rows to clipboard
  - download selected/all rows to file (`proxies.txt`)
- Table UI is hardened for long values (ellipsis/truncation) to prevent layout breaking.
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
