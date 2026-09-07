import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (e) {
      setError('Could not load companies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logistics Companies</h1>
            <p className="text-gray-500 mt-1">Active packers & movers partners network</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/leads" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
              📋 Leads Queue
            </Link>
            <Link to="/dashboard" className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-red-700 transition text-sm shadow-md">
              📊 Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={loadCompanies} className="px-4 py-1.5 bg-white border border-red-300 rounded-lg text-sm hover:bg-red-50">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <svg className="animate-spin w-10 h-10 text-orange-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-gray-500">Loading companies...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((c, idx) => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                    {c.company_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      ⭐ {Number(c.rating).toFixed(1)}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-3">{c.company_name}</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">📍 Service Coverage</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.coverage.split(',').map(city => (
                        <span key={city} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{city.trim()}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">🛠️ Services Offered</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.service_types.split(',').map(s => (
                        <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <h3 className="font-bold text-lg mb-2">📘 Scoring & Matching Explained</h3>
          <div className="grid md:grid-cols-2 gap-6 mt-4 text-sm text-gray-300">
            <div>
              <p className="text-orange-400 font-semibold mb-2">Lead Quality Score (Max 100)</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Email present: +15 points</li>
                <li>Valid mobile: +10 points</li>
                <li>Moving date: +15 points</li>
                <li>Detailed requirements: +10 points</li>
                <li>Premium service: +10 points</li>
                <li>Inter-city move: +15 points</li>
                <li>Move within 30 days: +10 points</li>
                <li>Valid name: +5 points</li>
              </ul>
              <p className="mt-3 text-gray-400">Hot ≥70 • Warm 45-69 • Cold &lt;45</p>
            </div>
            <div>
              <p className="text-orange-400 font-semibold mb-2">Company Matching Score (Max 100)</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Pickup city in coverage: +35 points</li>
                <li>Destination in coverage: +35 points</li>
                <li>Service type offered: +20 points</li>
                <li>Rating ≥ 4.5: +10 points</li>
                <li>Rating 4.0-4.4: +5 points</li>
              </ul>
              <p className="mt-3 text-gray-400">Min 55 points required to appear as a match. Sorted descending.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}