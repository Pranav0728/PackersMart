/**
 * MySQL Database Connection Pool
 * Connects to local MySQL Workbench instance using env vars
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'packersmart',
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 0,
  waitForConnections: true,
  dateStrings: true, // Return dates as strings (avoid JS Date object shifts)
});

/**
 * Test DB connection on server start
 * @returns {Promise<boolean>} true if connected
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log(`✅ Connected to MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} as ${process.env.DB_USER}`);
    connection.release();
    return true;
  } catch (err) {
    console.error('\n❌ MySQL Connection FAILED!\n');
    console.error('Error message:', err.message);
    console.error('\n👉 Fix: Open MySQL Workbench, make sure it is running,');
    console.log('   then update backend/.env with your correct DB_USER, DB_PASSWORD, DB_NAME');
    console.log('   and create the database (schema) if it does not exist yet.\n');
    return false;
  }
}

/**
 * Initialise all 4 tables and seed companies (IF NOT EXISTS)
 * Run once after successful MySQL connection
 */
export async function initDatabase() {
  try {
    // --- 1. LEADS table ---
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        customer_name           VARCHAR(255) NOT NULL,
        mobile                  VARCHAR(20)  NOT NULL,
        email                   VARCHAR(255) NULL,
        pickup_city             VARCHAR(100) NOT NULL,
        destination_city        VARCHAR(100) NOT NULL,
        service_type            VARCHAR(100) NOT NULL,
        moving_date             DATE         NULL,
        additional_requirements TEXT         NULL,
        status                  VARCHAR(20)  DEFAULT 'Pending',
        lead_score              INT          DEFAULT 0,
        lead_quality            VARCHAR(10)  NULL,
        created_at              DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at              DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_leads_status       (status),
        INDEX idx_leads_created_at   (created_at),
        INDEX idx_leads_mobile       (mobile),
        INDEX idx_leads_lead_quality (lead_quality)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Table `leads` ready');

    // --- 2. OTP_VERIFICATIONS table ---
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        lead_id     INT         NOT NULL,
        otp         VARCHAR(10) NOT NULL,
        expires_at  DATETIME    NOT NULL,
        verified_at DATETIME    NULL,
        created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_otp_lead_id    (lead_id),
        INDEX idx_otp_expires_at (expires_at),
        CONSTRAINT fk_otp_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Table `otp_verifications` ready');

    // --- 3. COMPANIES table ---
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        company_name  VARCHAR(255) NOT NULL,
        coverage      TEXT         NOT NULL,
        service_types TEXT         NOT NULL,
        rating        DECIMAL(2,1) DEFAULT 0,
        status        VARCHAR(20)  DEFAULT 'Active',
        created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_companies_status (status),
        INDEX idx_companies_rating (rating DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Table `companies` ready');

    // --- 4. LEAD_COMPANY_MATCHES table ---
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS lead_company_matches (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        lead_id             INT NOT NULL,
        company_id          INT NOT NULL,
        match_score         INT DEFAULT 0,
        notification_status VARCHAR(30) DEFAULT 'Pending',
        created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_lead_company (lead_id, company_id),
        INDEX idx_lcm_lead_id    (lead_id),
        INDEX idx_lcm_company_id (company_id),
        CONSTRAINT fk_lcm_lead    FOREIGN KEY (lead_id)    REFERENCES leads(id)     ON DELETE CASCADE,
        CONSTRAINT fk_lcm_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Table `lead_company_matches` ready');

    // --- 5. SEED sample companies if table is empty ---
    const [companyRows] = await pool.execute('SELECT COUNT(*) as count FROM companies');
    if (companyRows[0].count === 0) {
      console.log('  🌱 Seeding 8 sample companies...');
      const companies = [
        ['SafeMove Packers',      'Mumbai,Pune,Delhi,Bengaluru',                 'Household,Office,Vehicle',                   4.7, 'Active'],
        ['SwiftRelocation',       'Delhi,Noida,Gurugram,Chandigarh',             'Household,Office,International',             4.5, 'Active'],
        ['MetroMovers',           'Bengaluru,Hyderabad,Chennai,Kochi',           'Household,Office,Warehousing',               4.3, 'Active'],
        ['HomeSafe Logistics',    'Mumbai,Thane,Navi Mumbai,Pune',               'Household,Vehicle,Warehousing',              4.8, 'Active'],
        ['Elite Packers',         'Delhi,Mumbai,Bengaluru,Hyderabad,Kolkata',    'Household,Office,Vehicle,International',     4.9, 'Active'],
        ['BudgetShifters',        'Pune,Nashik,Ahmedabad,Surat',                 'Household,Office',                           4.1, 'Active'],
        ['UrbanRelo',             'Bengaluru,Mumbai,Delhi,Pune,Hyderabad',       'Household,Office,Warehousing,Vehicle',       4.6, 'Active'],
        ['National Carriers',     'Kolkata,Patna,Ranchi,Guwahati',               'Household,Office,Warehousing',               4.2, 'Inactive'],
      ];
      const insertStmt = 'INSERT INTO companies (company_name, coverage, service_types, rating, status) VALUES (?, ?, ?, ?, ?)';
      for (const c of companies) {
        await pool.execute(insertStmt, c);
      }
      console.log('  ✅ 8 sample companies seeded');
    } else {
      console.log(`  ℹ️  Companies table already has ${companyRows[0].count} rows — skipping seed`);
    }

    console.log('🗄️  Database initialised successfully\n');
    return true;
  } catch (err) {
    console.error('\n❌ Error initialising database tables:\n', err.message);
    return false;
  }
}

export default pool;
