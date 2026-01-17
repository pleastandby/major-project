import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Send, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const CreateNotification = () => {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        body: '',
        type: 'system', // system or admin
        alertLevel: 'green',
        recipientType: 'all', // all, faculty, student, specific
        specificEmail: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await authFetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Notification sent successfully!' });
                setFormData({
                    title: '',
                    body: '',
                    type: 'system',
                    alertLevel: 'green',
                    recipientType: 'all',
                    specificEmail: ''
                });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to send notification' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Server error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <Bell size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Notification</h1>
                    <p className="text-gray-500 text-sm">Send system or admin alerts to users</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">

                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="system">System Notification</option>
                            <option value="admin">Admin Generated</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alert Level</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.alertLevel === 'green' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'hover:bg-gray-50'
                                }`}>
                                <input type="radio" name="alertLevel" value="green" checked={formData.alertLevel === 'green'} onChange={handleChange} className="hidden" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="font-medium">Info</span>
                            </label>

                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.alertLevel === 'yellow' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500' : 'hover:bg-gray-50'
                                }`}>
                                <input type="radio" name="alertLevel" value="yellow" checked={formData.alertLevel === 'yellow'} onChange={handleChange} className="hidden" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="font-medium">Warning</span>
                            </label>

                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.alertLevel === 'red' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'hover:bg-gray-50'
                                }`}>
                                <input type="radio" name="alertLevel" value="red" checked={formData.alertLevel === 'red'} onChange={handleChange} className="hidden" />
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="font-medium">Critical</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Notification Title"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Body</label>
                    <textarea
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="Write your message here..."
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                {/* Helpers/Preview based on level */}
                <div className={`p-4 rounded-lg flex gap-3 text-sm ${formData.alertLevel === 'green' ? 'bg-blue-50 text-blue-700' :
                        formData.alertLevel === 'yellow' ? 'bg-orange-50 text-orange-700' :
                            'bg-rose-50 text-rose-700'
                    }`}>
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <strong>Preview Note:</strong> This will appear as a
                        {formData.alertLevel === 'green' ? ' standard information card.' :
                            formData.alertLevel === 'yellow' ? ' warning alert needing attention.' :
                                ' critical alert highlighted in red.'}
                    </div>
                </div>

                {/* Recipients */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <select
                        name="recipientType"
                        value={formData.recipientType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mb-3"
                    >
                        <option value="all">All Users (Broadcast)</option>
                        <option value="faculty">All Faculty</option>
                        <option value="student">All Students</option>
                        <option value="specific">Specific User (Email)</option>
                    </select>

                    {formData.recipientType === 'specific' && (
                        <input
                            type="email"
                            name="specificEmail"
                            value={formData.specificEmail}
                            onChange={handleChange}
                            placeholder="Enter user email address"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/faculty/notifications')}
                        className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : <><Send size={18} /> Send Notification</>}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default CreateNotification;
