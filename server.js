const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== Middleware ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'meridian-research-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

// Serve static files (existing site)
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  extensions: ['html']
}));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ========== Data Helpers ==========
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-]/g, '-');
    cb(null, `${basename.substring(0, 30)}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });

function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return null;
  }
}

function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// ========== Admin Credentials ==========
// Default: admin / meridian2026 — stored hashed
const ADMIN_CREDENTIALS_FILE = path.join(DATA_DIR, 'admin.json');

function getAdminCredentials() {
  try {
    return JSON.parse(fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf-8'));
  } catch {
    // Create default credentials on first run
    const hash = bcrypt.hashSync('meridian2026', 10);
    const creds = { username: 'admin', passwordHash: hash };
    fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
    return creds;
  }
}

// ========== Auth Middleware ==========
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Non autorisé. Veuillez vous connecter.' });
}

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const creds = getAdminCredentials();

  if (username === creds.username && bcrypt.compareSync(password, creds.passwordHash)) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true, message: 'Connexion réussie' });
  } else {
    res.status(401).json({ error: 'Identifiants incorrects' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Déconnexion réussie' });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.put('/api/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const creds = getAdminCredentials();

  if (!bcrypt.compareSync(currentPassword, creds.passwordHash)) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
  }

  creds.passwordHash = bcrypt.hashSync(newPassword, 10);
  fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
  res.json({ success: true, message: 'Mot de passe modifié' });
});

// ========== REPORTS API ==========
app.get('/api/reports', (req, res) => {
  const reports = readJSON('reports.json') || [];
  res.json(reports);
});

app.get('/api/reports/:id', (req, res) => {
  const reports = readJSON('reports.json') || [];
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Rapport non trouvé' });
  res.json(report);
});

app.post('/api/reports', requireAuth, upload.single('file'), (req, res) => {
  const reports = readJSON('reports.json') || [];
  let newReport = { ...req.body };

  // Parse stringified fields from FormData
  ['pages', 'price', 'sources'].forEach(field => {
    if (newReport[field]) newReport[field] = parseInt(newReport[field], 10);
  });
  if (newReport.isNew === 'true') newReport.isNew = true;
  if (newReport.isNew === 'false') newReport.isNew = false;
  if (typeof newReport.toc === 'string') {
    try { newReport.toc = JSON.parse(newReport.toc) } catch(e){}
  }
  if (typeof newReport.tocEn === 'string') {
    try { newReport.tocEn = JSON.parse(newReport.tocEn) } catch(e){}
  }
  if (typeof newReport.keyFigures === 'string') {
    try { newReport.keyFigures = JSON.parse(newReport.keyFigures) } catch(e){}
  }

  // Handle uploaded file
  if (req.file) {
    newReport.fileUrl = `/uploads/${req.file.filename}`;
  }

  // Generate ID from title if not provided
  if (!newReport.id) {
    newReport.id = newReport.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 60);
  }

  // Check duplicate ID
  if (reports.find(r => r.id === newReport.id)) {
    newReport.id += '-' + Date.now();
  }

  reports.push(newReport);
  writeJSON('reports.json', reports);
  res.status(201).json(newReport);
});

app.put('/api/reports/:id', requireAuth, upload.single('file'), (req, res) => {
  const reports = readJSON('reports.json') || [];
  const index = reports.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rapport non trouvé' });

  let updatedData = { ...req.body };

  // Parse stringified fields from FormData
  ['pages', 'price', 'sources'].forEach(field => {
    if (updatedData[field]) updatedData[field] = parseInt(updatedData[field], 10);
  });
  if (updatedData.isNew === 'true') updatedData.isNew = true;
  if (updatedData.isNew === 'false') updatedData.isNew = false;
  if (typeof updatedData.toc === 'string') {
    try { updatedData.toc = JSON.parse(updatedData.toc) } catch(e){}
  }
  if (typeof updatedData.tocEn === 'string') {
    try { updatedData.tocEn = JSON.parse(updatedData.tocEn) } catch(e){}
  }
  if (typeof updatedData.keyFigures === 'string') {
    try { updatedData.keyFigures = JSON.parse(updatedData.keyFigures) } catch(e){}
  }

  // Handle uploaded file
  if (req.file) {
    // Delete old file if it exists
    if (reports[index].fileUrl) {
      const oldFilename = reports[index].fileUrl.replace('/uploads/', '');
      const oldPath = path.join(UPLOADS_DIR, oldFilename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    updatedData.fileUrl = `/uploads/${req.file.filename}`;
  }

  reports[index] = { ...reports[index], ...updatedData, id: req.params.id };
  writeJSON('reports.json', reports);
  res.json(reports[index]);
});

app.delete('/api/reports/:id', requireAuth, (req, res) => {
  let reports = readJSON('reports.json') || [];
  const index = reports.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rapport non trouvé' });

  const deleted = reports.splice(index, 1)[0];
  writeJSON('reports.json', reports);

  // Delete associated file
  if (deleted.fileUrl) {
    const filename = deleted.fileUrl.replace('/uploads/', '');
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  res.json({ success: true, deleted: deleted.id });
});

// ========== SETTINGS API ==========
app.get('/api/settings', (req, res) => {
  const settings = readJSON('settings.json') || {};
  res.json(settings);
});

app.put('/api/settings', requireAuth, (req, res) => {
  const current = readJSON('settings.json') || {};
  const updated = { ...current, ...req.body };
  writeJSON('settings.json', updated);
  res.json(updated);
});

// ========== PRICING API ==========
app.get('/api/pricing', (req, res) => {
  const pricing = readJSON('pricing.json') || {};
  res.json(pricing);
});

app.put('/api/pricing', requireAuth, (req, res) => {
  const current = readJSON('pricing.json') || {};
  const updated = { ...current, ...req.body };
  writeJSON('pricing.json', updated);
  res.json(updated);
});

// ========== Fallback: serve index.html for SPA-like routing ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// ========== START ==========
app.listen(PORT, () => {
  console.log(`\n  🔵 Meridian Research — Serveur démarré`);
  console.log(`  📍 Site:  http://localhost:${PORT}`);
  console.log(`  🔧 Admin: http://localhost:${PORT}/admin`);
  console.log(`  📊 API:   http://localhost:${PORT}/api/reports\n`);
});
