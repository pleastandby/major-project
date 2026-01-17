import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Plus, CheckCircle, Clock } from 'lucide-react';
// Helper to format date relative
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
};

const NotificationList = () => {
    const { authFetch, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await authFetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [authFetch]);

    const handleMarkRead = async (id) => {
        try {
            const res = await authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getLevelStyles = (level) => {
        switch (level) {
            case 'red': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-900 dark:text-red-100 icon-red';
            case 'yellow': return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/20 text-yellow-900 dark:text-yellow-100 icon-yellow';
            case 'green':
            default: return 'bg-white dark:bg-[#121214] border-gray-100 dark:border-white/5 text-gray-900 dark:text-gray-100';
        }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Bell size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
                </div>
                {/* Only faculty/admin can create (assuming generic check for now) */}
                {user?.roles?.includes('faculty') && (
                    <Link to="/faculty/notifications/create" className="btn btn-primary flex items-center gap-2">
                        <Plus size={18} /> Create New
                    </Link>
                )}
            </div>

            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div
                            key={notif._id}
                            className={`p-5 rounded-xl border shadow-sm transition-all ${getLevelStyles(notif.alertLevel)} ${notif.read ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border ${notif.type === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                            notif.type === 'system' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                                'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                            }`}>
                                            {notif.type}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Clock size={12} /> {formatDate(notif.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg">{notif.title}</h3>
                                    <p className="mt-1 text-sm opacity-90 leading-relaxed">{notif.body}</p>
                                </div>
                                {!notif.read && (
                                    <button
                                        onClick={() => handleMarkRead(notif._id)}
                                        className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                                        title="Mark as read"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                )}
                            </div>
                            {/* Visual indicator bar on left */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${notif.alertLevel === 'red' ? 'bg-red-500' :
                                notif.alertLevel === 'yellow' ? 'bg-yellow-500' :
                                    'bg-transparent' // Standard ones don't need bar? or maybe green
                                }`}></div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-[#121214] rounded-xl border border-dashed border-gray-200 dark:border-white/10 transition-colors">
                        <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">All caught up!</h3>
                        <p className="text-gray-500 dark:text-gray-400">You have no new notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationList;
