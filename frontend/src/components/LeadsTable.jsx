import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STATUSES = ['All', 'Pending', 'Verified', 'Fake', 'Duplicate', 'Re-attempt'];
const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Verified: 'bg-green-100 text-green-800 border-green-200',
  Fake: 'bg-red-100 text-red-800 border-red-200',
  Duplicate: 'bg-purple-100 text-purple-800 border-purple-200',
  'Re-attempt': 'bg-orange-100 text-orange-800 border-orange-200',
};
const QUALITY_STYLES = {
  Hot: 'bg-red-100 text-red-700',
  Warm: 'bg-amber-100 text-amber-700',
  Cold: 'bg-blue-100 text-blue-700',
};

export default function LeadsTable() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeads();
  }, [filter]);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'All' ? '/api/leads' : `/api/leads?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      setError('Could not load leads. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      loadLeads();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const filtered = leads.filter(l => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      l.customer_name.toLowerCase().includes(s) ||
      l.mobile.includes(s) ||
      (l.email || '').toLowerCase().includes(s) ||
      l.pickup_city.toLowerCase().includes(s) ||
      l.destination_city.toLowerCase().includes(s) ||
      l.service_type.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads Queue</h1>
            <p className="text-gray-500 mt-1">Manage and review all customer relocation enquiries</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
              📊 Dashboard
            </Link>
            <Link to="/" className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition text-sm shadow-md">
              + New Lead
            </Link>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {STATUSES.map(s => {
              const count = s === 'All' ? leads.length : leads.filter(l => l.status === s).length;
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {s}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, mobile, email, city, service..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={loadLeads} className="px-4 py-1.5 bg-white border border-red-300 rounded-lg text-sm hover:bg-red-50">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="animate-spin w-10 h-10 text-orange-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p>Loading leads...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">No leads found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting filters or create a new lead</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Customer', 'Route', 'Service', 'Move Date', 'Status', 'Quality', 'Score', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(lead => (
                    <tr key={lead.id} className="hover:bg-orange-50/30 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/admin/leads/${lead.id}`} className="flex items-center gap-3 hover:opacity-80">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {lead.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{lead.customer_name}</p>
                            <p className="text-xs text-gray-500">📱 {lead.mobile}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{lead.pickup_city}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{lead.destination_city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{lead.service_type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lead.moving_date ? new Date(lead.moving_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={e => updateStatus(lead.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer ${STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        >
                          {['Pending', 'Verified', 'Fake', 'Duplicate', 'Re-attempt'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.lead_quality ? (
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${QUALITY_STYLES[lead.lead_quality]}`}>
                            {lead.lead_quality === 'Hot' ? '🔥' : lead.lead_quality === 'Warm' ? '☀️' : '❄️'} {lead.lead_quality}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 w-28">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (lead.lead_score || 0) >= 70 ? 'bg-red-500' :
                                (lead.lead_score || 0) >= 45 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${lead.lead_score || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-6 text-right">{lead.lead_score || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
