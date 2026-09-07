/**
 * Lead Model — All DB queries related to leads table
 */
import pool from '../config/db.js';

/**
 * Fetch all leads ordered by newest
 * @param {string|null} status Optional filter
 * @returns {Promise<Array>}
 */
export async function getAllLeads(status = null) {
  let sql = 'SELECT * FROM leads ORDER BY created_at DESC';
  const params = [];
  if (status) {
    sql = 'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC';
    params.push(status);
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Get a single lead by id
 * @returns {Promise<Object|null>}
 */
export async function getLeadById(id) {
  const [rows] = await pool.execute('SELECT * FROM leads WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Insert new lead
 * @returns {Promise<number>} insertId
 */
export async function insertLead(data) {
  const { customer_name, mobile, email, pickup_city, destination_city, service_type, moving_date, additional_requirements } = data;
  const sql = `
    INSERT INTO leads (customer_name, mobile, email, pickup_city, destination_city, service_type, moving_date, additional_requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.execute(sql, [
    customer_name.trim(),
    mobile.replace(/\D/g, ''),
    email?.trim() || null,
    pickup_city.trim(),
    destination_city.trim(),
    service_type.trim(),
    moving_date || null,
    additional_requirements?.trim() || null,
  ]);
  return result.insertId;
}

/**
 * Update lead_score + lead_quality
 */
export async function updateLeadScore(id, score, quality) {
  await pool.execute('UPDATE leads SET lead_score = ?, lead_quality = ? WHERE id = ?', [score, quality, id]);
}

/**
 * Update status
 */
export async function updateLeadStatus(id, status) {
  await pool.execute('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
}

/**
 * Check duplicate lead (same mobile + pickup + dest + service, last 24h)
 * @returns {Promise<Object|null>} duplicate row or null
 */
export async function findDuplicateLead({ mobile, pickup_city, destination_city, service_type }) {
  const sql = `
    SELECT id FROM leads
    WHERE mobile = ? AND pickup_city = ? AND destination_city = ? AND service_type = ?
    AND created_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY id DESC LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [mobile, pickup_city, destination_city, service_type]);
  return rows[0] || null;
}