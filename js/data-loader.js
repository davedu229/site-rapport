// ========== Data Loader ==========
// Loads dynamic content from the API and injects it into the DOM.
// This module detects the current page and fetches the appropriate data.

(function() {
  'use strict';

  const API_BASE = '';

  // Detect current page
  const page = detectPage();
  if (page) {
    document.addEventListener('DOMContentLoaded', () => init(page));
  }

  function detectPage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const file = path.split('/').pop() || 'index.html';
    if (file === 'catalogue.html') return 'catalogue';
    if (file === 'rapport.html') return 'report';
    if (file === 'tarifs.html') return 'pricing';
    if (file === 'contact.html') return 'contact';
    if (file === 'paiement.html') return 'checkout';
    if (file === 'index.html' || file === '') return 'home';
    return null;
  }

  async function init(page) {
    try {
      if (page === 'catalogue') await loadCatalogue();
      else if (page === 'report') await loadReportDetail();
      else if (page === 'pricing') await loadPricing();
      else if (page === 'contact') await loadContact();
      else if (page === 'checkout') await loadCheckout();
      else if (page === 'home') await loadHome();
    } catch (err) {
      console.warn('[data-loader] API unavailable, using static content.', err.message);
    }
  }

  // ========== CATALOGUE ==========
  async function loadCatalogue() {
    const res = await fetch(`${API_BASE}/api/reports`);
    if (!res.ok) return;
    const reports = await res.json();
    if (!reports.length) return;

    const grid = document.getElementById('catalogue-grid');
    if (!grid) return;

    const lang = localStorage.getItem('meridian-lang') || 'fr';
    const isFr = lang === 'fr';

    grid.innerHTML = reports.map(r => {
      const title = isFr ? r.title : (r.titleEn || r.title);
      const excerpt = isFr ? r.excerpt : (r.excerptEn || r.excerpt);
      const dateLabel = isFr ? (r.dateLabel || r.date) : (r.dateLabelEn || r.dateLabel || r.date);
      const sectorLabel = isFr ? (r.sectorLabel || r.sector) : (r.sectorLabelEn || r.sectorLabel || r.sector);

      return `
        <div class="report-card" onclick="window.location.href='rapport.html?id=${r.id}'" style="cursor:pointer;" data-sector="${r.sector}" data-date="${r.date}" data-price="${r.price || 0}">
          <div class="report-card__header">
            <span class="report-card__sector">${r.sectorIcon || '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'} ${sectorLabel}</span>
            ${r.isNew ? '<span class="badge badge--new">Nouveau</span>' : ''}
          </div>
          <div class="report-card__body">
            <h3 class="report-card__title">${escapeHtml(title)}</h3>
            <p class="report-card__excerpt">${escapeHtml(excerpt)}</p>
          </div>
          <div class="report-card__meta">
            <span class="report-card__meta-item"><svg class="icon icon-sm text-accent" viewBox="0 0 24 24" style="margin-right: 4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ${r.pages || '—'} pages</span>
            <span class="report-card__meta-item"><svg class="icon icon-sm text-accent" viewBox="0 0 24 24" style="margin-right: 4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dateLabel}</span>
          </div>
          <div class="report-card__footer">
            <div>
              <span class="report-card__price">${r.price ? formatPrice(r.price) : '—'}</span>
              <span class="report-card__price-label"> HT</span>
            </div>
            ${r.fileUrl ? 
              `<a href="${r.fileUrl}" target="_blank" class="btn btn--outline btn--sm" onclick="event.stopPropagation()">${isFr ? 'Aperçu PDF' : 'PDF Preview'}</a>` 
              : 
              `<span class="btn btn--outline btn--sm">${isFr ? 'Détails' : 'Details'}</span>`
            }
          </div>
        </div>`;
    }).join('');

    // Update count
    const countEl = document.getElementById('results-count');
    if (countEl) {
      countEl.textContent = `${reports.length} ${isFr ? 'rapports disponibles' : 'reports available'}`;
    }
  }

  // ========== REPORT DETAIL ==========
  async function loadReportDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const res = await fetch(`${API_BASE}/api/reports/${id}`);
    if (!res.ok) return;
    const r = await res.json();

    const lang = localStorage.getItem('meridian-lang') || 'fr';
    const isFr = lang === 'fr';

    // Update page title
    document.title = `${isFr ? r.title : (r.titleEn || r.title)} — Meridian Research`;

    // Update hero
    const heroH1 = document.querySelector('.page-hero h1');
    if (heroH1) heroH1.textContent = isFr ? r.title : (r.titleEn || r.title);

    const heroP = document.querySelector('.page-hero p:not(.last-update)');
    if (heroP) heroP.textContent = isFr ? r.excerpt : (r.excerptEn || r.excerpt);

    // Update sector badge
    const sectorBadge = document.querySelector('.page-hero .badge--accent');
    if (sectorBadge) {
      const sectorLabel = isFr ? (r.sectorLabel || r.sector) : (r.sectorLabelEn || r.sectorLabel);
      sectorBadge.innerHTML = `${r.sectorIcon || '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'} ${sectorLabel}`;
    }

    // Update metadata
    updateMeta('.report-meta-grid', r, isFr);

    // Update TOC
    const toc = isFr ? r.toc : (r.tocEn || r.toc);
    const tocContainer = document.querySelector('.report-toc');
    if (tocContainer && toc && toc.length) {
      tocContainer.innerHTML = toc.map(item =>
        `<li class="report-toc__item">${escapeHtml(item)}</li>`
      ).join('');
    }

    // Update key figures
    if (r.keyFigures && r.keyFigures.length) {
      const previewCharts = document.querySelectorAll('.report-preview-chart');
      if (previewCharts.length >= 2) {
        const figuresContainer = previewCharts[1].querySelector('div');
        if (figuresContainer) {
          figuresContainer.innerHTML = r.keyFigures.map(kf => `
            <div style="text-align: center;">
              <div style="font-family: var(--font-heading); font-size: var(--fs-3xl); font-weight: 700; background: var(--color-accent-gradient); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">${escapeHtml(kf.value)}</div>
              <div style="font-size: var(--fs-xs); color: var(--color-text-tertiary);">${escapeHtml(isFr ? kf.label : (kf.labelEn || kf.label))}</div>
            </div>
          `).join('');
        }
      }
    }

    // Update methodology
    const methSection = document.querySelectorAll('.report-section')[3]; // 4th section
    if (methSection) {
      const methP = methSection.querySelector('p');
      if (methP && r.methodology) {
        methP.textContent = isFr ? r.methodology : (r.methodologyEn || r.methodology);
      }
    }

    // Update price and buttons in sidebar
    const priceEl = document.querySelector('.report-buy-card__price');
    if (priceEl && r.price) priceEl.textContent = formatPrice(r.price);

    const buyBtn = document.querySelector('.report-buy-card .btn--primary');
    if (buyBtn) {
      buyBtn.href = `paiement.html?id=${r.id}`;
    }

    const previewBtn = document.querySelector('.report-buy-card .btn--secondary');
    if (previewBtn) {
      if (r.fileUrl) {
        previewBtn.href = r.fileUrl;
        previewBtn.target = '_blank';
        previewBtn.textContent = isFr ? 'Aperçu PDF' : 'PDF Preview';
        previewBtn.style.display = 'inline-flex';
      } else {
        previewBtn.style.display = 'none';
      }
    }
  }

  function updateMeta(selector, r, isFr) {
    const grid = document.querySelector(selector);
    if (!grid) return;

    const items = grid.querySelectorAll('.report-meta-item__value');
    if (items.length >= 6) {
      items[0].textContent = r.pages || '—';
      items[1].textContent = isFr ? (r.dateLabel || r.date) : (r.dateLabelEn || r.dateLabel || r.date);
      items[2].textContent = r.format || 'PDF + Excel';
      items[3].textContent = isFr ? (r.lang || 'Français') : (r.langEn || r.lang || 'French');
      items[4].textContent = isFr ? (r.scope || '—') : (r.scopeEn || r.scope || '—');
      items[5].textContent = `${r.sources || '—'} sources primaires & secondaires`;
    }
  }

  // ========== PRICING ==========
  async function loadPricing() {
    const res = await fetch(`${API_BASE}/api/pricing`);
    if (!res.ok) return;
    const p = await res.json();

    const lang = localStorage.getItem('meridian-lang') || 'fr';
    const isFr = lang === 'fr';

    const cards = document.querySelectorAll('.pricing-card');
    if (cards.length < 3) return;

    // Unit
    fillPricingCard(cards[0], p.unit, isFr, true);
    // Bundle
    fillPricingCard(cards[1], p.bundle, isFr, true);
    // Custom
    fillPricingCard(cards[2], p.custom, isFr, false);
  }

  function fillPricingCard(card, data, isFr, hasNumericPrice) {
    if (!data) return;
    const nameEl = card.querySelector('.pricing-card__name');
    if (nameEl) nameEl.textContent = isFr ? data.name : (data.nameEn || data.name);

    const descEl = card.querySelector('.pricing-card__desc');
    if (descEl) descEl.textContent = isFr ? data.desc : (data.descEn || data.desc);

    const amountEl = card.querySelector('.pricing-card__amount');
    if (amountEl) {
      if (hasNumericPrice && data.price) {
        amountEl.textContent = formatPrice(data.price);
      } else if (data.priceLabel) {
        amountEl.textContent = isFr ? data.priceLabel : (data.priceLabelEn || data.priceLabel);
      }
    }

    const periodEl = card.querySelector('.pricing-card__period');
    if (periodEl) periodEl.textContent = isFr ? (data.period || '') : (data.periodEn || data.period || '');

    const features = isFr ? data.features : (data.featuresEn || data.features);
    const featuresContainer = card.querySelector('.pricing-card__features');
    if (featuresContainer && features && features.length) {
      featuresContainer.innerHTML = features.map(f =>
        `<div class="pricing-card__feature">${escapeHtml(f)}</div>`
      ).join('');
    }
  }

  // ========== CONTACT ==========
  async function loadContact() {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) return;
    const s = await res.json();

    const lang = localStorage.getItem('meridian-lang') || 'fr';
    const isFr = lang === 'fr';

    // Update contact info cards
    const infoCards = document.querySelectorAll('.contact-info-card__value');
    if (infoCards.length >= 4) {
      infoCards[0].textContent = s.email || '';
      infoCards[1].textContent = s.phone || '';
      infoCards[2].textContent = s.address || '';
      infoCards[3].textContent = isFr ? (s.hours || '') : (s.hoursEn || s.hours || '');
    }
  }

  // ========== HOME ==========
  async function loadHome() {
    // Load settings for footer brand description
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (res.ok) {
        const s = await res.json();
        const lang = localStorage.getItem('meridian-lang') || 'fr';
        const isFr = lang === 'fr';

        // Update footer brand description
        const footerDesc = document.querySelector('.footer-brand p');
        if (footerDesc) {
          footerDesc.textContent = isFr ? (s.description || '') : (s.descriptionEn || s.description || '');
        }
      }
    } catch (e) { /* static fallback */ }
  }

  // ========== CHECKOUT ==========
  async function loadCheckout() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const res = await fetch(`${API_BASE}/api/reports/${id}`);
    if (!res.ok) return;
    const r = await res.json();

    const lang = localStorage.getItem('meridian-lang') || 'fr';
    const isFr = lang === 'fr';

    const titleEl = document.getElementById('checkout-report-title');
    if (titleEl) titleEl.textContent = isFr ? r.title : (r.titleEn || r.title);

    const priceEl = document.getElementById('checkout-report-price');
    if (priceEl && r.price) priceEl.textContent = formatPrice(r.price);

    const totalEl = document.getElementById('checkout-report-total');
    if (totalEl && r.price) {
      const tva = r.price * 0.20;
      const total = r.price + tva;
      totalEl.textContent = formatPrice(total);

      const tvaEl = document.getElementById('checkout-report-tva');
      if (tvaEl) tvaEl.textContent = formatPrice(tva);
    }
  }

  // ========== UTILS ==========
  function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + '€';
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
