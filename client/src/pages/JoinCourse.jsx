import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const JoinCourse = () => {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [code, setCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await authFetch('/api/courses/join', {
                method: 'POST',
                body: JSON.stringify({ code })
            });

            if (res.ok) {
                navigate('/student/dashboard');
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to join course');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-primary mb-2">Join a Course</h1>
            <p className="text-gray-500 text-sm mb-6">Enter the unique course code provided by your instructor.</p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span>•</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Course Code</label>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all uppercase tracking-widest placeholder-normal"
                        placeholder="CS101"
                    />
                </div>

                <div className="flex gap-4 pt-2">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 transition-all shadow-lg shadow-primary/20">
                        {isLoading ? 'Joining...' : 'Join Course'}
                    </button>
                    <button type="button" onClick={() => navigate('/student/dashboard')} className="px-6 py-3 border border-gray-200 text-primary rounded-lg font-medium hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JoinCourse;
