import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, GraduationCap, School } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
    // Role state: 'student' or 'faculty'
    const [role, setRole] = useState('student');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(role, formData.email, formData.password);
            // Redirect based on role
            navigate(`/${role}/dashboard`);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white px-10 py-12 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 max-w-md w-full relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-gray-600"></div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
                    <p className="text-gray-500">Welcome back to Elevare !</p>
                </div>

                {/* Role Toggle */}
                <div className="mb-8">
                    <label className="text-sm font-bold text-gray-900 mb-2 block">Roles</label>
                    <div className="bg-gray-100 p-1.5 rounded-xl flex relative">
                        {/* Animated sliding background could go here for extra polish, 
                            but simple conditional styling works for now */}
                        <button
                            type="button"
                            onClick={() => setRole('faculty')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${role === 'faculty'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <School size={18} />
                            Faculty
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('student')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${role === 'student'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <GraduationCap size={18} />
                            Student
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-900 block" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-xl text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all placeholder:text-gray-400"
                            required
                            placeholder="someone@example.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-900 block" htmlFor="password">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-xl text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 outline-none transition-all placeholder:text-gray-400"
                                required
                                placeholder="•••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Faculty ID Field - VISUAL ONLY for now to match design if needed, 
                        or we can omit if strictly following functional backend.
                        The design showed "Faculty ID", so let's add it conditionally but disabled or purely visual 
                        if we want to be 100% faithful, OR assume the user meant "Email" is the ID.
                        
                        Decision: I will OMIT it to avoid user confusion ("Why do I have to enter ID if I log in with email?").
                        The "Email" field is sufficient.
                    */}

                    <div className="flex items-center justify-between pt-2">
                        <Link
                            to="/forgot-password"
                            className="text-link text-sm font-medium hover:underline"
                        >
                            Forgotten password?
                        </Link>
                        <div className="text-sm text-gray-500">
                            No account? {' '}
                            <Link
                                to={`/${role}/register`}
                                className="text-link font-medium hover:underline"
                            >
                                Register
                            </Link>
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
                                Logging in...
                            </span>
                        ) : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
