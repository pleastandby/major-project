import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const CreateAssignment = () => {
    const { id: courseId } = useParams();
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        type: 'Manual',
        difficulty: 'Medium'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await authFetch(`/api/assignments`, {
                method: 'POST',
                body: JSON.stringify({ ...formData, courseId })
            });

            if (res.ok) {
                navigate(`/courses/${courseId}`);
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create assignment');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-primary mb-6">Create Assignment</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span>•</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Assignment Title</label>
                    <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Week 1 Homework" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary">Instructions</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="6" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Describe the task..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Due Date</label>
                        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all bg-white" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Max Points</label>
                        <input type="number" name="maxPoints" value={formData.maxPoints} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Creation Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all bg-white">
                            <option value="Manual">Manual</option>
                            <option value="AI_Generated">AI Generated</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary">Difficulty</label>
                        <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all bg-white">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 transition-all shadow-lg shadow-primary/20">
                        {isLoading ? 'Creating...' : 'Create Assignment'}
                    </button>
                    <button type="button" onClick={() => navigate(`/courses/${courseId}`)} className="px-6 py-3 border border-gray-200 text-primary rounded-lg font-medium hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAssignment;
