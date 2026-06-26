const I18n = {
  locale: localStorage.getItem('oncoai_lang') || 'en',
  translations: {},
  ready: false,

  async load(locale) {
    try {
      const resp = await fetch(`/static/i18n/${locale}.json`);
      if (!resp.ok) throw new Error('Failed to load translations');
      this.translations = await resp.json();
      this.locale = locale;
      this.ready = true;
      localStorage.setItem('oncoai_lang', locale);
      this.applyToDOM();
    } catch (e) {
      console.warn('i18n load failed:', e);
      if (locale !== 'en') return this.load('en');
    }
  },

  t(key, params) {
    let val = key.split('.').reduce((o, k) => o?.[k], this.translations);
    if (val === undefined) return key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => { val = val.replace(`{${k}}`, v); });
    }
    return val;
  },

  applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (val !== key) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const val = this.t(key);
      if (val !== key) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const val = this.t(key);
      if (val !== key) el.title = val;
    });
  },

  async init() {
    await this.load(this.locale);
  }
};
