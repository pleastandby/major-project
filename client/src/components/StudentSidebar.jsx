import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Bell, PieChart, User, LogOut, Search, Sun, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';

const StudentSidebar = () => {
    const location = useLocation();
    const { logout, authFetch } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const [courses, setCourses] = useState([]);
    const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await authFetch('/api/courses/my');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.enrolled || []);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchNotifications = async () => {
            try {
                const res = await authFetch('/api/notifications');
                if (res.ok) {
                    const data = await res.json();
                    const unread = data.filter(n => !n.read).length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchCourses();
        fetchNotifications();

        // Optional: Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [authFetch]);

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const navItems = [
        { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/student/assignments', icon: FileText, label: 'Assignments' },
        { path: '/student/courses', icon: BookOpen, label: 'Courses', hasSubmenu: true },
        { path: '/student/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
        { path: '/student/results', icon: PieChart, label: 'Results' },
        { path: '/student/profile', icon: User, label: 'Profile' }
    ];

    const [searchTerm, setSearchTerm] = useState('');

    const filteredNavItems = navItems.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <aside className="w-64 min-h-screen bg-white dark:bg-[#09090b] sticky top-0 left-0 flex flex-col border-r border-gray-100 dark:border-white/5 transition-colors duration-300">
            {/* Header */}
            <div className="p-6">
                <Link to="/student/dashboard" className="flex items-center gap-3 text-primary no-underline mb-8">
                    <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-lg transition-colors">
                        <GraduationCap size={28} strokeWidth={1.5} className="text-gray-700 dark:text-gray-200" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base leading-tight text-gray-800 dark:text-gray-100">Elevare</span>
                        <span className="font-bold text-base leading-tight text-gray-600 dark:text-gray-400">Students</span>
                    </div>
                </Link>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 text-sm pl-10 pr-4 py-3 rounded-xl border-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-white/10 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {filteredNavItems.map((item) => {
                    const active = isActive(item.path);

                    if (item.label === 'Courses') {
                        // Only show courses section if "courses" matches search OR if any course inside matches search
                        const matchCourses = filteredCourses.length > 0;
                        const matchLabel = 'courses'.includes(searchTerm.toLowerCase());

                        if (searchTerm && !matchLabel && !matchCourses) return null;

                        return (
                            <div key={item.path}>
                                <div className="flex items-center justify-between group">
                                    <Link
                                        to={item.path}
                                        className={`flex-1 flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${active && !isCoursesExpanded
                                            ? 'bg-primary text-white shadow-xl shadow-primary/10'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <item.icon size={22} strokeWidth={1.5} className={active && !isCoursesExpanded ? "text-white" : "text-gray-500 dark:text-gray-400"} />
                                        <span>{item.label}</span>
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsCoursesExpanded(!isCoursesExpanded);
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        {isCoursesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                </div>

                                {/* Submenu for Courses */}
                                {(isCoursesExpanded || searchTerm) && (
                                    <div className="ml-4 pl-4 border-l border-gray-100 dark:border-white/5 space-y-1 mt-1 mb-2">
                                        {filteredCourses.length > 0 ? (
                                            filteredCourses.map(course => (
                                                <Link
                                                    key={course._id}
                                                    to={`/student/courses/${course._id}`}
                                                    className={`block px-4 py-2 rounded-lg text-sm transition-colors ${isActive(`/student/courses/${course._id}`)
                                                        ? 'text-primary font-medium bg-primary/5 dark:bg-primary/10'
                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <span className="truncate block">{course.title}</span>
                                                </Link>
                                            ))
                                        ) : (
                                            courses.length > 0 && searchTerm ? <span className="block px-4 py-2 text-xs text-gray-400 italic">No matching courses</span> :
                                                <span className="block px-4 py-2 text-xs text-gray-400 italic">No courses enrolled</span>
                                        )}
                                        <Link
                                            to="/courses/join"
                                            className="block px-4 py-2 text-xs text-primary hover:underline font-medium"
                                        >
                                            + Join new course
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                ? 'bg-primary text-white shadow-xl shadow-primary/10'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="relative flex items-center gap-4">
                                <item.icon size={22} strokeWidth={1.5} className={active ? "text-white" : "text-gray-500 dark:text-gray-400"} />
                                <span>{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="absolute -right-2 -top-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-[#09090b]">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-6 space-y-2">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    <LogOut size={22} strokeWidth={1.5} />
                    <span>Logout</span>
                </button>

                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 text-gray-600 text-sm font-medium dark:text-gray-300">
                        <Sun size={22} strokeWidth={1.5} />
                        <span>{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
                    </div>
                    {/* Toggle Switch */}
                    <button
                        onClick={toggleTheme}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}
                        title="Toggle Theme"
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default StudentSidebar;
