/**
 * Dashboard Controller — Statistics queries (aggregates)
 */
import pool from '../config/db.js';

/**
 * GET /api/dashboard
 */
export async function getDashboardStats(req, res) {
  try {
    // --- Lead counts ---
    const q = (sql) => pool.execute(sql).then(([r]) => r[0]);
    const [
      totalLeadsR, verifiedR, fakeR, dupR, pendingR, reattemptR,
      hotR, warmR, coldR,
      matchedLeadsR, totalMatchesR, activeCompaniesR,
    ] = await Promise.all([
      q("SELECT COUNT(*) c FROM leads"),
      q("SELECT COUNT(*) c FROM leads WHERE status = 'Verified'"),
      q("SELECT COUNT(*) c FROM leads WHERE status = 'Fake'"),
      q("SELECT COUNT(*) c FROM leads WHERE status = 'Duplicate'"),
      q("SELECT COUNT(*) c FROM leads WHERE status = 'Pending'"),
      q("SELECT COUNT(*) c FROM leads WHERE status = 'Re-attempt'"),
      q("SELECT COUNT(*) c FROM leads WHERE lead_quality = 'Hot'"),
      q("SELECT COUNT(*) c FROM leads WHERE lead_quality = 'Warm'"),
      q("SELECT COUNT(*) c FROM leads WHERE lead_quality = 'Cold'"),
      q("SELECT COUNT(DISTINCT lead_id) c FROM lead_company_matches"),
      q("SELECT COUNT(*) c FROM lead_company_matches"),
      q("SELECT COUNT(*) c FROM companies WHERE status = 'Active'"),
    ]);

    // --- 7-day trend ---
    const [trend] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM leads
      WHERE created_at >= NOW() - INTERVAL 7 DAY
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // --- Service breakdown ---
    const [services] = await pool.execute(`
      SELECT service_type, COUNT(*) as count
      FROM leads
      GROUP BY service_type
      ORDER BY count DESC
    `);

    // --- Top 5 pickup cities ---
    const [cities] = await pool.execute(`
      SELECT pickup_city as city, COUNT(*) as count
      FROM leads
      GROUP BY pickup_city
      ORDER BY count DESC
      LIMIT 5
    `);

    return res.json({
      totals: {
        total_leads: totalLeadsR.c,
        verified_leads: verifiedR.c,
        fake_leads: fakeR.c,
        duplicate_leads: dupR.c,
        pending_leads: pendingR.c,
        reattempt_leads: reattemptR.c,
      },
      lead_quality: {
        hot: hotR.c,
        warm: warmR.c,
        cold: coldR.c,
      },
      matches: {
        leads_with_matches: matchedLeadsR.c,
        total_company_matches: totalMatchesR.c,
        active_companies: activeCompaniesR.c,
      },
      recent_leads_trend: trend,
      service_breakdown: services,
      top_cities: cities,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * GET /api/companies
 */
export async function getAllCompanies(req, res) {
  try {
    const [companies] = await pool.execute('SELECT * FROM companies ORDER BY rating DESC');
    return res.json({ companies, count: companies.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}