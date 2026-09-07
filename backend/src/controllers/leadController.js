/**
 * Lead Controller — Business logic for all lead-related API endpoints
 * Contains: scoring logic, matching logic, OTP generation/verification
 */
import pool from '../config/db.js';
import * as LeadModel from '../models/leadModel.js';
import * as OTPModel from '../models/otpModel.js';
import * as CompanyModel from '../models/companyModel.js';
import { validateLeadBody, VALID_LEAD_STATUSES } from '../middleware/validationMiddleware.js';

// ============================================================
// Helpers (pure, no DB writes — easily unit-testable)
// ============================================================

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Calculate lead quality score 0..100
 */
export function calculateLeadScore(lead) {
  let score = 0;
  if (lead.email && String(lead.email).trim().length > 0) score += 15;
  if (lead.mobile && String(lead.mobile).replace(/\D/g, '').length >= 10) score += 10;
  if (lead.moving_date) score += 15;
  if (lead.additional_requirements && String(lead.additional_requirements).trim().length > 5) score += 10;
  const premium = ['International', 'Vehicle', 'Warehousing'];
  if (premium.some(s => String(lead.service_type || '').includes(s))) score += 10;
  if (lead.customer_name && String(lead.customer_name).trim().length >= 3) score += 5;
  if (
    lead.pickup_city && lead.destination_city &&
    String(lead.pickup_city).toLowerCase() !== String(lead.destination_city).toLowerCase()
  ) score += 15;
  if (lead.moving_date) {
    const moveDate = new Date(lead.moving_date);
    const now = new Date();
    const diffDays = Math.ceil((moveDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 30) score += 10;
  }
  return Math.min(score, 100);
}

export function getLeadQuality(score) {
  if (score >= 70) return 'Hot';
  if (score >= 45) return 'Warm';
  return 'Cold';
}

/**
 * Rule-based company matching
 * Returns array of [{ company, matchScore }] sorted desc, threshold 55
 */
export function matchCompaniesForLead(lead, companies) {
  const matches = [];
  for (const company of companies) {
    const coverageList = String(company.coverage).toLowerCase().split(',').map(c => c.trim());
    const serviceList = String(company.service_types).toLowerCase().split(',').map(s => s.trim());
    let matchScore = 0;
    if (coverageList.includes(String(lead.pickup_city).toLowerCase())) matchScore += 35;
    if (coverageList.includes(String(lead.destination_city).toLowerCase())) matchScore += 35;
    if (serviceList.includes(String(lead.service_type).toLowerCase())) matchScore += 20;
    const rating = Number(company.rating) || 0;
    if (rating >= 4.5) matchScore += 10;
    else if (rating >= 4.0) matchScore += 5;
    if (matchScore >= 55) matches.push({ company, matchScore });
  }
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================================
// Route handlers (req, res)
// ============================================================

/**
 * POST /api/leads — Create a lead + OTP
 */
export async function createLead(req, res) {
  try {
    const errors = validateLeadBody(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const data = req.body;

    const dup = await LeadModel.findDuplicateLead(data);
    if (dup) {
      return res.status(409).json({
        message: 'Duplicate lead detected - a similar lead was submitted recently.',
        duplicateLeadId: dup.id,
      });
    }

    const leadId = await LeadModel.insertLead(data);
    let lead = await LeadModel.getLeadById(leadId);

    // Score it
    const score = calculateLeadScore(lead);
    const quality = getLeadQuality(score);
    await LeadModel.updateLeadScore(leadId, score, quality);

    // OTP — Use MySQL's DATE_ADD(NOW(), ...) so expiry shares MySQL session timezone
    const otp = generateOTP();
    const expiryMins = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
    await OTPModel.insertOTPWithMySQLExpiry(leadId, otp, expiryMins);

    // Log OTP (test mode)
    const humanExpiry = new Date(Date.now() + expiryMins * 60 * 1000);
    console.log('\n========= OTP Generated =========');
    console.log(`Lead ID: ${leadId} | Customer: ${lead.customer_name}`);
    console.log(`OTP: ${otp} (valid for ${expiryMins} minutes, until ${humanExpiry.toLocaleTimeString()})`);
    console.log('==================================\n');

    lead = await LeadModel.getLeadById(leadId);
    return res.status(201).json({
      message: 'Lead created successfully. Please verify OTP.',
      lead,
      otp,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * POST /api/leads/:id/verify-otp
 */
export async function verifyOTP(req, res) {
  try {
    const leadId = Number(req.params.id);
    const { otp } = req.body;

    if (!otp?.trim()) return res.status(400).json({ message: 'OTP is required' });

    const lead = await LeadModel.getLeadById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Fetch LATEST OTP and simultaneously check expiry via MySQL NOW() — 100% timezone-safe
    const verification = await OTPModel.getLatestOTPWithExpiryCheck(leadId);
    if (!verification) return res.status(400).json({ message: 'No OTP found. Please resubmit lead form.' });
    if (verification.verified_at) return res.status(400).json({ message: 'OTP already verified' });

    // Expiry check via SQL (compare using MySQL's own clock, not JS Date)
    if (verification.is_expired) {
      return res.status(400).json({ message: 'OTP has expired. Please resubmit the form.' });
    }
    if (verification.otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Mark verified & status=Verified
    await OTPModel.markOTPVerified(verification.id);
    await LeadModel.updateLeadStatus(leadId, 'Verified');

    // Re-score
    const updatedLead = await LeadModel.getLeadById(leadId);
    const score = calculateLeadScore(updatedLead);
    const quality = getLeadQuality(score);
    await LeadModel.updateLeadScore(leadId, score, quality);

    // Run matching
    const activeCompanies = await CompanyModel.getActiveCompanies();
    const matches = matchCompaniesForLead(updatedLead, activeCompanies);
    await CompanyModel.saveLeadMatches(leadId, matches);

    const finalLead = await LeadModel.getLeadById(leadId);
    return res.json({
      message: 'OTP verified successfully! Lead is now verified.',
      lead: finalLead,
      matchesCount: matches.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * POST /api/leads/:id/resend-otp
 */
export async function resendOTP(req, res) {
  try {
    const leadId = Number(req.params.id);
    const lead = await LeadModel.getLeadById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const otp = generateOTP();
    const expiryMins = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
    await OTPModel.insertOTPWithMySQLExpiry(leadId, otp, expiryMins);

    const humanExpiry = new Date(Date.now() + expiryMins * 60 * 1000);
    console.log('\n========= OTP Resent =========');
    console.log(`Lead ID: ${leadId} | OTP: ${otp} (expires ${humanExpiry.toLocaleTimeString()})`);
    console.log('===============================\n');
    return res.json({ message: 'New OTP generated successfully.', otp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * GET /api/leads
 */
export async function fetchLeads(req, res) {
  try {
    const { status } = req.query;
    const leads = await LeadModel.getAllLeads(status || null);
    return res.json({ leads, count: leads.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * GET /api/leads/:id
 */
export async function fetchLeadDetail(req, res) {
  try {
    const leadId = Number(req.params.id);
    const lead = await LeadModel.getLeadById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const otpHistory = await OTPModel.getOTPHistory(leadId);
    const matchedCompanies = await CompanyModel.getMatchedCompanies(leadId);
    return res.json({ ...lead, otpHistory, matchedCompanies });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * PATCH /api/leads/:id/status
 */
export async function patchLeadStatus(req, res) {
  try {
    const leadId = Number(req.params.id);
    const { status } = req.body;
    if (!VALID_LEAD_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Valid: ${VALID_LEAD_STATUSES.join(', ')}` });
    }
    const lead = await LeadModel.getLeadById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    await LeadModel.updateLeadStatus(leadId, status);

    // If Verified, ensure matching + scoring runs
    if (status === 'Verified') {
      const updatedLead = await LeadModel.getLeadById(leadId);
      const score = calculateLeadScore(updatedLead);
      const quality = getLeadQuality(score);
      await LeadModel.updateLeadScore(leadId, score, quality);
      const activeCompanies = await CompanyModel.getActiveCompanies();
      const matches = matchCompaniesForLead(updatedLead, activeCompanies);
      await CompanyModel.saveLeadMatches(leadId, matches);
    }

    const finalLead = await LeadModel.getLeadById(leadId);
    return res.json({ message: 'Lead status updated successfully', lead: finalLead });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * GET /api/leads/:id/matching-companies — live re-match
 */
export async function fetchMatchingCompanies(req, res) {
  try {
    const leadId = Number(req.params.id);
    const lead = await LeadModel.getLeadById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const activeCompanies = await CompanyModel.getActiveCompanies();
    const matches = matchCompaniesForLead(lead, activeCompanies);
    await CompanyModel.saveLeadMatches(leadId, matches);

    const companies = matches.map(m => ({
      company: m.company,
      match_score: m.matchScore,
      match_percentage: Math.min(m.matchScore, 100),
    }));
    return res.json({ companies, total_matches: companies.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}