import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Clock, ChevronRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authFetch } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both assignments and courses to check enrollment status
                const [assignmentsRes, coursesRes] = await Promise.all([
                    authFetch('/api/assignments/student/all'),
                    authFetch('/api/courses/my')
                ]);

                if (assignmentsRes.ok) {
                    const data = await assignmentsRes.json();
                    setAssignments(data);
                } else {
                    setError('Failed to load assignments');
                }

                if (coursesRes.ok) {
                    const coursesData = await coursesRes.json();
                    // Assuming structure { enrolled: [], created: [] } from getMyCourses
                    setEnrolledCoursesCount(coursesData.enrolled ? coursesData.enrolled.length : 0);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
                setLoading(false);
            }
        };

        fetchData();
    }, [authFetch]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Assignments</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and submit your course work</p>
                </div>
            </header>

            {assignments.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#09090b] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    {enrolledCoursesCount === 0 ? (
                        <>
                            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Join a course to view assignments</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-md mx-auto">
                                You are not enrolled in any courses yet. Join a course to start receiving assignments and tracking your progress.
                            </p>
                            <Link to="/courses/join" className="btn btn-primary shadow-lg shadow-primary/20">
                                Join a Course
                            </Link>
                        </>
                    ) : (
                        <>
                            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No assignments found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">You're all caught up! Check back later for new tasks.</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((assignment) => (
                        <Link
                            to={`/student/assignments/${assignment._id}`}
                            key={assignment._id}
                            className="bg-white dark:bg-[#09090b] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-6 hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.type === 'AI_Generated'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                    }`}>
                                    {assignment.type === 'AI_Generated' ? 'AI Assessment' : 'Assignment'}
                                </span>
                                {isOverdue(assignment.dueDate) && (
                                    <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                        <AlertCircle size={12} />
                                        Overdue
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                {assignment.title}
                            </h3>

                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-gray-200">{assignment.courseId?.courseCode}</span>
                                <span>•</span>
                                <span>{assignment.courseId?.title}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{formatDate(assignment.dueDate)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-primary">
                                    <span className="text-xs font-medium uppercase tracking-wider">View</span>
                                    <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentAssignments;
