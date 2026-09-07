/**
 * Dashboard & companies routes
 */
import express from 'express';
import * as DashboardCtrl from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/dashboard', DashboardCtrl.getDashboardStats);
router.get('/companies', DashboardCtrl.getAllCompanies);
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PackersMart API is running', database: 'MySQL' });
});

export default router;