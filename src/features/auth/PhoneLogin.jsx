import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Phone, Lock, Loader2, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize invisible reCAPTCHA on component mount
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved automatically
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
  }, []);

  const requestOTP = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');
    
    // Format for India (+91)
    const formattedPhone = `+91${phoneNumber}`; 
    
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setStep('OTP');
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Too many requests or invalid number.');
      // Reset recaptcha if it fails so user can try again
      if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await window.confirmationResult.confirm(otp);
      // Success! Zustand's onAuthStateChanged listener in App.jsx will catch this 
      // and automatically redirect to /dashboard.
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-4 fade-in animate-in duration-300">
      <div className="bg-[#1c212e] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-sky-500"></div>

        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-[#151923] border border-gray-700 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Compass className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Trip Planner Engine</h1>
          <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-400" /> Secure Group Travel
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg mb-6 text-center font-medium flex items-center justify-center gap-2">
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={requestOTP} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium flex items-center gap-2 border-r border-gray-700 pr-2">
                  <Phone size={16} className="text-emerald-500" /> +91
                </span>
                <input
                  type="tel"
                  maxLength="10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg pl-[76px] pr-3 py-2.5 text-gray-200 focus:outline-none focus:border-emerald-500 shadow-sm font-medium tracking-wide transition-colors"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phoneNumber.length !== 10}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Get Secured OTP <ArrowRight size={16} className="ml-2" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex justify-between items-center">
                <span>Enter 6-digit OTP</span>
                <span className="text-emerald-400">Sent to {phoneNumber}</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#151923] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-gray-200 focus:outline-none focus:border-indigo-500 shadow-sm font-medium tracking-widest text-center text-lg transition-colors"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              <button 
                type="button" 
                onClick={() => { setStep('PHONE'); setOtp(''); setError(''); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-3 block text-right w-full font-medium"
              >
                Change Phone Number?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Enter'}
            </button>
          </form>
        )}
        
        {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}