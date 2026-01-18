import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { getCourseIcon } from '../utils/iconUtils';

const StudentCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { authFetch } = useAuth();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await authFetch('/api/courses/my');
            if (res.ok) {
                const data = await res.json();
                setCourses(data.enrolled || []);
            } else {
                setError('Failed to load courses');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <LoadingSpinner size="xl" />
        </div>
    );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Courses</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your enrolled courses</p>
                </div>
                <Link to="/courses/join" className="btn btn-primary shadow-lg shadow-primary/20">
                    Join New Course
                </Link>
            </header>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            {courses.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#09090b] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No courses yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Join a course to get started with your learning journey.</p>
                    <Link to="/courses/join" className="text-primary font-medium hover:underline">
                        Join your first course
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Link
                            key={course._id}
                            to={`/student/courses/${course._id}`}
                            className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden group hover:shadow-md transition-all duration-300 block"
                        >
                            {/* Course Header/Banner */}
                            <div className="h-24 bg-linear-to-r from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 relative">
                                {course.theme?.logo ? (
                                    <img
                                        src={`http://localhost:5000/${course.theme.logo}`}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-linear-to-r ${course.theme?.color === 'purple' ? 'from-purple-500 to-indigo-600' :
                                        course.theme?.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                                            course.theme?.color === 'green' ? 'from-green-500 to-emerald-600' :
                                                course.theme?.color === 'orange' ? 'from-orange-500 to-red-600' :
                                                    course.theme?.color === 'pink' ? 'from-pink-500 to-rose-600' :
                                                        'from-blue-500 to-indigo-600' // Default
                                        }`}></div>
                                )}

                                {/* Floating Icon */}
                                <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-xl bg-white dark:bg-[#18181b] shadow-md flex items-center justify-center p-2 border border-gray-100 dark:border-white/10 text-primary">
                                    {(() => {
                                        const Icon = getCourseIcon(course.theme?.icon);
                                        return <Icon size={24} />;
                                    })()}
                                </div>

                                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-700 dark:text-white border border-white/20">
                                    {course.code}
                                </div>
                            </div>

                            <div className="p-6 pt-10">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                    {course.title}
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                                    {course.description || 'No description available for this course.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Calendar size={14} />
                                        {course.meta?.semester || 'Current Semester'}
                                    </div>
                                    <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded">
                                        View Class
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentCourses;
