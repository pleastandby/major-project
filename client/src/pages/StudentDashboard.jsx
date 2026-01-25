import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';



const StudentDashboard = () => {
    const { user, authFetch } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch
                const [coursesRes, notifsRes, overviewRes] = await Promise.all([
                    authFetch('/api/courses/my'),
                    authFetch('/api/notifications'),
                    authFetch('/api/dashboard/student/overview')
                ]);

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(Array.isArray(data.enrolled) ? data.enrolled : []);
                }

                if (notifsRes.ok) {
                    const data = await notifsRes.json();
                    setNotifications(Array.isArray(data) ? data : []);
                }

                if (overviewRes.ok) {
                    const data = await overviewRes.json();
                    setOverviewData(data);
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
                    <p className="text-gray-300 text-lg">Check your smart overview for personalized insights!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column (Courses & Overview) - Takes 3 cols */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Smart Overview Section */}
                    {overviewData && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="bg-gradient-to-r from-primary to-link text-transparent bg-clip-text">Smart Overview</span>
                                <span className="text-xs font-normal px-2 py-0.5 bg-link/10 text-link rounded-full">AI Insights</span>
                            </h2>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-sm text-gray-500">Avg Grade</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.metrics.avgGrade}%</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-sm text-gray-500">Completion</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.metrics.completionRate}%</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-sm text-gray-500">This Week</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.metrics.submissionsThisWeek} <span className="text-xs font-normal text-gray-400">subs</span></p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-sm text-gray-500">Upcoming</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.upcomingDeadlines.length}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Suggestions Panel */}
                                <div className="bg-secondary/50 dark:bg-gray-800 rounded-2xl p-6 border border-tertiary/20 dark:border-gray-700">
                                    <h3 className="font-semibold text-primary dark:text-white mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                        Smart Suggestions
                                    </h3>
                                    <div className="space-y-3">
                                        {overviewData.suggestions.length > 0 ? (
                                            overviewData.suggestions.map((sugg, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border ${sugg.priority === 'critical' ? 'bg-error/10 border-error/20 text-error' :
                                                        sugg.priority === 'high' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                                                            'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                                                    }`}>
                                                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{sugg.title}</p>
                                                    <p className="text-sm">{sugg.message}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                                <p>You're doing great! No specific suggestions right now.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Best Work / Upcoming */}
                                <div className="space-y-6">
                                    {/* Upcoming List */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Next Due</h3>
                                        <div className="space-y-3">
                                            {overviewData.upcomingDeadlines.length > 0 ? (
                                                overviewData.upcomingDeadlines.map((task) => (
                                                    <div key={task._id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{task.title}</p>
                                                            <p className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <Link to={`/assignments/${task._id}`} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                                            View
                                                        </Link>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 py-2">No upcoming deadlines!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Courses Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h2>
                            <Link to="/courses/join" className="text-sm font-medium text-primary hover:underline">
                                + Join Course
                            </Link>
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
                                    <div key={notif._id} className={`flex gap-3 items-start p-3 rounded-xl transition-all cursor-pointer border ${notif.alertLevel === 'red'
                                        ? 'bg-red-50 border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/30'
                                        : notif.alertLevel === 'yellow'
                                            ? 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30'
                                            : 'bg-white border-gray-100 hover:bg-gray-100 dark:bg-gray-700/50 dark:border-gray-600 dark:hover:bg-gray-700'
                                        }`}>
                                        <div className={`p-2 rounded-full shrink-0 ${notif.alertLevel === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                                            notif.alertLevel === 'yellow' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                            }`}>
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className={`font-semibold text-sm truncate ${notif.alertLevel === 'red' ? 'text-red-700 dark:text-red-400' :
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
