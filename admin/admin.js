// ========== Admin Panel JS ==========
const API = '';

// ========== STATE ==========
let currentSection = 'reports';
let editingReportId = null;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  const res = await fetch(`${API}/api/auth/check`);
  const data = await res.json();
  if (data.authenticated) {
    showDashboard();
  }

  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Sidebar navigation
  document.querySelectorAll('.sidebar__link[data-section]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Reports
  document.getElementById('btn-add-report').addEventListener('click', () => showReportForm());
  document.getElementById('btn-cancel-report').addEventListener('click', hideReportForm);
  document.getElementById('btn-cancel-report-2').addEventListener('click', hideReportForm);
  document.getElementById('report-form').addEventListener('submit', handleSaveReport);

  // Settings
  document.getElementById('settings-form').addEventListener('submit', handleSaveSettings);

  // Pricing
  document.getElementById('pricing-form').addEventListener('submit', handleSavePricing);

  // Password
  document.getElementById('password-form').addEventListener('submit', handleChangePassword);
});

// ========== AUTH ==========
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      showDashboard();
    } else {
      errorEl.textContent = data.error || 'Erreur de connexion';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Erreur réseau';
    errorEl.style.display = 'block';
  }
}

async function handleLogout() {
  await fetch(`${API}/api/auth/logout`, { method: 'POST' });
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-password').value = '';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
  loadReports();
  loadSettings();
  loadPricing();
}

// ========== NAVIGATION ==========
function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('.sidebar__link[data-section]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.toggle('is-active', sec.id === `section-${section}`);
  });
}

// ========== REPORTS ==========
const SECTOR_MAP = {
  energy: { icon: '⚡', label: 'Énergie & Mobilité' },
  cyber: { icon: '🛡️', label: 'Cybersécurité' },
  industry: { icon: '🏭', label: 'Industrie & Supply Chain' },
  health: { icon: '🏥', label: 'Santé & Consommation régulée' }
};

async function loadReports() {
  const res = await fetch(`${API}/api/reports`);
  const reports = await res.json();
  renderReportsList(reports);
}

