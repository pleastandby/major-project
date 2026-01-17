import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';

const CourseSettings = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authFetch, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        department: '',
        semester: ''
    });

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await authFetch(`/api/courses/${id}`);
                if (res.ok) {
                    const data = await res.json();

                    // Verify ownership
                    if (data.createdBy._id !== user._id) {
                        navigate('/faculty/dashboard');
                        return;
                    }

                    setFormData({
                        title: data.title,
                        code: data.code, // Usually read-only but shown
                        description: data.description || '',
                        department: data.meta?.department || '',
                        semester: data.meta?.semester || ''
                    });
                } else {
                    setError('Failed to load course details');
                }
            } catch (err) {
                setError('Error fetching course');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id && user) {
            fetchCourse();
        }
    }, [id, authFetch, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await authFetch(`/api/courses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                navigate(`/courses/${id}`);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to update course');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await authFetch(`/api/courses/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                navigate('/faculty/dashboard');
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to delete course');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate(`/courses/${id}`)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors">
                <ArrowLeft size={18} /> Back to Course
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900">Course Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Update course details or delete this course.</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Course Title</label>
                                <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Course Code</label>
                                <input name="code" value={formData.code} disabled className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
                                <span className="text-xs text-gray-400">Course code cannot be changed.</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Department</label>
                                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                                    <option value="">Select Department</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                    <option value="Computer Engineering">Computer Engineering</option>
                                    <option value="Electronics Engineering">Electronics Engineering</option>
                                    <option value="Electrical and Electronics">Electrical and Electronics</option>
                                    <option value="Automobile Engineering">Automobile Engineering</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Semester</label>
                                <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                                    <option value="">Select Semester</option>
                                    <option value="1">Semester 1</option>
                                    <option value="2">Semester 2</option>
                                    <option value="3">Semester 3</option>
                                    <option value="4">Semester 4</option>
                                    <option value="5">Semester 5</option>
                                    <option value="6">Semester 6</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100 mt-8">
                            <button type="submit" disabled={saving} className="btn bg-primary text-white hover:bg-primary-dark px-6 py-2.5 rounded-lg font-medium flex items-center gap-2">
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 p-8 border-t border-red-100">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Danger Zone</h3>
                    <p className="text-red-600 text-sm mb-4">Once you delete a course, there is no going back. Please be certain.</p>

                    {!showDeleteConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={16} /> Delete Course
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="text-sm font-bold text-red-800">Are you sure?</span>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm shadow-sm"
                            >
                                Yes, Delete it
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseSettings;
