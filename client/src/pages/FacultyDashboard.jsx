import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';



const FacultyDashboard = () => {
    const { user, authFetch } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);


    const [students, setStudents] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch for speed
                const [coursesRes, notifsRes, studentsRes] = await Promise.all([
                    authFetch('/api/courses/my'),
                    authFetch('/api/notifications'),
                    authFetch('/api/courses/students/all')
                ]);

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(Array.isArray(data.created) ? data.created : []);
                }

                if (notifsRes.ok) {
                    const data = await notifsRes.json();
                    setNotifications(Array.isArray(data) ? data : []);
                }

                if (studentsRes.ok) {
                    const data = await studentsRes.json();
                    setStudents(Array.isArray(data) ? data : []);
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
                    <p className="text-gray-300 text-lg">Manage your courses and assignments!</p>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column (Courses & Overview) - Takes 3 cols */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Courses Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h2>
                            {courses.length > 0 && (
                                <Link to="/courses/create" className="text-sm font-medium text-primary hover:underline">
                                    + Create New
                                </Link>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[200px]">
                                {courses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {courses.map(course => (
                                            <DashboardCourseCard key={course._id} course={course} isFaculty={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                        <h3 className="text-2xl font-medium text-gray-500 mb-2">No Courses Yet!</h3>
                                        <Link to="/courses/create" className="text-primary hover:underline font-medium">
                                            Create your first course to get started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Overview Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link to="/faculty/students" className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Students</h3>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{students.length}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">active</span>
                                </div>
                            </Link>

                            {/* Placeholder for other stats */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm opacity-60">
                                <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-4">Course Engagement</h3>
                                <div className="flex items-center justify-center h-16 text-gray-400 text-sm">
                                    Coming Soon
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Notifications) - Takes 1 col */}
                <div className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                        <Link to="/faculty/notifications" className="text-sm text-primary hover:underline">View All</Link>
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

export default FacultyDashboard;
