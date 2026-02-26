import { createI18n } from '../core/i18n.js';
import { loadRows, saveRows } from '../core/storage.js';
import { engines, getEngine } from '../engines/manifest.js';

const uid = () => Math.random().toString(36).slice(2, 10);

export function createApp(root) {
  const i18n = createI18n('en');
  const state = {
    engineId: 'xray',
    direction: 'all',
    protocol: 'all',
    search: '',
    rows: loadRows(),
    modalOpen: false,
    draft: null
  };

  const render = () => {
    const engine = getEngine(state.engineId);
    const filteredRows = filterRows(state.rows, state);

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
          <label>
            ${i18n.t('engine')}
            <select data-field="engineId">
              ${engines
                .map((item) => `<option value="${item.id}" ${item.id === state.engineId ? 'selected' : ''}>${item.name}</option>`)
                .join('')}
            </select>
          </label>
          <label>
            ${i18n.t('direction')}
            <select data-field="direction">
              <option value="all">${i18n.t('all')}</option>
              <option value="inbound" ${state.direction === 'inbound' ? 'selected' : ''}>${i18n.t('inbounds')}</option>
              <option value="outbound" ${state.direction === 'outbound' ? 'selected' : ''}>${i18n.t('outbounds')}</option>
            </select>
          </label>
          <label>
            ${i18n.t('protocol')}
            <select data-field="protocol">
              <option value="all">${i18n.t('all')}</option>
              ${getProtocolOptions(engine, state.direction)
                .map((item) => `<option value="${item.id}" ${item.id === state.protocol ? 'selected' : ''}>${item.label}</option>`)
                .join('')}
            </select>
          </label>
          <label>
            ${i18n.t('search')}
            <input data-field="search" value="${escapeHtml(state.search)}" placeholder="${i18n.t('search')}" />
          </label>
        </section>

        ${engine.enabled ? renderPanel(i18n, filteredRows) : `<div class="card empty">${i18n.t('notEnabled')}</div>`}
      </main>
      ${state.modalOpen && state.draft ? renderModal(i18n, engine, state.draft) : ''}
    `;

    bindEvents(state, render);
  };

  render();
}

function renderPanel(i18n, rows) {
  return `
    <section class="card table-wrap" style="margin-top:16px;">
      <div style="padding:12px" class="toolbar">
        <button class="primary" data-action="add">${i18n.t('addProxy')}</button>
        <button class="ghost" data-action="export">${i18n.t('exportJson')}</button>
        <button class="ghost" data-action="import">${i18n.t('importJson')}</button>
      </div>
      ${
        rows.length
          ? `<table>
            <thead>
              <tr>
                <th>${i18n.t('name')}</th>
                <th>${i18n.t('direction')}</th>
                <th>${i18n.t('protocol')}</th>
                <th>${i18n.t('transport')}</th>
                <th>${i18n.t('endpoint')}</th>
                <th>${i18n.t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `<tr>
                    <td>${escapeHtml(row.name || '-')}</td>
                    <td>${escapeHtml(row.direction)}</td>
                    <td>${escapeHtml(row.protocolId)}</td>
                    <td>${escapeHtml(row.transportId)}</td>
                    <td>${escapeHtml(readEndpoint(row))}</td>
                    <td>
                      <button data-action="edit" data-id="${row.id}">${i18n.t('edit')}</button>
                      <button class="danger" data-action="delete" data-id="${row.id}">${i18n.t('delete')}</button>
                    </td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>`
          : `<div class="empty">${i18n.t('noRows')}</div>`
      }
    </section>
  `;
}

function renderModal(i18n, engine, draft) {
  const protocolSchema = getProtocolSchema(engine, draft.direction, draft.protocolId);
  const transportSchema = getTransportSchema(engine, draft.transportId);
  const mainFields = [
    ...protocolSchema.primaryFields.map((f) => ({ ...f, bucket: 'mainConfig' })),
    ...transportSchema.primaryFields.map((f) => ({ ...f, bucket: 'transportMain' }))
  ];
  const optionalFields = [
    ...protocolSchema.optionalFields.map((f) => ({ ...f, bucket: 'optionalConfig' })),
    ...transportSchema.optionalFields.map((f) => ({ ...f, bucket: 'transportOptional' }))
  ];

  return `
    <div class="modal-backdrop">
      <section class="card modal">
        <h3>${i18n.t('editProxy')}</h3>
        <form class="modal-grid" data-form="proxy">
          <label>
            ${i18n.t('name')}
            <input name="name" value="${escapeHtml(draft.name)}" required />
          </label>
          <label>
            ${i18n.t('direction')}
            <select name="direction" data-change="rerender">
              <option value="inbound" ${draft.direction === 'inbound' ? 'selected' : ''}>${i18n.t('inbounds')}</option>
              <option value="outbound" ${draft.direction === 'outbound' ? 'selected' : ''}>${i18n.t('outbounds')}</option>
            </select>
          </label>
          <label>
            ${i18n.t('protocol')}
            <select name="protocolId" data-change="rerender">
              ${getProtocolOptions(engine, draft.direction)
                .map((item) => `<option value="${item.id}" ${item.id === draft.protocolId ? 'selected' : ''}>${item.label}</option>`)
                .join('')}
            </select>
          </label>
          <label>
            ${i18n.t('transport')}
            <select name="transportId" data-change="rerender">
              ${engine.protocols.transports
                .map((item) => `<option value="${item.id}" ${item.id === draft.transportId ? 'selected' : ''}>${item.label}</option>`)
                .join('')}
            </select>
          </label>

          <div class="full card" style="padding:12px">
            <h4>${i18n.t('mainFields')}</h4>
            <div class="modal-grid">
              ${mainFields.map((field) => renderField(draft, field)).join('')}
            </div>
          </div>

          <div class="full card" style="padding:12px">
            <h4>${i18n.t('optionalFields')}</h4>
            <div class="modal-grid">
              ${optionalFields.map((field) => renderField(draft, field)).join('')}
            </div>
          </div>

          <div class="full toolbar">
            <button type="submit" class="primary">${i18n.t('save')}</button>
            <button type="button" data-action="cancel">${i18n.t('cancel')}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderField(draft, field) {
  const name = `cfg__${field.bucket}__${field.key}`;
  const value = draft[field.bucket]?.[field.key] ?? field.defaultValue ?? '';

  if (field.type === 'select') {
    return `<label>
      ${escapeHtml(field.label)}
      <select name="${name}">
        <option value=""></option>
        ${field.options
          .map((option) => `<option value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`)
          .join('')}
      </select>
    </label>`;
  }

  if (field.type === 'textarea') {
    return `<label class="full">
      ${escapeHtml(field.label)}
      <textarea name="${name}" rows="3" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(String(value))}</textarea>
    </label>`;
  }

  return `<label>
    ${escapeHtml(field.label)}
    <input name="${name}" type="${field.type === 'number' ? 'number' : 'text'}" value="${escapeHtml(String(value))}" placeholder="${escapeHtml(field.placeholder || '')}" />
  </label>`;
}

function bindEvents(state, render) {
  document.querySelectorAll('[data-field]').forEach((control) => {
    control.addEventListener('change', (event) => {
      const field = event.currentTarget.dataset.field;
      state[field] = event.currentTarget.value;
      if (field === 'engineId') {
        state.direction = 'all';
        state.protocol = 'all';
      }
      render();
    });

    if (control.tagName === 'INPUT') {
      control.addEventListener('input', (event) => {
        const field = event.currentTarget.dataset.field;
        state[field] = event.currentTarget.value;
        render();
      });
    }
  });

  document.querySelectorAll('[data-action="add"]').forEach((button) => {
    button.addEventListener('click', () => {
      const engine = getEngine(state.engineId);
      const draft = createDefaultDraft(engine);
      state.modalOpen = true;
      state.draft = draft;
      render();
    });
  });

  document.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const row = state.rows.find((item) => item.id === event.currentTarget.dataset.id);
      if (!row) return;
      state.modalOpen = true;
      state.draft = structuredClone(row);
      render();
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = event.currentTarget.dataset.id;
      state.rows = state.rows.filter((row) => row.id !== id);
      saveRows(state.rows);
      render();
    });
  });

  document.querySelectorAll('[data-action="cancel"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.modalOpen = false;
      state.draft = null;
      render();
    });
  });

  document.querySelectorAll('[data-change="rerender"]').forEach((control) => {
    control.addEventListener('change', (event) => {
      const form = event.currentTarget.closest('form');
      if (!form || !state.draft) return;
      const fd = new FormData(form);
      state.draft.name = String(fd.get('name') ?? state.draft.name ?? '');
      state.draft.direction = String(fd.get('direction') ?? state.draft.direction);
      state.draft.protocolId = String(fd.get('protocolId') ?? state.draft.protocolId);
      state.draft.transportId = String(fd.get('transportId') ?? state.draft.transportId);
      render();
    });
  });

  const form = document.querySelector('[data-form="proxy"]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const engine = getEngine(state.engineId);
      const direction = String(fd.get('direction') ?? 'outbound');
      const protocolId = String(fd.get('protocolId') ?? getProtocolOptions(engine, direction)[0]?.id ?? 'vless');
      const transportId = String(fd.get('transportId') ?? engine.protocols.transports[0]?.id ?? 'raw');

      const payload = {
        id: state.draft?.id || uid(),
        engineId: state.engineId,
        name: String(fd.get('name') ?? ''),
        direction,
        protocolId,
        transportId,
        mainConfig: {},
        optionalConfig: {},
        transportMain: {},
        transportOptional: {}
      };

      for (const [key, value] of fd.entries()) {
        if (!key.startsWith('cfg__')) continue;
        const [, bucket, fieldKey] = key.split('__');
        if (!bucket || !fieldKey) continue;
        if (!String(value).trim()) continue;
        payload[bucket][fieldKey] = value;
      }

      const existingIndex = state.rows.findIndex((item) => item.id === payload.id);
      if (existingIndex >= 0) {
        state.rows[existingIndex] = payload;
      } else {
        state.rows.unshift(payload);
      }

      saveRows(state.rows);
      state.modalOpen = false;
      state.draft = null;
      render();
    });
  }

  document.querySelectorAll('[data-action="export"]').forEach((button) => {
    button.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'proxies.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  document.querySelectorAll('[data-action="import"]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.addEventListener('change', async () => {
        const [file] = input.files || [];
        if (!file) return;
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            state.rows = parsed;
            saveRows(state.rows);
            render();
          }
        } catch {
          alert('Invalid JSON file.');
        }
      });
      input.click();
    });
  });
}

function createDefaultDraft(engine) {
  const direction = 'outbound';
  const protocolId = engine.protocols.outbounds[0]?.id ?? 'vless';
  const transportId = engine.protocols.transports[0]?.id ?? 'raw';
  return {
    id: uid(),
    engineId: engine.id,
    name: '',
    direction,
    protocolId,
    transportId,
    mainConfig: {},
    optionalConfig: {},
    transportMain: {},
    transportOptional: {}
  };
}

function getProtocolOptions(engine, direction) {
  if (direction === 'inbound') return engine.protocols.inbounds;
  if (direction === 'outbound') return engine.protocols.outbounds;
  return [...engine.protocols.inbounds, ...engine.protocols.outbounds];
}

function getProtocolSchema(engine, direction, protocolId) {
  const schema = getProtocolOptions(engine, direction).find((item) => item.id === protocolId);
  return schema ?? { primaryFields: [], optionalFields: [] };
}

function getTransportSchema(engine, transportId) {
  return engine.protocols.transports.find((item) => item.id === transportId) ?? { primaryFields: [], optionalFields: [] };
}

function filterRows(rows, state) {
  return rows.filter((row) => {
    const passEngine = !row.engineId || row.engineId === state.engineId;
    const passDirection = state.direction === 'all' || row.direction === state.direction;
    const passProtocol = state.protocol === 'all' || row.protocolId === state.protocol || row.protocol === state.protocol;
    const searchText = `${row.name || ''} ${row.protocolId || row.protocol || ''} ${readEndpoint(row)}`.toLowerCase();
    const passSearch = !state.search || searchText.includes(state.search.toLowerCase());
    return passEngine && passDirection && passProtocol && passSearch;
  });
}

function readEndpoint(row) {
  const candidate =
    row.mainConfig?.server ||
    row.mainConfig?.listen ||
    row.mainConfig?.address ||
    row.host ||
    '-';
  const port = row.mainConfig?.port || row.port;
  return port ? `${candidate}:${port}` : candidate;
}

function escapeHtml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
