import { createI18n } from '../core/i18n.js';
import { loadRows, saveRows } from '../core/storage.js';
import { engines, getEngine } from '../engines/manifest.js';
import { exportRowsToUriText, parseFlexibleInput, parseSubscriptionPayload } from '../core/parser.js';

const uid = () => Math.random().toString(36).slice(2, 10);

export function createApp(root) {
  const i18n = createI18n('en');
  const state = {
    engineId: 'xray',
    direction: 'all',
    protocol: 'all',
    search: '',
    perPage: 10,
    page: 1,
    rows: normalizeRows(loadRows()),
    selectedIds: new Set(),
    modalOpen: false,
    draft: null,
    importText: '',
    importUrl: '',
    renameText: '',
    uniqueNames: false
  };

  const render = () => {
    const engine = getEngine(state.engineId);
    const filteredRows = filterRows(state.rows, state);
    const pageRows = paginate(filteredRows, state.page, state.perPage);
    const pageCount = Math.max(1, Math.ceil(filteredRows.length / state.perPage));
    if (state.page > pageCount) state.page = pageCount;

    root.innerHTML = `
      <main class="container">
        <header class="header">
          <div>
            <h1>${i18n.t('appTitle')}</h1>
            <div class="footer">${i18n.t('appSubtitle')}</div>
          </div>
          <div class="badge">${i18n.t('activeEngine')}: ${engine.name}</div>
        </header>

        <section class="card controls">
          <label>${i18n.t('engine')}<select data-field="engineId">${engines.map((item) => `<option value="${item.id}" ${item.id === state.engineId ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label>
          <label>${i18n.t('direction')}<select data-field="direction"><option value="all">${i18n.t('all')}</option><option value="inbound" ${state.direction === 'inbound' ? 'selected' : ''}>${i18n.t('inbounds')}</option><option value="outbound" ${state.direction === 'outbound' ? 'selected' : ''}>${i18n.t('outbounds')}</option></select></label>
          <label>${i18n.t('protocol')}<select data-field="protocol"><option value="all">${i18n.t('all')}</option>${getProtocolOptions(engine, state.direction).map((item) => `<option value="${item.id}" ${item.id === state.protocol ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label>
          <label>${i18n.t('search')}<input data-field="search" value="${escapeHtml(state.search)}" placeholder="${i18n.t('search')}" /></label>
          <label>${i18n.t('perPage')}<select data-field="perPage">${[10,20,50,100].map((n)=>`<option value="${n}" ${state.perPage===n?'selected':''}>${n}</option>`).join('')}</select></label>
          <label>${i18n.t('renamePrefix')}<input data-field="renameText" value="${escapeHtml(state.renameText)}" placeholder="${i18n.t('renamePrefix')}" /></label>
          <label style="display:flex;align-items:center;gap:8px;margin-top:26px;"><input type="checkbox" data-field="uniqueNames" ${state.uniqueNames ? 'checked' : ''} style="width:auto;"/>${i18n.t('uniqueNames')}</label>
        </section>

        ${engine.enabled ? renderPanel(i18n, pageRows, filteredRows.length, state) : `<div class="card empty">${i18n.t('notEnabled')}</div>`}
      </main>
      ${state.modalOpen && state.draft ? renderModal(i18n, engine, state.draft) : ''}
    `;

    bindEvents(state, render);
  };

  render();
}

function renderPanel(i18n, rows, totalCount, state) {
  const selectedCount = state.selectedIds.size;
  return `<section class="card table-wrap" style="margin-top:16px;">
      <div style="padding:12px" class="toolbar">
        <button class="primary" data-action="add">${i18n.t('addProxy')}</button>
        <button class="ghost" data-action="selectAllFiltered">${i18n.t('selectAllFiltered')}</button>
        <button class="ghost" data-action="clearSelection">${i18n.t('clearSelection')}</button>
        <button class="danger" data-action="deleteSelected">${i18n.t('deleteSelected')}</button>
        <button class="ghost" data-action="renameSelected">${i18n.t('renameSelected')}</button>
        <button class="ghost" data-action="renameAll">${i18n.t('renameAll')}</button>
        <button class="ghost" data-action="copyOut">${i18n.t('copyOutput')}</button>
        <button class="ghost" data-action="downloadOut">${i18n.t('downloadOutput')}</button>
      </div>
      <div style="padding:0 12px 12px;" class="footer">${i18n.t('selectedCount')}: ${selectedCount} / ${totalCount}</div>
      <div style="padding:12px;display:grid;grid-template-columns:2fr 1fr;gap:8px;">
        <textarea data-field="importText" rows="5" placeholder="${i18n.t('importPlaceholder')}">${escapeHtml(state.importText)}</textarea>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <input data-field="importUrl" placeholder="${i18n.t('subscriptionUrl')}" value="${escapeHtml(state.importUrl)}" />
          <button data-action="parseText">${i18n.t('importFromText')}</button>
          <button data-action="importClipboard">${i18n.t('importClipboard')}</button>
          <button data-action="importFile">${i18n.t('importFile')}</button>
          <button data-action="importUrl">${i18n.t('importUrl')}</button>
        </div>
      </div>
      ${rows.length ? renderTable(i18n, rows, state.selectedIds, rows.every((item) => state.selectedIds.has(item.id))) : `<div class="empty">${i18n.t('noRows')}</div>`}
      <div class="toolbar" style="padding:12px;justify-content:space-between;">
        <button data-action="prevPage">${i18n.t('prev')}</button>
        <span class="footer">${i18n.t('page')} ${state.page}</span>
        <button data-action="nextPage">${i18n.t('next')}</button>
      </div>
    </section>`;
}

function renderTable(i18n, rows, selectedIds, allVisibleSelected) {
  return `<table><thead><tr><th><input type="checkbox" data-action="selectVisible" style="width:auto" ${allVisibleSelected ? 'checked' : ''} /></th><th>${i18n.t('name')}</th><th>${i18n.t('direction')}</th><th>${i18n.t('protocol')}</th><th>${i18n.t('transport')}</th><th>${i18n.t('endpoint')}</th><th>${i18n.t('actions')}</th></tr></thead><tbody>${rows
    .map(
      (row) => `<tr><td><input type="checkbox" data-action="toggleSelect" data-id="${row.id}" style="width:auto" ${selectedIds.has(row.id) ? 'checked' : ''} /></td><td class="cell" title="${escapeHtml(row.name || '-')}">${escapeHtml(row.name || '-')}</td><td class="cell" title="${escapeHtml(row.direction)}">${escapeHtml(row.direction)}</td><td class="cell" title="${escapeHtml(row.protocolId)}">${escapeHtml(row.protocolId)}</td><td class="cell" title="${escapeHtml(row.transportId)}">${escapeHtml(row.transportId)}</td><td class="cell" title="${escapeHtml(readEndpoint(row))}">${escapeHtml(readEndpoint(row))}</td><td class="actions-cell"><button data-action="edit" data-id="${row.id}">${i18n.t('edit')}</button><button class="danger" data-action="delete" data-id="${row.id}">${i18n.t('delete')}</button></td></tr>`
    )
    .join('')}</tbody></table>`;
}

function renderModal(i18n, engine, draft) {
  const protocolSchema = getProtocolSchema(engine, draft.direction, draft.protocolId);
  const transportOptions = getAllowedTransportOptions(engine, protocolSchema);
  const transportId = transportOptions.some((item) => item.id === draft.transportId) ? draft.transportId : transportOptions[0]?.id || 'raw';
  const transportSchema = getTransportSchema(engine, transportId);
  const mainFields = [...protocolSchema.primaryFields.map((f) => ({ ...f, bucket: 'mainConfig' })), ...transportSchema.primaryFields.map((f) => ({ ...f, bucket: 'transportMain' }))];
  const optionalFields = [...protocolSchema.optionalFields.map((f) => ({ ...f, bucket: 'optionalConfig' })), ...transportSchema.optionalFields.map((f) => ({ ...f, bucket: 'transportOptional' }))];

  return `<div class="modal-backdrop"><section class="card modal"><h3>${i18n.t('editProxy')}</h3><form class="modal-grid" data-form="proxy">
      <label>${i18n.t('name')}<input name="name" value="${escapeHtml(draft.name)}" required /></label>
      <label>${i18n.t('direction')}<select name="direction" data-change="rerender"><option value="inbound" ${draft.direction === 'inbound' ? 'selected' : ''}>${i18n.t('inbounds')}</option><option value="outbound" ${draft.direction === 'outbound' ? 'selected' : ''}>${i18n.t('outbounds')}</option></select></label>
      <label>${i18n.t('protocol')}<select name="protocolId" data-change="rerender">${getProtocolOptions(engine, draft.direction).map((item) => `<option value="${item.id}" ${item.id === draft.protocolId ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label>
      <label>${i18n.t('transport')}<select name="transportId" data-change="rerender">${transportOptions.map((item) => `<option value="${item.id}" ${item.id === transportId ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label>
      <div class="full card" style="padding:12px"><h4>${i18n.t('mainFields')}</h4><div class="modal-grid">${mainFields.map((field) => renderField(draft, field)).join('')}</div></div>
      <div class="full card" style="padding:12px"><h4>${i18n.t('optionalFields')}</h4><div class="modal-grid">${optionalFields.map((field) => renderField(draft, field)).join('')}</div></div>
      <div class="full toolbar"><button type="submit" class="primary">${i18n.t('save')}</button><button type="button" data-action="cancel">${i18n.t('cancel')}</button></div>
    </form></section></div>`;
}

function renderField(draft, field) {
  const name = `cfg__${field.bucket}__${field.key}`;
  const value = draft[field.bucket]?.[field.key] ?? field.defaultValue ?? '';
  if (field.type === 'select') {
    return `<label>${escapeHtml(field.label)}<select name="${name}"><option value=""></option>${field.options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></label>`;
  }
  if (field.type === 'textarea') {
    return `<label class="full">${escapeHtml(field.label)}<textarea name="${name}" rows="3" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(String(value))}</textarea></label>`;
  }
  return `<label>${escapeHtml(field.label)}<input name="${name}" type="${field.type === 'number' ? 'number' : 'text'}" value="${escapeHtml(String(value))}" placeholder="${escapeHtml(field.placeholder || '')}" /></label>`;
}

function bindEvents(state, render) {
  document.querySelectorAll('[data-field]').forEach((control) => {
    const inputType = control.getAttribute('type');
    const eventName = control.tagName === 'SELECT' ? 'change' : 'input';
    control.addEventListener(eventName, (event) => {
      const field = event.currentTarget.dataset.field;
      if (inputType === 'checkbox') {
        state[field] = event.currentTarget.checked;
      } else if (field === 'perPage') {
        state.perPage = Number(event.currentTarget.value) || 10;
        state.page = 1;
      } else {
        state[field] = event.currentTarget.value;
      }
      if (field === 'engineId') {
        state.direction = 'all';
        state.protocol = 'all';
        state.page = 1;
      }
      render();
    });
  });

  on('add', () => {
    const engine = getEngine(state.engineId);
    state.modalOpen = true;
    state.draft = createDefaultDraft(engine);
    render();
  });

  document.querySelectorAll('[data-action="toggleSelect"]').forEach((input) => input.addEventListener('change', (event) => {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    if (event.currentTarget.checked) state.selectedIds.add(id);
    else state.selectedIds.delete(id);
  }));

  on('selectVisible', (event) => {
    const checked = event.currentTarget.checked;
    document.querySelectorAll('[data-action="toggleSelect"]').forEach((el) => {
      const id = el.dataset.id;
      if (!id) return;
      el.checked = checked;
      if (checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
    });
    render();
  });

  document.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener('click', (event) => {
    const row = state.rows.find((item) => item.id === event.currentTarget.dataset.id);
    if (!row) return;
    state.modalOpen = true;
    state.draft = structuredClone(row);
    render();
  }));

  document.querySelectorAll('[data-action="delete"]').forEach((button) => button.addEventListener('click', (event) => {
    const id = event.currentTarget.dataset.id;
    state.rows = state.rows.filter((row) => row.id !== id);
    state.selectedIds.delete(id);
    persist(state);
    render();
  }));

  on('cancel', () => {
    state.modalOpen = false;
    state.draft = null;
    render();
  });

  document.querySelectorAll('[data-change="rerender"]').forEach((control) => control.addEventListener('change', (event) => {
    const form = event.currentTarget.closest('form');
    if (!form || !state.draft) return;
    const fd = new FormData(form);
    state.draft.name = String(fd.get('name') ?? state.draft.name);
    state.draft.direction = String(fd.get('direction') ?? state.draft.direction);
    state.draft.protocolId = String(fd.get('protocolId') ?? state.draft.protocolId);
    const engine = getEngine(state.engineId);
    const schema = getProtocolSchema(engine, state.draft.direction, state.draft.protocolId);
    const allowed = getAllowedTransportOptions(engine, schema);
    const nextTransport = String(fd.get('transportId') ?? state.draft.transportId);
    state.draft.transportId = allowed.some((item) => item.id === nextTransport) ? nextTransport : (allowed[0]?.id ?? 'raw');
    render();
  }));

  const form = document.querySelector('[data-form="proxy"]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const payload = {
        id: state.draft?.id || uid(),
        engineId: state.engineId,
        name: String(fd.get('name') ?? ''),
        direction: String(fd.get('direction') ?? 'outbound'),
        protocolId: String(fd.get('protocolId') ?? 'vless'),
        transportId: String(fd.get('transportId') ?? 'raw'),
        mainConfig: {},
        optionalConfig: {},
        transportMain: {},
        transportOptional: {}
      };

      for (const [key, value] of fd.entries()) {
        if (!key.startsWith('cfg__')) continue;
        const [, bucket, fieldKey] = key.split('__');
        if (!bucket || !fieldKey || !String(value).trim()) continue;
        payload[bucket][fieldKey] = value;
      }

      const index = state.rows.findIndex((item) => item.id === payload.id);
      if (index >= 0) state.rows[index] = payload;
      else state.rows.unshift(payload);
      persist(state);
      state.modalOpen = false;
      state.draft = null;
      render();
    });
  }

  on('parseText', () => {
    const parsed = parseFlexibleInput(state.importText);
    if (!parsed.length) return alert('No supported proxies found.');
    state.rows = mergeRows(state.rows, parsed);
    persist(state);
    render();
  });

  on('importClipboard', async () => {
    try {
      const text = await navigator.clipboard.readText();
      state.importText = text;
      const parsed = parseFlexibleInput(text);
      state.rows = mergeRows(state.rows, parsed);
      persist(state);
      render();
    } catch {
      alert('Clipboard access failed. Paste text manually.');
    }
  });

  on('importFile', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json,.conf';
    input.addEventListener('change', async () => {
      const [file] = input.files || [];
      if (!file) return;
      const text = await file.text();
      try {
        const rows = file.name.endsWith('.json') ? normalizeRows(JSON.parse(text)) : parseFlexibleInput(text);
        state.rows = mergeRows(state.rows, rows);
        state.importText = text;
        persist(state);
        render();
      } catch {
        alert('Invalid import file format.');
      }
    });
    input.click();
  });

  on('importUrl', async () => {
    if (!state.importUrl) return;
    try {
      const res = await fetch(state.importUrl.trim());
      const text = await res.text();
      const parsed = parseSubscriptionPayload(text);
      state.rows = mergeRows(state.rows, parsed);
      state.importText = text;
      persist(state);
      render();
    } catch {
      alert('Subscription fetch failed.');
    }
  });

  on('selectAllFiltered', () => {
    const filtered = filterRows(state.rows, state);
    filtered.forEach((row) => state.selectedIds.add(row.id));
    render();
  });

  on('clearSelection', () => {
    state.selectedIds.clear();
    render();
  });

  on('deleteSelected', () => {
    if (!state.selectedIds.size) return alert('No selected rows.');
    state.rows = state.rows.filter((row) => !state.selectedIds.has(row.id));
    state.selectedIds.clear();
    persist(state);
    render();
  });

  on('renameSelected', () => {
    const targets = state.rows.filter((row) => state.selectedIds.has(row.id));
    if (!targets.length) return alert('No selected rows.');
    bulkRename(targets, state.renameText, state.uniqueNames);
    persist(state);
    render();
  });

  on('renameAll', () => {
    if (!state.rows.length) return;
    bulkRename(state.rows, state.renameText, state.uniqueNames);
    persist(state);
    render();
  });

  on('copyOut', async () => {
    const sourceRows = state.selectedIds.size ? state.rows.filter((row) => state.selectedIds.has(row.id)) : state.rows;
    const text = exportRowsToUriText(sourceRows);
    try {
      await navigator.clipboard.writeText(text);
      alert('Output copied to clipboard.');
    } catch {
      alert('Copy failed.');
    }
  });

  on('downloadOut', () => {
    const sourceRows = state.selectedIds.size ? state.rows.filter((row) => state.selectedIds.has(row.id)) : state.rows;
    const text = exportRowsToUriText(sourceRows);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proxies.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  on('prevPage', () => {
    state.page = Math.max(1, state.page - 1);
    render();
  });

  on('nextPage', () => {
    const filtered = filterRows(state.rows, state);
    const pageCount = Math.max(1, Math.ceil(filtered.length / state.perPage));
    state.page = Math.min(pageCount, state.page + 1);
    render();
  });

  function on(action, handler) {
    document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => button.addEventListener('click', handler));
  }
}

function bulkRename(rows, prefix, unique) {
  const base = prefix?.trim() || 'Proxy';
  rows.forEach((row, index) => {
    if (unique) {
      row.name = `${index + 1}-${base}`;
    } else {
      row.name = base;
    }
  });
}

function paginate(rows, page, perPage) {
  const start = (page - 1) * perPage;
  return rows.slice(start, start + perPage);
}

function persist(state) {
  saveRows(state.rows);
}

function createDefaultDraft(engine) {
  const direction = 'outbound';
  const protocolId = engine.protocols.outbounds[0]?.id ?? 'vless';
  const transportId = getAllowedTransportOptions(engine, getProtocolSchema(engine, direction, protocolId))[0]?.id ?? 'raw';
  return { id: uid(), engineId: engine.id, name: '', direction, protocolId, transportId, mainConfig: {}, optionalConfig: {}, transportMain: {}, transportOptional: {} };
}

function getProtocolOptions(engine, direction) {
  if (direction === 'inbound') return engine.protocols.inbounds;
  if (direction === 'outbound') return engine.protocols.outbounds;
  return [...engine.protocols.inbounds, ...engine.protocols.outbounds];
}

function getProtocolSchema(engine, direction, protocolId) {
  const found = getProtocolOptions(engine, direction).find((item) => item.id === protocolId);
  if (found) {
    return { ...found, allowedTransports: found.allowedTransports?.length ? found.allowedTransports : defaultAllowedTransports(direction, protocolId) };
  }
  return { primaryFields: [], optionalFields: [], allowedTransports: defaultAllowedTransports(direction, protocolId) };
}

function defaultAllowedTransports(direction, protocolId) {
  const inbound = {
    tunnel: ['raw'], http: ['raw'], shadowsocks: ['raw'], socks: ['raw'], trojan: ['raw', 'websocket', 'grpc', 'httpupgrade', 'xhttp'],
    vless: ['raw', 'websocket', 'grpc', 'httpupgrade', 'xhttp', 'mkcp'], vmess: ['raw', 'websocket', 'grpc', 'httpupgrade', 'xhttp', 'mkcp'], wireguard: ['raw'], tun: ['raw']
  };
  const outbound = {
    blackhole: ['raw'], dns: ['raw'], freedom: ['raw'], http: ['raw'], loopback: ['raw'], shadowsocks: ['raw'], socks: ['raw'],
    trojan: ['raw', 'websocket', 'grpc', 'httpupgrade', 'xhttp'], vless: ['raw', 'websocket', 'grpc', 'httpupgrade', 'xhttp', 'mkcp'],
    vmess: ['raw', 'websocket', 'grpc', 'httpupgrade', 'xhttp', 'mkcp'], wireguard: ['raw'], hysteria: ['hysteria']
  };
  const source = direction === 'inbound' ? inbound : outbound;
  return source[protocolId] || ['raw'];
}

function getAllowedTransportOptions(engine, protocolSchema) {
  if (!protocolSchema.allowedTransports?.length) return engine.protocols.transports;
  return engine.protocols.transports.filter((item) => protocolSchema.allowedTransports.includes(item.id));
}

function getTransportSchema(engine, transportId) {
  return engine.protocols.transports.find((item) => item.id === transportId) ?? { primaryFields: [], optionalFields: [] };
}

function filterRows(rows, state) {
  return rows.filter((row) => {
    const passEngine = !row.engineId || row.engineId === state.engineId;
    const passDirection = state.direction === 'all' || row.direction === state.direction;
    const passProtocol = state.protocol === 'all' || row.protocolId === state.protocol || row.protocol === state.protocol;
    const searchText = `${row.name || ''} ${row.protocolId || ''} ${readEndpoint(row)}`.toLowerCase();
    return passEngine && passDirection && passProtocol && (!state.search || searchText.includes(state.search.toLowerCase()));
  });
}

function readEndpoint(row) {
  const host = row.mainConfig?.server || row.mainConfig?.listen || row.mainConfig?.address || row.host || '-';
  const port = row.mainConfig?.port || row.port;
  return port ? `${host}:${port}` : host;
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    id: row.id || uid(),
    engineId: row.engineId || 'xray',
    name: row.name || row.tag || '',
    direction: row.direction || 'outbound',
    protocolId: row.protocolId || row.protocol || 'vless',
    transportId: row.transportId || row.transport || 'raw',
    mainConfig: row.mainConfig || { server: row.host || '', port: row.port || '' },
    optionalConfig: row.optionalConfig || {},
    transportMain: row.transportMain || {},
    transportOptional: row.transportOptional || {}
  }));
}

function mergeRows(baseRows, incomingRows) {
  const map = new Map(baseRows.map((row) => [row.id, row]));
  for (const row of normalizeRows(incomingRows)) {
    const key = `${row.protocolId}|${row.mainConfig?.server || ''}|${row.mainConfig?.port || ''}|${row.mainConfig?.id || row.mainConfig?.password || ''}`;
    const dup = [...map.values()].find((item) => `${item.protocolId}|${item.mainConfig?.server || ''}|${item.mainConfig?.port || ''}|${item.mainConfig?.id || item.mainConfig?.password || ''}` === key);
    if (!dup) map.set(row.id, row);
  }
  return [...map.values()];
}

function escapeHtml(input) {
  return String(input).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
