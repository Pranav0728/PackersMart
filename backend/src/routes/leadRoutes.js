/**
 * Lead API routes
 * All routes mounted at /api/... in server.js
 */
import express from 'express';
import * as LeadCtrl from '../controllers/leadController.js';

const router = express.Router();

// Lead CRUD + status + matching
router.post('/leads', LeadCtrl.createLead);
router.post('/leads/:id/verify-otp', LeadCtrl.verifyOTP);
router.post('/leads/:id/resend-otp', LeadCtrl.resendOTP);
router.get('/leads', LeadCtrl.fetchLeads);
router.get('/leads/:id', LeadCtrl.fetchLeadDetail);
router.patch('/leads/:id/status', LeadCtrl.patchLeadStatus);
router.get('/leads/:id/matching-companies', LeadCtrl.fetchMatchingCompanies);

export default router;