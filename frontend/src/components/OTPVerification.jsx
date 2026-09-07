import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';

export default function OTPVerification() {
  const { leadId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateOtp = location.state?.otp;
  const stateName = location.state?.name;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [displayOtp, setDisplayOtp] = useState(stateOtp || null);
  const [success, setSuccess] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(c => c !== '')) {
      // Auto submit if all filled
      setTimeout(() => verifyOtp(newOtp.join('')), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyOtp(otp.join(''));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputRefs.current[nextIdx]?.focus(), 0);
  };

  const verifyOtp = async (otpStr) => {
    if (otpStr.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${leadId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Verification failed');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setMatchesCount(data.matchesCount || 0);
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${leadId}/resend-otp`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDisplayOtp(data.otp);
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Failed to resend');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl mb-6 animate-[bounce_1s_ease-in-out]">
              <svg className="w-14 h-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Verification Successful!</h2>
            <p className="text-green-50/90">Thank you, {stateName || 'Customer'}!</p>
          </div>
          <div className="p-8 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-900">Lead is Verified</p>
                  <p className="text-sm text-green-700 mt-1">
                    We found <span className="font-bold">{matchesCount}</span> matched packers & movers for your requirement. You'll receive calls shortly!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link to="/" className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Book Another Move</span>
              </Link>
              <Link to="/dashboard" className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <span className="text-sm font-semibold text-orange-700">Admin Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to form
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-orange-600 to-red-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm mb-4">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Verify Your Mobile</h2>
            <p className="text-orange-50/90 text-sm">Enter the 6-digit code sent via SMS</p>
          </div>

          <div className="p-8 space-y-6">
            {displayOtp && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-1">🔧 Test Mode - OTP Display</p>
                <p className="text-amber-800 text-sm mb-2">For this assessment, SMS is not configured. Use this OTP:</p>
                <p className="text-4xl font-bold tracking-[0.3em] text-amber-900 bg-amber-100 rounded-xl py-3">{displayOtp}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">Enter 6-digit OTP</label>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      error
                        ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-orange-200 focus:border-orange-500 bg-white'
                    }`}
                  />
                ))}
              </div>
              {error && <p className="text-red-500 text-sm text-center mt-3">❌ {error}</p>}
            </div>

            <button
              onClick={() => verifyOtp(otp.join(''))}
              disabled={loading || otp.join('').length < 6}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Verifying...</>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div className="text-center pt-2">
              {timer > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend OTP in <span className="font-mono font-bold text-orange-600">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={resendOtp}
                  disabled={resending}
                  className="text-orange-600 hover:text-orange-700 font-semibold text-sm disabled:text-gray-400"
                >
                  {resending ? 'Resending...' : "Didn't get code? Resend OTP"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
