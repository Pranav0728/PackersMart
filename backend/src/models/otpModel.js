/**
 * OTP Model — DB queries for otp_verifications table
 */
import pool from '../config/db.js';

/**
 * Insert new OTP for a lead
 * NOTE: Uses JS-provided expiry date string. For new code prefer insertOTPWithMySQLExpiry().
 * @returns {Promise<number>} insertId
 */
export async function insertOTP(leadId, otp, expiresAtISO) {
  const [result] = await pool.execute(
    'INSERT INTO otp_verifications (lead_id, otp, expires_at) VALUES (?, ?, ?)',
    [leadId, otp, expiresAtISO]
  );
  return result.insertId;
}

/**
 * 🔥 TIMEZONE-SAFE Insert OTP using MySQL's own clock.
 * Expiry = NOW() + INTERVAL minutes MINUTE
 * This guarantees expiry is stored in the SAME time reference that MySQL uses for NOW() comparisons,
 * eliminating any UTC/IST or Node/MySQL timezone drift.
 */
export async function insertOTPWithMySQLExpiry(leadId, otp, minutes) {
  const [result] = await pool.execute(
    'INSERT INTO otp_verifications (lead_id, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
    [leadId, otp, minutes]
  );
  return result.insertId;
}

/**
 * Get latest OTP record for a lead
 */
export async function getLatestOTP(leadId) {
  const [rows] = await pool.execute(
    'SELECT * FROM otp_verifications WHERE lead_id = ? ORDER BY id DESC LIMIT 1',
    [leadId]
  );
  return rows[0] || null;
}

/**
 * 🔥 TIMEZONE-SAFE latest OTP with an `is_expired` boolean computed by MySQL NOW().
 * Never have JS Date parse errors or TZ mismatches again.
 */
export async function getLatestOTPWithExpiryCheck(leadId) {
  const [rows] = await pool.execute(
    `SELECT *,
       CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END AS is_expired
     FROM otp_verifications
     WHERE lead_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [leadId]
  );
  if (!rows[0]) return null;
  // Coerce tinyint(1) to boolean
  rows[0].is_expired = Boolean(rows[0].is_expired);
  return rows[0];
}

/**
 * Mark OTP as verified (set verified_at = now)
 */
export async function markOTPVerified(otpId) {
  await pool.execute(
    'UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?',
    [otpId]
  );
}

/**
 * List all OTP records for a lead (used in lead detail)
 */
export async function getOTPHistory(leadId) {
  const [rows] = await pool.execute(
    'SELECT * FROM otp_verifications WHERE lead_id = ? ORDER BY id DESC',
    [leadId]
  );
  return rows;
}