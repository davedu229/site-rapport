/**
 * MERIDIAN RESEARCH — i18n System
 * Bilingual FR/EN translation with localStorage persistence
 */

const i18n = {
  currentLang: 'fr',
  translations: {},

  async init() {
    // Detect saved language or browser language
    const saved = localStorage.getItem('mr-lang');
    if (saved && (saved === 'fr' || saved === 'en')) {
      this.currentLang = saved;
    } else {
      const browserLang = navigator.language.substring(0, 2);
      this.currentLang = browserLang === 'en' ? 'en' : 'fr';
    }

    // Load translations
    await this.loadTranslations(this.currentLang);
    this.applyTranslations();
    this.updateLangToggle();
    this.updateHtmlLang();
  },

  async loadTranslations(lang) {
    try {
      // Determine base path
      const basePath = this.getBasePath();
      const response = await fetch(`${basePath}locales/${lang}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.translations = await response.json();
    } catch (err) {
      console.warn(`[i18n] Could not load ${lang}.json:`, err.message);
      // Fallback: use inline translations if fetch fails (e.g. file:// protocol)
      this.translations = this.getFallback(lang);
    }
  },

  getBasePath() {
    const path = window.location.pathname;
    // If we're in a subdirectory, adjust path
    return '';
  },

  getFallback(lang) {
    // Minimal fallback for critical UI elements
    if (lang === 'en') {
      return {
        "nav.home": "Home",
        "nav.catalogue": "Reports",
        "nav.pricing": "Pricing",
        "nav.methodology": "Methodology",
        "nav.request": "Custom Report",
        "nav.contact": "Contact",
        "cta.explore": "Explore Reports",
        "cta.request": "Request Custom Report",
        "cta.buy": "Buy Report",
        "cta.contact": "Contact Us",
        "footer.rights": "All rights reserved.",
        "footer.legal": "Legal Notice",
        "footer.cgv": "Terms of Sale",
        "footer.privacy": "Privacy Policy"
      };
    }
    return {
      "nav.home": "Accueil",
      "nav.catalogue": "Rapports",
      "nav.pricing": "Tarifs",
      "nav.methodology": "Méthodologie",
      "nav.request": "Rapport sur mesure",
      "nav.contact": "Contact",
      "cta.explore": "Explorer les rapports",
      "cta.request": "Demander un rapport sur mesure",
      "cta.buy": "Acheter le rapport",
      "cta.contact": "Nous contacter",
      "footer.rights": "Tous droits réservés.",
      "footer.legal": "Mentions légales",
      "footer.cgv": "CGV",
      "footer.privacy": "Politique de confidentialité"
    };
  },

  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.getNestedValue(key);
      if (translation) {
        // Check if it's an attribute (e.g., data-i18n-attr="placeholder")
        const attr = el.getAttribute('data-i18n-attr');
        if (attr) {
          el.setAttribute(attr, translation);
        } else {
          el.textContent = translation;
        }
      }
    });

    // Also handle data-i18n-html for HTML content
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const translation = this.getNestedValue(key);
      if (translation) {
        el.innerHTML = translation;
      }
    });
  },

  getNestedValue(key) {
    // Support dot notation: "hero.title" -> translations["hero.title"] or translations.hero.title
    if (this.translations[key] !== undefined) {
      return this.translations[key];
    }
    // Try nested access
    const parts = key.split('.');
    let value = this.translations;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }
    return typeof value === 'string' ? value : null;
  },

  async switchLang(lang) {
    if (lang === this.currentLang) return;
    this.currentLang = lang;
    localStorage.setItem('mr-lang', lang);
    await this.loadTranslations(lang);
    this.applyTranslations();
    this.updateLangToggle();
    this.updateHtmlLang();
  },

  updateLangToggle() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  },

  updateHtmlLang() {
    document.documentElement.lang = this.currentLang;
  }
};

// Export for use in other scripts
window.i18n = i18n;
