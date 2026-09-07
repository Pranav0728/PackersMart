import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Verified: 'bg-green-100 text-green-800 border-green-300',
  Fake: 'bg-red-100 text-red-800 border-red-300',
  Duplicate: 'bg-purple-100 text-purple-800 border-purple-300',
  'Re-attempt': 'bg-orange-100 text-orange-800 border-orange-300',
};
const QUALITY_STYLES = {
  Hot: 'bg-red-100 text-red-700',
  Warm: 'bg-amber-100 text-amber-700',
  Cold: 'bg-blue-100 text-blue-700',
};
const SCORING_RULES = [
  { label: 'Valid Email Provided', points: 15 },
  { label: 'Valid Mobile Number', points: 10 },
  { label: 'Moving Date Specified', points: 15 },
  { label: 'Additional Requirements (>5 chars)', points: 10 },
  { label: 'Premium Service (Intl/Vehicle/Warehousing)', points: 10 },
  { label: 'Name length >= 3 chars', points: 5 },
  { label: 'Inter-city Move (Pickup ≠ Destination)', points: 15 },
  { label: 'Moving within 30 days', points: 10 },
];

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLead(data);

      const compRes = await fetch(`/api/leads/${id}/matching-companies`);
      if (compRes.ok) {
        const cData = await compRes.json();
        setCompanies(cData.companies || []);
      }
    } catch (e) {
      setError('Could not load lead details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      loadData();
    } catch (e) {
      alert('Failed to update');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin w-12 h-12 text-orange-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-gray-600 font-medium">Loading lead details...</p>
      </div>
    </div>
  );

  if (error && !lead) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/admin/leads" className="inline-block px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">Back to Leads</Link>
      </div>
    </div>
  );

  const score = lead.lead_score || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 text-sm">
          <Link to="/admin/leads" className="inline-flex items-center gap-1.5 text-gray-600 hover:text-orange-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            All Leads
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">#{lead.id}</span>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-orange-50/30 p-8 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex items-start gap-5 flex-1">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                  {lead.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{lead.customer_name}</h1>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_STYLES[lead.status] || 'bg-gray-100'}`}>
                      {lead.status}
                    </span>
                    {lead.lead_quality && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${QUALITY_STYLES[lead.lead_quality]}`}>
                        {lead.lead_quality === 'Hot' ? '🔥' : lead.lead_quality === 'Warm' ? '☀️' : '❄️'} {lead.lead_quality} Lead
                      </span>
                    )}
                    <span className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full font-bold">ID #{lead.id}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5"><span className="text-gray-400">📱</span> {lead.mobile}</span>
                    {lead.email && <span className="flex items-center gap-1.5"><span className="text-gray-400">✉️</span> {lead.email}</span>}
                    <span className="flex items-center gap-1.5"><span className="text-gray-400">📅</span> Created {new Date(lead.created_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
                <select
                  value={lead.status}
                  disabled={statusLoading}
                  onChange={e => updateStatus(e.target.value)}
                  className={`px-5 py-3 rounded-xl font-semibold border-2 cursor-pointer ${STATUS_STYLES[lead.status] || 'bg-gray-100 border-gray-200 text-gray-700'}`}
                >
                  {['Pending', 'Verified', 'Fake', 'Duplicate', 'Re-attempt'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={loadData}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 font-medium text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer info + route */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </span>
                  Relocation Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Route</p>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl px-4 py-3 border border-orange-100">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="font-bold text-gray-900">{lead.pickup_city}</p>
                      </div>
                      <svg className="w-6 h-6 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                      </svg>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-500">Destination</p>
                        <p className="font-bold text-gray-900">{lead.destination_city}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-medium">Service Type</p>
                      <p className="font-bold text-gray-900 mt-1">{lead.service_type}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-medium">Moving Date</p>
                      <p className="font-bold text-gray-900 mt-1">{lead.moving_date ? new Date(lead.moving_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </span>
                  Customer Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Full Name</span>
                    <span className="font-semibold text-gray-900 text-right">{lead.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Mobile</span>
                    <span className="font-semibold text-gray-900">{lead.mobile}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="font-semibold text-gray-900 text-right">{lead.email || '—'}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-gray-500 mb-1.5">Additional Requirements</p>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 min-h-[60px]">
                      {lead.additional_requirements || <span className="text-gray-400 italic">No additional notes provided</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Matching companies */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9"/></svg>
                    Matched Packers & Movers
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{companies.length} companies match this requirement</p>
                </div>
                {lead.status === 'Verified' && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">Matches Live</span>
                )}
              </div>
              {companies.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p className="text-gray-600 font-semibold">No matching companies yet</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                    {lead.status !== 'Verified'
                      ? 'Mark lead as "Verified" to run company matching algorithm.'
                      : 'No active companies cover this route and service combination yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {companies.map((m, idx) => {
                    const c = m.company;
                    return (
                      <div key={c.id} className="p-6 hover:bg-orange-50/30 transition">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow ${
                              idx === 0 ? 'from-yellow-400 to-orange-500' : idx === 1 ? 'from-gray-300 to-gray-500' : idx === 2 ? 'from-orange-300 to-amber-600' : 'from-blue-400 to-indigo-500'
                            }`}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : c.company_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{c.company_name}</h4>
                                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                  ⭐ {Number(c.rating).toFixed(1)}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {c.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                                <span>📍 Coverage: {c.coverage}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {c.service_types.split(',').map(s => (
                                  <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s.trim()}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-xs text-gray-500 mb-1">Match Score</p>
                            <div className="flex items-center gap-3">
                              <div className="w-28 sm:w-32 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                                  style={{ width: `${m.match_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-2xl font-bold text-gray-900 min-w-[56px]">{m.match_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Score */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Lead Quality Score</h3>
              <div className="relative pt-2 pb-6">
                <div className="flex items-end justify-center gap-1 mb-4">
                  <div className="text-6xl font-black bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {score}
                  </div>
                  <span className="text-2xl font-bold text-gray-400 mb-2">/100</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      score >= 70 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                      score >= 45 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
                <div className="text-center mt-5">
                  <span className={`text-sm font-bold px-4 py-2 rounded-full ${QUALITY_STYLES[lead.lead_quality || 'Cold']}`}>
                    {lead.lead_quality === 'Hot' ? '🔥 Hot Lead' :
                     lead.lead_quality === 'Warm' ? '☀️ Warm Lead' : '❄️ Cold Lead'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Scoring Breakdown</h3>
              <div className="space-y-2">
                {SCORING_RULES.map(rule => {
                  // Determine if each rule applied (heuristic display)
                  let applied = false;
                  switch (rule.label) {
                    case 'Valid Email Provided': applied = !!(lead.email); break;
                    case 'Valid Mobile Number': applied = !!(lead.mobile && lead.mobile.length >= 10); break;
                    case 'Moving Date Specified': applied = !!lead.moving_date; break;
                    case 'Additional Requirements (>5 chars)': applied = !!lead.additional_requirements && lead.additional_requirements.length > 5; break;
                    case 'Premium Service (Intl/Vehicle/Warehousing)':
                      applied = ['International', 'Vehicle', 'Warehousing'].some(s => (lead.service_type || '').includes(s)); break;
                    case 'Name length >= 3 chars': applied = (lead.customer_name || '').trim().length >= 3; break;
                    case 'Inter-city Move (Pickup ≠ Destination)':
                      applied = lead.pickup_city && lead.destination_city && lead.pickup_city.toLowerCase() !== lead.destination_city.toLowerCase(); break;
                    case 'Moving within 30 days':
                      if (lead.moving_date) {
                        const diff = Math.ceil((new Date(lead.moving_date) - new Date()) / 86400000);
                        applied = diff >= 0 && diff <= 30;
                      }
                      break;
                  }
                  return (
                    <div key={rule.label} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm ${applied ? 'bg-green-50' : 'bg-gray-50 opacity-60'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {applied ? (
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        )}
                        <span className={`${applied ? 'text-gray-800' : 'text-gray-500'} truncate`}>{rule.label}</span>
                      </div>
                      <span className={`font-bold flex-shrink-0 ${applied ? 'text-green-700' : 'text-gray-400'}`}>+{rule.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">OTP Verification History</h3>
              <div className="space-y-3">
                {(lead.otpHistory || []).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No OTP records</p>
                )}
                {(lead.otpHistory || []).map((o, idx) => (
                  <div key={o.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Attempt #{lead.otpHistory.length - idx}</span>
                      {o.verified_at ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Verified</span>
                      ) : new Date(o.expires_at) < new Date() ? (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">Expired</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Pending</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-gray-700">OTP: {o.otp}</span>
                    </div>
                    {o.verified_at && <p className="text-[11px] text-gray-500 mt-1">At {new Date(o.verified_at).toLocaleString('en-IN')}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
