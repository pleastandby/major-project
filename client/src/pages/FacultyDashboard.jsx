import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';



const FacultyDashboard = () => {
    const { user, authFetch } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);

    const [students, setStudents] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch for speed
                const [coursesRes, notifsRes, studentsRes, overviewRes] = await Promise.all([
                    authFetch('/api/courses/my'),
                    authFetch('/api/notifications'),
                    authFetch('/api/courses/students/all'),
                    authFetch('/api/dashboard/faculty/overview')
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
                    <p className="text-gray-300 text-lg">Manage your courses and track student performance!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column (Courses & Overview) - Takes 3 cols */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Smart Overview Section */}
                    {overviewData && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="bg-gradient-to-r from-primary to-link text-transparent bg-clip-text">Course Command Center</span>
                            </h2>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Link to="/faculty/students" className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Students</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.metrics.totalStudents}</p>
                                        </div>
                                    </div>
                                </Link>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-sm text-gray-500">Scheduled</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.metrics.scheduledAssignments}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-sm text-gray-500">Class Avg</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewData.metrics.averageClassPerformance}%</p>
                                </div>
                                <div className={`p-4 rounded-2xl border shadow-sm ${overviewData.metrics.pendingGrading > 0
                                    ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                    }`}>
                                    <p className={`text-sm ${overviewData.metrics.pendingGrading > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Pending Grading</p>
                                    <p className={`text-2xl font-bold ${overviewData.metrics.pendingGrading > 0 ? 'text-orange-700' : 'text-gray-900 dark:text-white'}`}>
                                        {overviewData.metrics.pendingGrading}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Alerts Panel */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-error" />
                                        Smart Alerts
                                    </h3>
                                    <div className="space-y-3">
                                        {overviewData.alerts.length > 0 ? (
                                            overviewData.alerts.map((alert, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border ${alert.priority === 'critical' ? 'bg-error/10 border-error/20' : 'bg-yellow-50 border-yellow-100'
                                                    }`}>
                                                    <div className="flex justify-between">
                                                        <p className={`text-xs font-bold uppercase tracking-wider opacity-80 mb-1 ${alert.priority === 'critical' ? 'text-error' : 'text-yellow-800'
                                                            }`}>{alert.title}</p>
                                                    </div>
                                                    <p className={`text-sm ${alert.priority === 'critical' ? 'text-error' : 'text-yellow-800'
                                                        }`}>{alert.message}</p>
                                                    {alert.data && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {alert.data.map((student, i) => (
                                                                <div key={i} className={`text-xs px-2 py-1 rounded border flex items-center gap-2 ${student.status === 'Critical'
                                                                    ? 'bg-white border-error/20 text-error'
                                                                    : 'bg-white border-yellow-200 text-yellow-800'
                                                                    }`}>
                                                                    <span className="font-semibold">{student.name}</span>
                                                                    <span className="opacity-80">({student.average}%)</span>
                                                                    {student.gradedCount && <span className="text-[10px] opacity-60">| {student.gradedCount} graded</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-sm">
                                                No active alerts. Your classes are running smoothly!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Weekly Activity / Productivity */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Snapshot</h3>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-secondary text-primary border border-tertiary flex items-center justify-center font-bold text-xl">
                                            {overviewData.metrics.assignmentsThisWeek}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">Assignments Created</p>
                                            <p className="text-xs text-gray-500">This week</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-gray-500">Scheduled Assignments</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{overviewData.metrics.scheduledAssignments}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">At-Risk Students</span>
                                            <span className={`font-medium ${overviewData.atRiskCount > 0 ? 'text-error' : 'text-gray-900 dark:text-white'}`}>
                                                {overviewData.atRiskCount || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
