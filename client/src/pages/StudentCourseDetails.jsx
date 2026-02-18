import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Clock, FileText, Users, Calendar, Info, GraduationCap, LogOut, AlertTriangle, X } from 'lucide-react';
import { getCourseIcon } from '../utils/iconUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentCourseDetails = () => {
    const { id } = useParams();
    const { authFetch, user } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [classmates, setClassmates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assignments'); // 'assignments', 'classmates', 'about'

    // Leave Course State
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (id) {
            Promise.all([
                fetchCourse(),
                fetchAssignments(),
                fetchClassmates()
            ]).finally(() => setLoading(false));
        }
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await authFetch(`/api/courses/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (err) {
            console.error(err);
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

    const fetchClassmates = async () => {
        try {
            const res = await authFetch(`/api/courses/${id}/students`);
            if (res.ok) {
                const data = await res.json();
                setClassmates(data || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLeaveCourse = async () => {
        setLeaving(true);
        try {
            const res = await authFetch(`/api/courses/${id}/leave`, {
                method: 'DELETE'
            });

            if (res.ok) {
                navigate('/student/courses');
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to leave course');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to leave course');
        } finally {
            setLeaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <LoadingSpinner size="xl" />
        </div>
    );

    if (!course) return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold">Course not found</h2>
            <Link to="/student/courses" className="text-primary hover:underline mt-2 inline-block">Back to Courses</Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 pb-12">
            <button
                onClick={() => navigate('/student/courses')}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to My Courses
            </button>

            {/* Course Header */}
            <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden mb-8 transition-colors">
                <div className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 p-8 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 p-12 opacity-5 transform rotate-12 scale-150 pointer-events-none">
                        {(() => {
                            const Icon = getCourseIcon(course.theme?.icon);
                            return <Icon size={200} />;
                        })()}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                        {/* Course Logo/Icon */}
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden`}
                            style={{
                                backgroundColor: !course.theme?.logo ? `var(--color-${course.theme?.color || 'blue'}-600)` : 'transparent',
                                background: !course.theme?.logo && course.theme?.color ? `linear-gradient(135deg, var(--color-${course.theme.color}-500), var(--color-${course.theme.color}-700))` : undefined
                            }}>
                            {course.theme?.logo ? (
                                <img
                                    src={`http://localhost:5000/${course.theme.logo}`}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentNode.style.background = `linear-gradient(135deg, var(--color-${course.theme?.color || 'blue'}-500), var(--color-${course.theme?.color || 'blue'}-700))`;
                                        e.target.parentNode.innerHTML = `<span class="font-mono text-4xl font-bold">${(course.code || 'C').slice(0, 2).toUpperCase()}</span>`;
                                    }}
                                />
                            ) : (
                                <div className="text-white">
                                    {(() => {
                                        const Icon = getCourseIcon(course.theme?.icon);
                                        return <Icon size={48} />;
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="inline-block px-3 py-1 bg-white/50 dark:bg-black/20 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-full border border-gray-200 dark:border-white/10 backdrop-blur-sm">
                                    {course.code}
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-white/10">
                                    <Clock size={12} />
                                    {course.meta?.semester || 'Current Semester'}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">{course.title}</h1>

                            <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-primary" />
                                    <span>{course.meta?.department || 'General Department'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={16} className="text-primary" />
                                    <span>Instructor: <span className="font-medium text-gray-900 dark:text-gray-200">{course.createdBy?.name || 'Faculty'}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-t border-gray-100 dark:border-white/5 px-4 md:px-8">
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <FileText size={18} />
                        Assignments
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{assignments.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('classmates')}
                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'classmates' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <Users size={18} />
                        Classmates
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{classmates.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        <Info size={18} />
                        About & Syllabus
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'assignments' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.length > 0 ? (
                            assignments.map(assignment => (
                                <Link
                                    key={assignment._id}
                                    to={`/student/assignments/${assignment._id}`}
                                    className="bg-white dark:bg-[#09090b] p-6 rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{assignment.title}</h3>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wider ${assignment.type === 'AI_Generated'
                                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300'
                                            : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                                            }`}>
                                            {assignment.type === 'AI_Generated' ? 'AI Task' : 'Assignment'}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10">{assignment.description}</p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-50 dark:border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <span>Due: <span className="text-gray-700 dark:text-gray-300 font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</span></span>
                                        </div>
                                        <div className="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                                            {assignment.maxPoints} pts
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-16 text-center bg-white dark:bg-[#09090b] rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Assignments Yet</h3>
                                <p className="text-gray-500 dark:text-gray-400">Check back later for new tasks.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'classmates' && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {classmates.length > 0 ? (
                                classmates.map(student => (
                                    <div key={student._id} className="bg-white dark:bg-[#09090b] p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-4 hover:shadow-sm transition-shadow">
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{student.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-16 text-center bg-white dark:bg-[#09090b] rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Classroom is empty</h3>
                                    <p className="text-gray-500 dark:text-gray-400">You are the first one here!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="bg-white dark:bg-[#09090b] p-8 rounded-xl border border-gray-100 dark:border-white/5 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <Info size={20} className="text-primary" />
                                Course Description
                            </h3>
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                                    {course.description || "No description provided for this course."}
                                </p>
                            </div>

                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">Faculty Bio</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-white/5 p-4 rounded-lg border-l-4 border-primary">
                                {course.createdBy?.bio || `Instructor ${course.createdBy?.name} has not added a bio yet.`}
                            </p>
                        </div>

                        {/* Leave Course Section */}
                        <div className="pt-8 border-t border-gray-100 dark:border-white/10">
                            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Once you leave the course, you will lose access to all assignments and materials.
                            </p>
                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                Leave Course
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Leave Course Confirmation Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 mx-auto">
                                <AlertTriangle size={24} />
                            </div>

                            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
                                Leave Course?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                                Are you sure you want to leave <strong>{course.title}</strong>? You will lose access to all assignments and this action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLeaveModal(false)}
                                    className="flex-1 btn bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
                                    disabled={leaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeaveCourse}
                                    className="flex-1 btn bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20"
                                    disabled={leaving}
                                >
                                    {leaving ? 'Leaving...' : 'Yes, Leave'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCourseDetails;
