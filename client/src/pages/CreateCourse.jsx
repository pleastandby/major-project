import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateCourse = () => {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        department: '',
        semester: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await authFetch('/api/courses', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                navigate('/faculty/dashboard');
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create course');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-primary mb-6">Create New Course</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span>•</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Course Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Introduction to CS" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Course Code</label>
                        <input name="code" value={formData.code} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="CS101" />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Course overview..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Department</label>
                        <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all bg-white">
                            <option value="">Select Department</option>
                            <option value="CS">Computer Science</option>
                            <option value="IT">Information Technology</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all bg-white">
                            <option value="">Select Semester</option>
                            <option value="Fall 2024">Fall 2024</option>
                            <option value="Spring 2025">Spring 2025</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 transition-all shadow-lg shadow-primary/20">
                        {isLoading ? 'Creating...' : 'Create Course'}
                    </button>
                    <button type="button" onClick={() => navigate('/faculty/dashboard')} className="px-6 py-3 border border-gray-200 text-primary rounded-lg font-medium hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCourse;
