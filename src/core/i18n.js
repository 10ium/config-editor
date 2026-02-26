const dictionaries = {
  en: {
    appTitle: 'Proxy Config Studio',
    appSubtitle: 'Modular Xray-first proxy manager for GitHub Pages',
    engine: 'Engine',
    direction: 'Direction',
    protocol: 'Protocol',
    search: 'Search by name, protocol, endpoint',
    addProxy: 'Add Proxy',
    activeEngine: 'Active engine',
    notEnabled: 'This engine is planned and not enabled yet.',
    inbounds: 'Inbounds',
    outbounds: 'Outbounds',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    noRows: 'No proxies found. Add your first proxy.',
    save: 'Save',
    cancel: 'Cancel',
    all: 'All',
    name: 'Name',
    endpoint: 'Endpoint',
    editProxy: 'Edit Proxy',
    mainFields: 'Main fields',
    optionalFields: 'Optional fields',
    transport: 'Transport',
    security: 'Security',
    importPlaceholder: 'Paste plain text, proxy links, WireGuard .conf, or Base64 payload here',
    importFromText: 'Parse Text/Base64',
    importClipboard: 'Import Clipboard',
    importFile: 'Import File (.txt/.json/.conf)',
    importUrl: 'Import Subscription URL',
    subscriptionUrl: 'https://example.com/subscription',
    copyOutput: 'Copy Output',
    downloadOutput: 'Download Output File',
    perPage: 'Rows per page',
    renamePrefix: 'Rename prefix',
    uniqueNames: 'Make names unique with incremental number prefix',
    renameSelected: 'Rename Selected',
    renameAll: 'Rename All',
    selectAllFiltered: 'Select All (Filtered)',
    clearSelection: 'Clear Selection',
    deleteSelected: 'Delete Selected',
    selectedCount: 'Selected',
    page: 'Page',
    prev: 'Prev',
    next: 'Next'
  }
};

export function createI18n(defaultLocale = 'en') {
  let locale = defaultLocale;
  return {
    t(key) {
      return dictionaries[locale]?.[key] ?? key;
    },
    setLocale(nextLocale) {
      if (dictionaries[nextLocale]) locale = nextLocale;
    },
    get locale() {
      return locale;
    },
    get locales() {
      return Object.keys(dictionaries);
    }
  };
}
