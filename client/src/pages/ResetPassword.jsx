import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Get state passed from previous step
    const { email, otp } = location.state || {};

    useEffect(() => {
        if (!email || !otp) {
            navigate('/forgot-password');
        }
    }, [email, otp, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword: formData.newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                // Optional: Redirect after delay
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="bg-white px-10 py-12 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                    <p className="text-gray-500 mb-8">Your password has been successfully updated.</p>
                    <Link to="/login" className="block w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-gray-200">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white px-10 py-12 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-gray-600"></div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
                    <p className="text-gray-500">Create a new password that you can remember.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-900 block" htmlFor="newPassword">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="w-full pl-11 pr-12 py-3.5 bg-gray-100 border border-transparent rounded-xl text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all placeholder:text-gray-400"
                                required
                                placeholder="•••••••••"
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-900 block" htmlFor="confirmPassword">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full pl-11 pr-12 py-3.5 bg-gray-100 border border-transparent rounded-xl text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all placeholder:text-gray-400"
                                required
                                placeholder="•••••••••"
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                                Resetting...
                            </span>
                        ) : 'Reset Password'}
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
