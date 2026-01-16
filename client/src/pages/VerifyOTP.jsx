import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const VerifyOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== "") {
            element.nextSibling.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        if (data.length === 0) return;

        const newOtp = [...otp];
        data.forEach((val, idx) => {
            if (idx < 6 && !isNaN(val)) newOtp[idx] = val;
        });
        setOtp(newOtp);
    };

    const handleKeyDown = (e, index) => {
        // Backspace key
        if (e.key === 'Backspace' && otp[index] === '' && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpString })
            });

            const data = await res.json();

            if (res.ok) {
                // Navigate to Reset Password
                navigate('/reset-password', { state: { email, otp: otpString } });
            } else {
                setError(data.message || 'Invalid or expired OTP');
            }
        } catch (err) {
            setError('Failed to verify OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        // Logic to resend OTP
        // Re-use forgot password API
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                alert('OTP sent again!');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white px-10 py-12 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-gray-600"></div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h1>
                    <p className="text-gray-500">We've sent an OTP to <span className="font-semibold text-gray-800">{email}</span></p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-center gap-2">
                        {otp.map((data, index) => (
                            <input
                                className="w-12 h-14 bg-gray-100 text-center rounded-lg text-2xl font-bold text-gray-800 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all"
                                type="text"
                                name="otp"
                                maxLength="1"
                                key={index}
                                value={data}
                                onChange={e => handleChange(e.target, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                onFocus={e => e.target.select()}
                            />
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Didn't receive an OTP?{' '}
                            <button type="button" onClick={handleResend} className="text-primary font-bold hover:underline">
                                Resend
                            </button>
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                                Verifying...
                            </span>
                        ) : 'Verify'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/forgot-password" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Email
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
