import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';



const StudentDashboard = () => {
    const { user, authFetch } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);


    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch
                const [coursesRes, notifsRes] = await Promise.all([
                    authFetch('/api/courses/my'),
                    authFetch('/api/notifications')
                ]);

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(Array.isArray(data.enrolled) ? data.enrolled : []);
                }

                if (notifsRes.ok) {
                    const data = await notifsRes.json();
                    setNotifications(Array.isArray(data) ? data : []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authFetch]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="bg-[#3C3D37] rounded-xl p-8 md:p-12 mb-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="z-10 relative text-center md:text-left">
                    <h1 className="text-4xl font-bold mb-2">Welcome back {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-gray-300 text-lg">Join a course to get started!</p>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column (Courses & Overview) - Takes 3 cols */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Courses Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Courses</h2>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[200px]">
                                {courses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {courses.map(course => (
                                            <DashboardCourseCard key={course._id} course={course} isFaculty={false} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                        <h3 className="text-2xl font-medium text-gray-500 mb-2">No Courses Yet!</h3>
                                        <Link to="/courses/join" className="text-primary hover:underline font-medium">
                                            Join to get started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Overview Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl h-80 border border-gray-100 dark:border-gray-700">
                            {/* Placeholder for overview content */}
                        </div>
                    </div>
                </div>

                {/* Right Column (Notifications) - Takes 1 col */}
                <div className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                        <Link to="/student/notifications" className="text-sm text-primary hover:underline">View All</Link>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 min-h-[500px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="space-y-3">
                                {notifications.slice(0, 5).map(notif => (
                                    <div key={notif._id} className={`flex gap-3 items-start p-3 rounded-xl transition-all cursor-pointer border ${notif.alertLevel === 'critical'
                                        ? 'bg-red-50 border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/30'
                                        : notif.alertLevel === 'warning'
                                            ? 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30'
                                            : 'bg-white border-gray-100 hover:bg-gray-100 dark:bg-gray-700/50 dark:border-gray-600 dark:hover:bg-gray-700'
                                        }`}>
                                        <div className={`p-2 rounded-full shrink-0 ${notif.alertLevel === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                                            notif.alertLevel === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                            }`}>
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className={`font-semibold text-sm truncate ${notif.alertLevel === 'critical' ? 'text-red-700 dark:text-red-400' :
                                                'text-gray-800 dark:text-gray-200'
                                                }`}>{notif.title}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{notif.message}</p>
                                            <span className="text-[10px] text-gray-400 mt-1 block">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full mb-3">
                                    <AlertTriangle size={24} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