function renderReportsList(reports) {
  const container = document.getElementById('reports-list');
  if (!reports.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📭</div>
        <p class="empty-state__text">Aucun rapport publié. Cliquez sur « Ajouter un rapport » pour commencer.</p>
      </div>`;
    return;
  }

  container.innerHTML = reports.map(r => {
    const sector = SECTOR_MAP[r.sector] || { icon: '📄', label: r.sector };
    return `
      <div class="report-row">
        <div class="report-row__sector">${sector.icon}</div>
        <div class="report-row__info">
          <div class="report-row__title">${escapeHtml(r.title)}</div>
          <div class="report-row__meta">
            <span>${sector.label}</span>
            <span>${r.pages || '—'} pages</span>
            <span>${r.dateLabel || r.date || '—'}</span>
            <span>${r.price ? r.price + '€ HT' : '—'}</span>
            ${r.fileUrl ? '<span class="report-row__badge" style="background:var(--primary);color:#fff;border-color:var(--primary)">PDF 📄</span>' : ''}
            ${r.isNew ? '<span class="report-row__badge">Nouveau</span>' : ''}
          </div>
        </div>
        <div class="report-row__actions">
          <button class="btn btn--ghost btn--sm" onclick="editReport('${r.id}')">✏️ Modifier</button>
          <button class="btn btn--danger btn--sm" onclick="deleteReport('${r.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function showReportForm(report = null) {
  editingReportId = report ? report.id : null;
  document.getElementById('report-form-title').textContent = report ? 'Modifier le rapport' : 'Nouveau rapport';
  document.getElementById('reports-list').style.display = 'none';
  document.getElementById('btn-add-report').style.display = 'none';
  document.getElementById('report-form-container').style.display = 'block';

  // Fill form
  document.getElementById('rf-id').value = report ? report.id : '';
  document.getElementById('rf-title').value = report ? report.title : '';
  document.getElementById('rf-titleEn').value = report ? (report.titleEn || '') : '';
  document.getElementById('rf-sector').value = report ? report.sector : 'energy';
  document.getElementById('rf-price').value = report ? report.price : '';
  document.getElementById('rf-date').value = report ? report.date : '';
  document.getElementById('rf-dateLabel').value = report ? (report.dateLabel || '') : '';
  document.getElementById('rf-dateLabelEn').value = report ? (report.dateLabelEn || '') : '';
  document.getElementById('rf-file').value = '';
  document.getElementById('rf-file-current').textContent = report && report.fileUrl ? `Fichier actuel : ${report.fileUrl.split('/').pop()}` : '';
  document.getElementById('rf-pages').value = report ? (report.pages || '') : '';
  document.getElementById('rf-format').value = report ? (report.format || 'PDF + Excel') : 'PDF + Excel';
  document.getElementById('rf-sources').value = report ? (report.sources || '') : '';
  document.getElementById('rf-scope').value = report ? (report.scope || '') : '';
  document.getElementById('rf-scopeEn').value = report ? (report.scopeEn || '') : '';
  document.getElementById('rf-lang').value = report ? (report.lang || 'Français') : 'Français';
  document.getElementById('rf-isNew').checked = report ? report.isNew : true;
  document.getElementById('rf-excerpt').value = report ? report.excerpt : '';
  document.getElementById('rf-excerptEn').value = report ? (report.excerptEn || '') : '';
  document.getElementById('rf-toc').value = report && report.toc ? report.toc.join('\n') : '';
  document.getElementById('rf-tocEn').value = report && report.tocEn ? report.tocEn.join('\n') : '';
  document.getElementById('rf-methodology').value = report ? (report.methodology || '') : '';
  document.getElementById('rf-methodologyEn').value = report ? (report.methodologyEn || '') : '';
  document.getElementById('rf-keyFigures').value = report && report.keyFigures ? JSON.stringify(report.keyFigures, null, 2) : '';
}

function hideReportForm() {
  document.getElementById('report-form-container').style.display = 'none';
  document.getElementById('reports-list').style.display = 'flex';
  document.getElementById('btn-add-report').style.display = '';
  editingReportId = null;
}

async function editReport(id) {
  const res = await fetch(`${API}/api/reports/${id}`);
  const report = await res.json();
  showReportForm(report);
}

async function deleteReport(id) {
  if (!confirm('Supprimer ce rapport ? Cette action est irréversible.')) return;

  const res = await fetch(`${API}/api/reports/${id}`, { method: 'DELETE' });
  if (res.ok) loadReports();
}

async function handleSaveReport(e) {
  e.preventDefault();

  const sectorSelect = document.getElementById('rf-sector');
  const sectorOption = sectorSelect.options[sectorSelect.selectedIndex];
  const sectorInfo = SECTOR_MAP[sectorSelect.value] || {};

  const report = {
    title: document.getElementById('rf-title').value,
    titleEn: document.getElementById('rf-titleEn').value,
    sector: sectorSelect.value,
    sectorLabel: sectorInfo.label || '',
    sectorIcon: sectorInfo.icon || '📄',
    price: parseInt(document.getElementById('rf-price').value) || 0,
    date: document.getElementById('rf-date').value,
    dateLabel: document.getElementById('rf-dateLabel').value,
    dateLabelEn: document.getElementById('rf-dateLabelEn').value,
    pages: parseInt(document.getElementById('rf-pages').value) || 0,
    format: document.getElementById('rf-format').value,
    sources: parseInt(document.getElementById('rf-sources').value) || 0,
    scope: document.getElementById('rf-scope').value,
    scopeEn: document.getElementById('rf-scopeEn').value,
    lang: document.getElementById('rf-lang').value,
    langEn: document.getElementById('rf-lang').value === 'Français' ? 'French' : document.getElementById('rf-lang').value,
    isNew: document.getElementById('rf-isNew').checked,
    excerpt: document.getElementById('rf-excerpt').value,
    excerptEn: document.getElementById('rf-excerptEn').value,
    toc: document.getElementById('rf-toc').value.split('\n').filter(l => l.trim()),
    tocEn: document.getElementById('rf-tocEn').value.split('\n').filter(l => l.trim()),
    methodology: document.getElementById('rf-methodology').value,
    methodologyEn: document.getElementById('rf-methodologyEn').value,
  };

  // Parse key figures
  const kfRaw = document.getElementById('rf-keyFigures').value.trim();
  if (kfRaw) {
    try { report.keyFigures = JSON.parse(kfRaw); } catch { report.keyFigures = []; }
  }

  // Assign sector EN labels
  const sectorEnMap = { energy: 'Energy & Mobility', cyber: 'Cybersecurity', industry: 'Industry & Supply Chain', health: 'Health & Regulated Consumer' };
  report.sectorLabelEn = sectorEnMap[report.sector] || report.sectorLabel;

  const formData = new FormData();
  Object.keys(report).forEach(key => {
    if (Array.isArray(report[key])) {
      formData.append(key, JSON.stringify(report[key]));
    } else if (typeof report[key] === 'boolean') {
      formData.append(key, report[key] ? 'true' : 'false');
    } else {
      formData.append(key, report[key] === null || report[key] === undefined ? '' : report[key]);
    }
  });

  const fileInput = document.getElementById('rf-file');
  if (fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }

  try {
    let res;
    if (editingReportId) {
      res = await fetch(`${API}/api/reports/${editingReportId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        body: formData
      });
    }

    if (res.ok) {
      hideReportForm();
      loadReports();
    }
  } catch (err) {
    alert('Erreur lors de la sauvegarde');
  }
}

// ========== SETTINGS ==========
async function loadSettings() {
  const res = await fetch(`${API}/api/settings`);
  const s = await res.json();
  document.getElementById('sf-companyName').value = s.companyName || '';
  document.getElementById('sf-email').value = s.email || '';
  document.getElementById('sf-phone').value = s.phone || '';
  document.getElementById('sf-address').value = s.address || '';
  document.getElementById('sf-hours').value = s.hours || '';
  document.getElementById('sf-hoursEn').value = s.hoursEn || '';
  document.getElementById('sf-description').value = s.description || '';
  document.getElementById('sf-descriptionEn').value = s.descriptionEn || '';
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const settings = {
    companyName: document.getElementById('sf-companyName').value,
    email: document.getElementById('sf-email').value,
    phone: document.getElementById('sf-phone').value,
    address: document.getElementById('sf-address').value,
    hours: document.getElementById('sf-hours').value,
    hoursEn: document.getElementById('sf-hoursEn').value,
    description: document.getElementById('sf-description').value,
    descriptionEn: document.getElementById('sf-descriptionEn').value,
  };

  const res = await fetch(`${API}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  if (res.ok) {
    const el = document.getElementById('settings-success');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
  }
}

// ========== PRICING ==========
async function loadPricing() {
  const res = await fetch(`${API}/api/pricing`);
  const p = await res.json();

  // Unit
  if (p.unit) {
    document.getElementById('pf-unit-name').value = p.unit.name || '';
    document.getElementById('pf-unit-nameEn').value = p.unit.nameEn || '';
    document.getElementById('pf-unit-price').value = p.unit.price || '';
    document.getElementById('pf-unit-period').value = p.unit.period || '';
    document.getElementById('pf-unit-periodEn').value = p.unit.periodEn || '';
    document.getElementById('pf-unit-desc').value = p.unit.desc || '';
    document.getElementById('pf-unit-descEn').value = p.unit.descEn || '';
    document.getElementById('pf-unit-features').value = (p.unit.features || []).join('\n');
    document.getElementById('pf-unit-featuresEn').value = (p.unit.featuresEn || []).join('\n');
  }

  // Bundle
  if (p.bundle) {
    document.getElementById('pf-bundle-name').value = p.bundle.name || '';
    document.getElementById('pf-bundle-nameEn').value = p.bundle.nameEn || '';
    document.getElementById('pf-bundle-price').value = p.bundle.price || '';
    document.getElementById('pf-bundle-period').value = p.bundle.period || '';
    document.getElementById('pf-bundle-periodEn').value = p.bundle.periodEn || '';
    document.getElementById('pf-bundle-desc').value = p.bundle.desc || '';
    document.getElementById('pf-bundle-descEn').value = p.bundle.descEn || '';
    document.getElementById('pf-bundle-features').value = (p.bundle.features || []).join('\n');
    document.getElementById('pf-bundle-featuresEn').value = (p.bundle.featuresEn || []).join('\n');
  }

  // Custom
  if (p.custom) {
    document.getElementById('pf-custom-name').value = p.custom.name || '';
    document.getElementById('pf-custom-nameEn').value = p.custom.nameEn || '';
    document.getElementById('pf-custom-priceLabel').value = p.custom.priceLabel || '';
    document.getElementById('pf-custom-priceLabelEn').value = p.custom.priceLabelEn || '';
    document.getElementById('pf-custom-desc').value = p.custom.desc || '';
    document.getElementById('pf-custom-descEn').value = p.custom.descEn || '';
    document.getElementById('pf-custom-features').value = (p.custom.features || []).join('\n');
    document.getElementById('pf-custom-featuresEn').value = (p.custom.featuresEn || []).join('\n');
  }
}

async function handleSavePricing(e) {
  e.preventDefault();
  const pricing = {
    unit: {
      name: document.getElementById('pf-unit-name').value,
      nameEn: document.getElementById('pf-unit-nameEn').value,
      price: parseInt(document.getElementById('pf-unit-price').value) || 0,
      period: document.getElementById('pf-unit-period').value,
      periodEn: document.getElementById('pf-unit-periodEn').value,
      desc: document.getElementById('pf-unit-desc').value,
      descEn: document.getElementById('pf-unit-descEn').value,
      fromLabel: 'À partir de',
      fromLabelEn: 'Starting at',
      features: document.getElementById('pf-unit-features').value.split('\n').filter(l => l.trim()),
      featuresEn: document.getElementById('pf-unit-featuresEn').value.split('\n').filter(l => l.trim()),
      ctaLabel: 'Explorer les rapports',
      ctaLabelEn: 'Explore reports',
      ctaLink: 'catalogue.html'
    },
    bundle: {
      name: document.getElementById('pf-bundle-name').value,
      nameEn: document.getElementById('pf-bundle-nameEn').value,
      price: parseInt(document.getElementById('pf-bundle-price').value) || 0,
      period: document.getElementById('pf-bundle-period').value,
      periodEn: document.getElementById('pf-bundle-periodEn').value,
      desc: document.getElementById('pf-bundle-desc').value,
      descEn: document.getElementById('pf-bundle-descEn').value,
      fromLabel: 'À partir de',
      fromLabelEn: 'Starting at',
      featured: true,
      features: document.getElementById('pf-bundle-features').value.split('\n').filter(l => l.trim()),
      featuresEn: document.getElementById('pf-bundle-featuresEn').value.split('\n').filter(l => l.trim()),
      ctaLabel: 'Nous contacter',
      ctaLabelEn: 'Contact us',
      ctaLink: 'contact.html'
    },
    custom: {
      name: document.getElementById('pf-custom-name').value,
      nameEn: document.getElementById('pf-custom-nameEn').value,
      priceLabel: document.getElementById('pf-custom-priceLabel').value,
      priceLabelEn: document.getElementById('pf-custom-priceLabelEn').value,
      desc: document.getElementById('pf-custom-desc').value,
      descEn: document.getElementById('pf-custom-descEn').value,
      features: document.getElementById('pf-custom-features').value.split('\n').filter(l => l.trim()),
      featuresEn: document.getElementById('pf-custom-featuresEn').value.split('\n').filter(l => l.trim()),
      ctaLabel: 'Rapport sur mesure',
      ctaLabelEn: 'Custom report',
      ctaLink: 'demande.html'
    }
  };

  const res = await fetch(`${API}/api/pricing`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pricing)
  });

  if (res.ok) {
    const el = document.getElementById('pricing-success');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
  }
}

// ========== PASSWORD ==========
async function handleChangePassword(e) {
  e.preventDefault();
  const errorEl = document.getElementById('password-error');
  const successEl = document.getElementById('password-success');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const current = document.getElementById('pw-current').value;
  const newPw = document.getElementById('pw-new').value;
  const confirm = document.getElementById('pw-confirm').value;

  if (newPw !== confirm) {
    errorEl.textContent = 'Les mots de passe ne correspondent pas';
    errorEl.style.display = 'block';
    return;
  }

  const res = await fetch(`${API}/api/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: current, newPassword: newPw })
  });
  const data = await res.json();

  if (res.ok) {
    successEl.style.display = 'block';
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
  } else {
    errorEl.textContent = data.error || 'Erreur';
    errorEl.style.display = 'block';
  }
}

// ========== UTILS ==========
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
