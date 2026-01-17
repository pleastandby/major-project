import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Bell, PieChart, User, LogOut, Search, Sun, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const StudentSidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const navItems = [
        { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/student/assignments', icon: FileText, label: 'Assignments' },
        { path: '/student/courses', icon: BookOpen, label: 'Courses' },
        { path: '/student/notifications', icon: Bell, label: 'Notifications' },
        { path: '/student/results', icon: PieChart, label: 'Results' },
        { path: '/student/profile', icon: User, label: 'Profile' }
    ];

    return (
        <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 sticky top-0 left-0 flex flex-col border-r border-gray-100 dark:border-gray-800 transition-colors duration-200">
            {/* Header */}
            <div className="p-6">
                <Link to="/student/dashboard" className="flex items-center gap-3 text-primary no-underline mb-8">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg transition-colors">
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
                        placeholder="Search..."
                        className="w-full bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm pl-10 pr-4 py-3 rounded-xl border-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                ? 'text-gray-900 dark:text-white bg-transparent'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <item.icon size={22} strokeWidth={1.5} className={active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"} />
                            <span>{item.label}</span>
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
