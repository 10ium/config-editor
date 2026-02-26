const dictionaries = {
  en: {
    appTitle: 'Proxy Config Studio',
    appSubtitle: 'Modular Xray-first proxy manager for GitHub Pages',
    engine: 'Engine',
    direction: 'Direction',
    protocol: 'Protocol',
    search: 'Search by name, protocol, endpoint',
    addProxy: 'Add Proxy',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    activeEngine: 'Active engine',
    notEnabled: 'This engine is planned and not enabled yet.',
    inbounds: 'Inbounds',
    outbounds: 'Outbounds',
    transports: 'Transports',
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
    transport: 'Transport'
  }
};

export function createI18n(defaultLocale = 'en') {
  let locale = defaultLocale;

  return {
    t(key) {
      return dictionaries[locale]?.[key] ?? key;
    },
    setLocale(nextLocale) {
      if (dictionaries[nextLocale]) {
        locale = nextLocale;
      }
    },
    get locale() {
      return locale;
    },
    get locales() {
      return Object.keys(dictionaries);
    }
  };
}
