import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Clock, FileText } from 'lucide-react';
import { getCourseIcon } from '../utils/iconUtils';

const CourseDetails = () => {
    const { id } = useParams();
    const { authFetch, user } = useAuth();
    const [course, setCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchCourse = async () => {
                try {
                    const res = await authFetch(`/api/courses/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setCourse(data);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };

            const fetchAssignments = async () => {
                try {
                    const res = await authFetch(`/api/assignments/course/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setAssignments(data || []);
                    }
                } catch (err) {
                    console.error(err);
                }
            };

            fetchCourse();
            fetchAssignments();
        }
    }, [id, authFetch]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
    if (!course) return <div className="text-center py-20">Course not found</div>;

    const isCreator = course.createdBy?._id === user?._id;

    return (
        <div className="max-w-5xl mx-auto">
            <Link to={user?.roles?.includes('faculty') ? "/faculty/dashboard" : "/student/dashboard"} className="inline-flex items-center gap-2 text-accent hover:text-primary mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="bg-white dark:bg-[#121214] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden mb-8 transition-colors">
                <div className="bg-primary/5 dark:bg-white/5 p-8 border-b border-primary/10 dark:border-white/5">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden relative`} style={{ backgroundColor: !course.theme?.logo ? `var(--color-${course.theme?.color || 'blue'}-900)` : 'transparent', background: !course.theme?.logo && course.theme?.color ? `var(--color-${course.theme.color}-900)` : undefined }}>
                                    {course.theme?.logo ? (
                                        <img
                                            src={`http://localhost:5000/${course.theme.logo}`}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentNode.style.backgroundColor = `var(--color-${course.theme?.color || 'blue'}-900)`;
                                                e.target.parentNode.innerHTML = `<span class="font-mono text-lg capitalize">${(course.code || 'C').charAt(0).toUpperCase()}</span>`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {(() => {
                                                const Icon = getCourseIcon(course.theme?.icon);
                                                return <Icon size={24} />;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <span className="inline-block px-3 py-1 bg-white dark:bg-white/10 text-primary dark:text-white text-xs font-bold rounded-full border border-primary/10 dark:border-white/5">
                                    {course.code}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-primary dark:text-gray-50 mb-2">{course.title}</h1>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">{course.description}</p>
                        </div>
                        {isCreator && (
                            <Link to={`/courses/${id}/settings`} className="btn btn-outline text-sm dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/10">
                                Settings
                            </Link>
                        )}
                    </div>
                </div>
                <div className="px-8 py-4 bg-gray-50 dark:bg-white/5 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span>{course.meta?.department || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{course.meta?.semester || 'Ongoing'}</span>
                    </div>
                    <div>
                        Instructor: <span className="font-medium text-primary dark:text-gray-200">{course.createdBy?.name || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-primary dark:text-gray-100">Assignments</h2>
                        {isCreator && (
                            <div className="flex gap-2">
                                <Link to={`/courses/${id}/assignments/create`} className="btn btn-outline text-sm py-2 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/10">
                                    + Manual
                                </Link>
                                <Link to={`/faculty/assignments/generate?courseId=${id}`} className="btn btn-primary text-sm py-2 flex items-center gap-1">
                                    <span className="text-xs">✨</span> Generate AI
                                </Link>
                            </div>
                        )}
                    </div>

                    {assignments.length > 0 ? (
                        <div className="space-y-4">
                            {assignments.map(assignment => (
                                <Link key={assignment._id} to={`/assignments/${assignment._id}`} className="block bg-white dark:bg-[#121214] p-6 rounded-xl border border-gray-100 dark:border-white/5 hover:border-link dark:hover:border-link transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-primary dark:text-gray-100 group-hover:text-link transition-colors">{assignment.title}</h3>
                                        {assignment.dueDate && (
                                            <span className="text-xs font-medium bg-red-50 dark:bg-red-900/10 text-error dark:text-red-300 px-2 py-1 rounded">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">{assignment.description}</p>
                                    <div className="flex gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><FileText size={12} /> {assignment.maxPoints} Points</span>
                                        <span className={`px-2 py-0.5 rounded-full ${assignment.type === 'AI_Generated' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                            {assignment.type === 'AI_Generated' ? 'AI' : 'Manual'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#121214] rounded-xl border border-gray-100 dark:border-white/5 p-8 text-center transition-colors">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-primary dark:text-gray-100 mb-1">No assignments yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {isCreator ? "Create your first assignment to get started." : "Check back later for new tasks."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-primary dark:text-gray-100">Classroom Info</h2>
                    <div className="bg-white dark:bg-[#121214] rounded-xl border border-gray-100 dark:border-white/5 p-6 transition-colors">
                        <h3 className="font-medium text-primary dark:text-gray-200 mb-4">Syllabus</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No syllabus uploaded.</p>
                        {isCreator && (
                            <Link to="/faculty/syllabus" className="btn btn-outline w-full text-sm inline-block text-center py-2 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/10">
                                Upload a Syllabus
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
