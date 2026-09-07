/**
 * PackersMart Backend Entry Point
 * MVC structure: config / models / controllers / routes / middleware
 * Uses MySQL via mysql2 (connects to your local MySQL Workbench instance)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, initDatabase } from './config/db.js';

// Routes
import leadRoutes from './routes/leadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ---------- MIDDLEWARE ----------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple request logger in dev mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  });
}

// ---------- ROUTES ----------
app.use('/api', leadRoutes);
app.use('/api', dashboardRoutes);

// Root welcome
app.get('/', (req, res) => {
  res.json({
    app: 'PackersMart Backend',
    version: '1.0.0',
    database: 'MySQL',
    health: '/api/health',
    endpoints: {
      create_lead:       'POST   /api/leads',
      verify_otp:        'POST   /api/leads/:id/verify-otp',
      resend_otp:        'POST   /api/leads/:id/resend-otp',
      list_leads:        'GET    /api/leads',
      lead_detail:       'GET    /api/leads/:id',
      update_status:     'PATCH  /api/leads/:id/status',
      match_companies:   'GET    /api/leads/:id/matching-companies',
      dashboard:         'GET    /api/dashboard',
      companies:         'GET    /api/companies',
    },
  });
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  console.error('\n❌ Unhandled error:\n', err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// ---------- START SERVER ----------
async function startServer() {
  console.log('\n🚀 PackersMart Backend starting...\n');
  const dbOk = await testConnection();
  if (dbOk) {
    console.log('🗄️  Initialising database schema...');
    await initDatabase();
  } else {
    console.warn('⚠️  Skipping schema init because MySQL connection failed.');
    console.warn('   Fix .env credentials + create DB schema, then restart server.\n');
  }

  app.listen(PORT, () => {
    console.log(`🌐 Server running on   http://localhost:${PORT}`);
    console.log(`🩺 Health check:       http://localhost:${PORT}/api/health`);
    console.log(`📊 Dashboard data:     http://localhost:${PORT}/api/dashboard`);
    console.log(`🚚 Companies list:     http://localhost:${PORT}/api/companies`);
    console.log(`\n💡 OTPs are logged to this console for testing.\n`);
  });
}

startServer();