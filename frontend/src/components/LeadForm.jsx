import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVICE_TYPES = [
  'Household', 'Office', 'Vehicle', 'International', 'Warehousing'
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata',
  'Ahmedabad', 'Surat', 'Noida', 'Gurugram', 'Chandigarh', 'Nashik', 'Thane',
  'Navi Mumbai', 'Patna', 'Ranchi', 'Guwahati', 'Kochi', 'Indore', 'Jaipur'
];

export default function LeadForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState({
    customer_name: '',
    mobile: '',
    email: '',
    pickup_city: '',
    destination_city: '',
    service_type: '',
    moving_date: '',
    additional_requirements: '',
  });
  const [errors, setErrors] = useState({});
  const [displayOtp, setDisplayOtp] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Full name is required';
    else if (form.customer_name.trim().length < 2) e.customer_name = 'Enter at least 2 characters';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(form.mobile.replace(/\D/g, ''))) e.mobile = 'Enter a valid 10-digit number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.pickup_city) e.pickup_city = 'Pickup city is required';
    if (!form.destination_city) e.destination_city = 'Destination city is required';
    if (form.pickup_city && form.destination_city && form.pickup_city === form.destination_city)
      e.destination_city = 'Destination must differ from pickup';
    if (!form.service_type) e.service_type = 'Select a service type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409) {
        setApiError(data.message);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setApiError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }
      // Show OTP on screen for testing
      if (data.otp) setDisplayOtp(data.otp);
      // Navigate to OTP screen
      navigate(`/verify-otp/${data.lead.id}`, { state: { otp: data.otp, name: data.lead.customer_name } });
    } catch (err) {
      setApiError('Failed to connect to server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const inputBase = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-400';
  const inputOk = 'border-gray-300 focus:ring-orange-200 focus:border-orange-500';
  const inputErr = 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Hero side */}
          <div className="lg:col-span-2 hidden lg:flex flex-col justify-center">
            <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 text-white rounded-3xl p-10 shadow-2xl">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-6">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">Book Your Move in Minutes</h1>
              <p className="text-orange-50/90 mb-8 text-lg leading-relaxed">
                India's trusted marketplace for packers and movers. Get matched with verified logistics partners instantly.
              </p>
              <div className="space-y-4">
                {[
                  { t: 'Free Quotes', d: 'Compare prices from top movers' },
                  { t: 'Verified Partners', d: 'Background-checked companies' },
                  { t: 'Doorstep Service', d: 'Pickup to delivery, handled' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">{item.t}</p>
                      <p className="text-sm text-orange-50/80">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form side */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-8 py-6">
                <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-1">Step 1 of 2</p>
                <h2 className="text-2xl font-bold text-gray-900">Your Relocation Details</h2>
                <p className="text-gray-500 mt-1">Fill in your details to receive free moving quotes</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
                    ⚠️ {apiError}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={form.customer_name}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className={`${inputBase} ${errors.customer_name ? inputErr : inputOk}`}
                    />
                    {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      maxLength={15}
                      placeholder="10-digit mobile number"
                      className={`${inputBase} ${errors.mobile ? inputErr : inputOk}`}
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup City *</label>
                    <select
                      name="pickup_city"
                      value={form.pickup_city}
                      onChange={handleChange}
                      className={`${inputBase} ${errors.pickup_city ? inputErr : inputOk}`}
                    >
                      <option value="">Select pickup city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.pickup_city && <p className="text-red-500 text-xs mt-1">{errors.pickup_city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Destination City *</label>
                    <select
                      name="destination_city"
                      value={form.destination_city}
                      onChange={handleChange}
                      className={`${inputBase} ${errors.destination_city ? inputErr : inputOk}`}
                    >
                      <option value="">Select destination city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.destination_city && <p className="text-red-500 text-xs mt-1">{errors.destination_city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Type *</label>
                    <select
                      name="service_type"
                      value={form.service_type}
                      onChange={handleChange}
                      className={`${inputBase} ${errors.service_type ? inputErr : inputOk}`}
                    >
                      <option value="">Select service</option>
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s} Shifting</option>)}
                    </select>
                    {errors.service_type && <p className="text-red-500 text-xs mt-1">{errors.service_type}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Moving Date <span className="text-gray-400 font-normal">(Recommended)</span></label>
                    <input
                      type="date"
                      name="moving_date"
                      min={today}
                      value={form.moving_date}
                      onChange={handleChange}
                      className={`${inputBase} ${inputOk}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Requirements</label>
                    <textarea
                      name="additional_requirements"
                      value={form.additional_requirements}
                      onChange={handleChange}
                      rows={3}
                      placeholder="E.g. 2 BHK household, fragile items, car to be transported, need storage for 3 days..."
                      className={`${inputBase} ${inputOk} resize-none`}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4">
                  <p className="text-xs text-gray-500 text-center sm:text-left">
                    🔒 Your information is secure. We'll send an OTP to verify your mobile number.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    {loading ? (
                      <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Submitting...</>
                    ) : (
                      <>Generate OTP & Submit<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 lg:hidden">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
                <p className="text-sm font-semibold text-orange-700">🚚 10,000+ Happy Customers</p>
                <p className="text-xs text-orange-600/80 mt-1">Rated 4.8/5 by users across India</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
