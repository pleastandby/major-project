import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import Lottie from 'lottie-react';

const FacultyDashboard = () => {
    const { user, authFetch } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await authFetch('/api/courses/my');
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.created)) {
                        setCourses(data.created);
                    } else {
                        setCourses([]);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        // Fetch Lottie Animation
        fetch('/Books.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load Lottie');
                return res.json();
            })
            .then(data => setAnimationData(data))
            .catch(err => console.error('Failed to load animation', err));

        fetchCourses();
    }, [authFetch]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="bg-[#3C3D37] rounded-xl p-8 md:p-12 mb-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="z-10 relative text-center md:text-left">
                    <h1 className="text-4xl font-bold mb-2">Welcome back {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-gray-300 text-lg">Manage your courses and assignments!</p>
                </div>
                {/* Lottie Animation */}
                {/* Lottie Animation */
                /* {animationData && (
                    <div className="w-48 h-48 md:w-64 md:h-64 absolute right-0 -bottom-10 opacity-20 md:opacity-100 md:relative md:opacity-100 md:bottom-auto pointer-events-none">
                        <Lottie animationData={animationData} loop={true} />
                    </div>
                )} */}
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
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl h-80 border border-gray-100 dark:border-gray-700">
                            {/* Placeholder for overview content */}
                        </div>
                    </div>
                </div>

                {/* Right Column (Notifications) - Takes 1 col */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notification</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 min-h-[500px]">
                        {/* Mock Notification Item */}
                        <div className="text-gray-500 text-center mt-10 text-sm">
                            No new notifications
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboard;
