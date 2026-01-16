import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const FacultyRegister = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const payload = {
            name,
            email,
            password,
            role: 'faculty',
            profileData: {
                department
            }
        };

        try {
            await register(payload);
            navigate('/faculty/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-sm border border-black/5">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-primary mb-2">Faculty Registration</h1>
                <p className="text-accent text-sm">Join the teaching staff</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span>•</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Dr. Jane Smith" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="faculty@university.edu" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="••••••••" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all bg-white">
                        <option value="">Select Department</option>
                        <option value="CS">Computer Science</option>
                        <option value="IT">Information Technology</option>
                        <option value="EE">Electrical Engineering</option>
                    </select>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20">
                        {isLoading ? 'Register' : 'Register'}
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-accent">
                Already registered?{' '}
                <Link to="/faculty/login" className="text-primary font-medium hover:underline">
                    Login here
                </Link>
            </p>
        </div>
    );
};

export default FacultyRegister;
