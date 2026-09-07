# PackersMart MVP - Lead to Booking Platform

A working MVP implementation of the PackersMart lead-to-booking workflow featuring customer lead registration, OTP verification, admin dashboard, lead quality scoring, and logistics company matching.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + React Router 7 + Vite 8 + Tailwind CSS 4 |
| **Backend** | Node.js + Express 5 + better-sqlite3 |
| **Database** | SQLite (file-based, relational, no external server needed) |
| **Communication** | REST API (JSON) |

> **Why SQLite?** SQLite was chosen to keep the MVP self-contained with zero external DB setup. All database tables follow a proper relational design that can be directly ported to MySQL or PostgreSQL in production. The SQL schema is ANSI-SQL compatible.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ (20+ recommended)
- npm or yarn

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm run dev     # development mode with auto-reload
# OR
npm start       # production mode
```

The API server will be running on **http://localhost:5000**

### 3. Install Frontend Dependencies (New Terminal)
```bash
cd frontend
npm install
```

### 4. Start the Frontend Dev Server
```bash
npm run dev
```

The app will be running on **http://localhost:5173**

Vite proxies all `/api/*` requests to the backend running on port 5000 automatically, so no CORS configuration is needed.

### 5. Run the Flow
1. Open **http://localhost:5173** → Fill the Lead Form → Submit
2. **Check the backend terminal** — the 6-digit OTP will be printed there (and also displayed on the OTP screen for testing)
3. Enter OTP → Verified ✅
4. Go to **Admin Dashboard** via the navbar → Explore leads, stats, quality scores, and matched companies

---

## 🗄️ Database Design

Tables are auto-created and seeded on first server start. Located at:
`backend/src/packersmart.db`

### Table: `leads`
Stores all customer relocation enquiries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment lead ID |
| `customer_name` | TEXT NOT NULL | Customer full name |
| `mobile` | TEXT NOT NULL | 10-digit mobile (digits only) |
| `email` | TEXT NULL | Email address |
| `pickup_city` | TEXT NOT NULL | Source city |
| `destination_city` | TEXT NOT NULL | Target city |
| `service_type` | TEXT NOT NULL | Household / Office / Vehicle / International / Warehousing |
| `moving_date` | TEXT NULL | Planned move date (ISO) |
| `additional_requirements` | TEXT NULL | Free-text notes |
| `status` | TEXT DEFAULT 'Pending' | Pending, Verified, Fake, Duplicate, Re-attempt |
| `lead_score` | INTEGER DEFAULT 0 | 0-100 quality score |
| `lead_quality` | TEXT NULL | Hot / Warm / Cold |
| `created_at` | TEXT | Auto timestamp |

### Table: `otp_verifications`
Stores OTPs with expiry for each lead.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | |
| `lead_id` | INTEGER FK → leads.id | Related lead (CASCADE delete) |
| `otp` | TEXT NOT NULL | 6-digit OTP |
| `expires_at` | TEXT NOT NULL | ISO expiry time (10 minutes from issue) |
| `verified_at` | TEXT NULL | Verification timestamp, null if unused |

### Table: `companies`
Sample logistics/packers & movers partners. Seeded with 8 companies on first run.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | |
| `company_name` | TEXT NOT NULL | Company name |
| `coverage` | TEXT NOT NULL | Comma-separated list of served cities |
| `service_types` | TEXT NOT NULL | Comma-separated list of service types |
| `rating` | REAL DEFAULT 0 | 0.0 - 5.0 star rating |
| `status` | TEXT | Active / Inactive |

### Table: `lead_company_matches`
Junction table storing the computed matches between leads and companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | |
| `lead_id` | INTEGER FK → leads.id | |
| `company_id` | INTEGER FK → companies.id | |
| `match_score` | INTEGER DEFAULT 0 | Matching score for this pair |
| `notification_status` | TEXT DEFAULT 'Pending' | Pending / Sent / Seen |
| `created_at` | TEXT | Auto timestamp |
| **UNIQUE** | (lead_id, company_id) | Prevents duplicate matches |

---

## 📡 List of APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/leads` | Create a new lead & generate OTP |
| `POST` | `/api/leads/:id/verify-otp` | Verify OTP (correct → status=Verified) |
| `POST` | `/api/leads/:id/resend-otp` | Generate a new OTP for a lead |
| `GET` | `/api/leads` | Fetch all leads (optionally `?status=Verified`) |
| `GET` | `/api/leads/:id` | Get lead details + OTP history + matched companies |
| `PATCH` | `/api/leads/:id/status` | Update lead status (Pending/Verified/Fake/Duplicate/Re-attempt) |
| `GET` | `/api/leads/:id/matching-companies` | Run matching algorithm & return scored companies |
| `GET` | `/api/dashboard` | Dashboard statistics (lead counts, quality, trend, breakdowns) |
| `GET` | `/api/companies` | List all logistics companies |

---

## 🧠 Lead Scoring Logic

The **Lead Quality Score** (0–100) evaluates how "valuable" or "actionable" an enquiry is. Computed on lead creation and re-computed on OTP verification.

| Rule | Points |
|------|--------|
| Valid Email address provided | +15 |
| Valid 10-digit Mobile number | +10 |
| Moving Date explicitly specified | +15 |
| Additional requirements >5 characters | +10 |
| Premium service (International / Vehicle / Warehousing) | +10 |
| Customer name length ≥ 3 characters | +5 |
| Inter-city move (Pickup ≠ Destination) | +15 |
| Moving Date is within the next 30 days | +10 |
| **Maximum** | **100** |

### Quality Classification
- **🔥 HOT** — Score ≥ 70 → High-intent customer, follow up immediately
- **☀️ WARM** — Score 45–69 → Good potential, nurture
- **❄️ COLD** — Score < 45 → Low info / low intent

---

## 🤝 Company Matching Logic

A rule-based matching algorithm scores each active company against a verified lead.

| Rule | Points |
|------|--------|
| Pickup city is in company's coverage list | +35 |
| Destination city is in company's coverage list | +35 |
| Requested service type is offered by company | +20 |
| Company rating ≥ 4.5 ⭐ | +10 |
| Company rating 4.0–4.4 ⭐ | +5 |
| **Maximum** | **100** |

**Threshold:** A company is only considered a match if total score ≥ 55 (ensures minimum coverage overlap + service match).

**Output:** Matches are sorted by match_score descending (highest quality first). Gold/Silver/Bronze medals are shown on the frontend for top 3 matches.

### Example
Lead: Mumbai → Pune, Household shift.
- Company with coverage `Mumbai,Pune,...` + Household service → Score = 35+35+20+(rating bonus) = **90+**
- Company with coverage `Mumbai,Delhi,...` + Household service → Score = 35+0+20+(rating bonus) = **~60** (barely qualifies)
- Company with coverage `Delhi,Noida,...` → Score < 55, excluded

---

## 🔐 Validation Highlights

**Backend (source of truth):**
- Required fields (name, mobile, pickup/destination, service type)
- Mobile: regex validation for 10 digits (auto-strips non-digits)
- Email: regex validation (RFC-inspired) when provided
- Duplicate detection: Same mobile + same cities + same service type within 24 hours → 409 Conflict
- OTP expiry (10 minutes) checked server-side
- OTP already-verified check
- Status enum validation on PATCH endpoint

**Frontend (UX feedback):**
- Real-time field-level validation messages
- Auto-advance OTP digit inputs with Paste support
- Min date for moving date (today onwards)
- Pickup ≠ Destination validation
- Disabled submit until valid

---

## ✅ Core End-to-End Flow

```
Customer Lead Form (/)
       │
       ▼
 POST /api/leads → Validated ✓ → OTP generated (logged in console)
       │
       ▼
 OTP Verification Screen (/verify-otp/:id)
       │
       ▼
 POST /api/leads/:id/verify-otp → Correct OTP
       │
       ▼
 Lead status → Verified • Lead score recalculated • Lead quality set
       │
       ▼
 Matching algorithm runs → Matches saved to lead_company_matches
       │
       ▼
 Admin Leads Queue (/admin/leads) → Review, search, filter, status-change
       │
       ▼
 Lead Detail (/admin/leads/:id) → Full info • Score breakdown • Matched companies
       │
       ▼
 Dashboard (/dashboard) → All stats (live from DB, never hardcoded)
```

---

## 📸 Key Pages to Screenshot

1. **`/`** — Customer lead form (hero + responsive validation)
2. **`/verify-otp/:id`** — OTP screen with test-mode OTP display
3. **`/dashboard`** — Admin dashboard with charts & stat cards
4. **`/admin/leads`** — Leads queue table w/ status dropdowns, quality badges, progress bars
5. **`/admin/leads/:id`** — Lead detail with scoring breakdown & ranked company matches
6. **`/admin/companies`** — Companies grid + scoring/matching explanation card

---

## 📝 Notes
- OTPs are **logged to the backend console** as plain text (requirement: SMS integration not needed; OTP may be displayed/logged for testing). The OTP screen also shows it directly for convenience.
- SQLite DB file is auto-created at `backend/src/packersmart.db`. **Delete this file to reset the demo** (it will be re-created + reseeded on next server start).
- 8 sample companies are seeded on first run (7 active + 1 inactive) covering major Indian metro cities.