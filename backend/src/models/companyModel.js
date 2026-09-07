/**
 * Company Model — DB queries for companies + lead_company_matches
 */
import pool from '../config/db.js';

/**
 * Get all active companies
 */
export async function getActiveCompanies() {
  const [rows] = await pool.execute("SELECT * FROM companies WHERE status = 'Active'");
  return rows;
}

/**
 * Get all companies sorted by rating
 */
export async function getAllCompanies() {
  const [rows] = await pool.execute('SELECT * FROM companies ORDER BY rating DESC');
  return rows;
}

/**
 * Delete existing matches for a lead, then batch insert new ones
 * Using INSERT ... ON DUPLICATE KEY UPDATE to respect unique(lead_id,company_id)
 */
export async function saveLeadMatches(leadId, matches) {
  // Delete old
  await pool.execute('DELETE FROM lead_company_matches WHERE lead_id = ?', [leadId]);
  // Insert new
  if (matches.length > 0) {
    const sql = 'INSERT INTO lead_company_matches (lead_id, company_id, match_score) VALUES (?, ?, ?)';
    for (const m of matches) {
      await pool.execute(sql, [leadId, m.company.id, m.matchScore]);
    }
  }
}

/**
 * Get lead + matched companies JOIN
 */
export async function getMatchedCompanies(leadId) {
  const sql = `
    SELECT c.*, lcm.match_score, lcm.notification_status, lcm.created_at as matched_at
    FROM lead_company_matches lcm
    JOIN companies c ON lcm.company_id = c.id
    WHERE lcm.lead_id = ?
    ORDER BY lcm.match_score DESC
  `;
  const [rows] = await pool.execute(sql, [leadId]);
  return rows;
}