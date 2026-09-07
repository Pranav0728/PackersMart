import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch (e) {
      setError('Could not load dashboard. Please ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView />;

  const statCard = (title, value, icon, color, hint = '') => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const totals = data?.totals || {};
  const quality = data?.lead_quality || {};
  const matches = data?.matches || {};
  const trend = data?.recent_leads_trend || [];
  const services = data?.service_breakdown || [];
  const cities = data?.top_cities || [];

  const maxTrend = Math.max(...trend.map(t => t.count), 1);
  const maxService = Math.max(...services.map(s => s.count), 1);
  const maxCity = Math.max(...cities.map(c => c.count), 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of PackersMart leads and operations</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/leads" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
              📋 View All Leads
            </Link>
            <Link to="/" className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition text-sm shadow-md">
              🚚 New Lead
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={loadData} className="px-4 py-1.5 bg-white border border-red-300 rounded-lg text-sm hover:bg-red-50">Retry</button>
          </div>
        )}

        {/* Lead status stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCard('Total', totals.total_leads, <IconUsers/>, 'bg-blue-50 text-blue-600')}
            {statCard('Pending', totals.pending_leads, <IconClock/>, 'bg-yellow-50 text-yellow-600', 'Awaiting OTP')}
            {statCard('Verified', totals.verified_leads, <IconCheck/>, 'bg-green-50 text-green-600', 'Qualified leads')}
            {statCard('Fake', totals.fake_leads, <IconBan/>, 'bg-red-50 text-red-600')}
            {statCard('Duplicate', totals.duplicate_leads, <IconCopy/>, 'bg-purple-50 text-purple-600')}
            {statCard('Re-attempt', totals.reattempt_leads, <IconRetry/>, 'bg-orange-50 text-orange-600')}
          </div>
        </div>

        {/* Middle row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lead quality */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Lead Quality Breakdown</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">Hot/Warm/Cold</span>
            </div>
            <div className="space-y-5">
              {[
                { k: 'Hot', v: quality.hot, c: 'bg-red-500', lc: 'text-red-700', bc: 'bg-red-50', bar: 'bg-gradient-to-r from-red-500 to-orange-500' },
                { k: 'Warm', v: quality.warm, c: 'bg-amber-500', lc: 'text-amber-700', bc: 'bg-amber-50', bar: 'bg-gradient-to-r from-amber-500 to-yellow-400' },
                { k: 'Cold', v: quality.cold, c: 'bg-blue-500', lc: 'text-blue-700', bc: 'bg-blue-50', bar: 'bg-gradient-to-r from-blue-500 to-cyan-400' },
              ].map(item => {
                const total = (quality.hot || 0) + (quality.warm || 0) + (quality.cold || 0);
                const pct = total ? (item.v / total) * 100 : 0;
                return (
                  <div key={item.k}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${item.c}`}></span>
                        <span className={`text-sm font-semibold ${item.lc}`}>{item.k}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.v || 0} <span className="text-xs font-normal text-gray-400">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className={`h-2.5 ${item.bc} rounded-full overflow-hidden`}>
                      <div className={`h-full ${item.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Company matches */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Logistics Matching</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                <div>
                  <p className="text-xs text-orange-700 font-semibold uppercase tracking-wider">Active Partners</p>
                  <p className="text-2xl font-bold text-orange-900">{matches.active_companies}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <IconTruck/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 font-medium">Leads Matched</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{matches.leads_with_matches}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 font-medium">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{matches.total_company_matches}</p>
                </div>
              </div>
              <Link to="/admin/companies" className="block w-full text-center py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition">
                View All Companies →
              </Link>
            </div>
          </div>

          {/* 7-day trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Leads Trend (Last 7 Days)</h3>
            {trend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <IconChart/>
                <p className="text-sm mt-3">No data yet</p>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-1.5 h-48">
                {trend.map(t => {
                  const h = (t.count / maxTrend) * 100;
                  return (
                    <div key={t.date} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                      <div className="relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {t.count} lead{t.count !== 1 ? 's' : ''}
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg hover:from-orange-700 hover:to-orange-500 transition"
                          style={{ height: `${Math.max(h, 5)}%`, minHeight: '8px' }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Services */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Service Type Distribution</h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No data available</p>
            ) : (
              <div className="space-y-4">
                {services.map(s => {
                  const pct = (s.count / maxService) * 100;
                  return (
                    <div key={s.service_type}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{s.service_type} Shifting</span>
                        <span className="text-sm font-bold text-gray-900">{s.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Top Pickup Cities</h3>
            {cities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No data available</p>
            ) : (
              <div className="space-y-3">
                {cities.map((c, idx) => {
                  const pct = (c.count / maxCity) * 100;
                  const badgeColors = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-400'];
                  return (
                    <div key={c.city} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full ${idx < 3 ? badgeColors[idx] : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-xs font-bold ${idx < 3 ? 'text-gray-900' : 'text-gray-500'}`}>{idx + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-32">{c.city}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin w-12 h-12 text-orange-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Icons (functional components — used as <Icon/> in JSX)
const IconUsers = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const IconClock = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconCheck = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
const IconBan = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>;
const IconCopy = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>;
const IconRetry = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const IconTruck = () => <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"/></svg>;
const IconChart = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
