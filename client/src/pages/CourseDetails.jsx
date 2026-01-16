import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Clock, FileText } from 'lucide-react';

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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="bg-primary/5 p-8 border-b border-primary/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white text-primary text-xs font-bold rounded-full mb-3 border border-primary/10">
                                {course.code}
                            </span>
                            <h1 className="text-3xl font-bold text-primary mb-2">{course.title}</h1>
                            <p className="text-gray-600 max-w-2xl">{course.description}</p>
                        </div>
                        {isCreator && (
                            <Link to={`/courses/${id}/settings`} className="btn btn-outline text-sm">
                                Settings
                            </Link>
                        )}
                    </div>
                </div>
                <div className="px-8 py-4 bg-gray-50 flex gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span>{course.meta?.department || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{course.meta?.semester || 'Ongoing'}</span>
                    </div>
                    <div>
                        Instructor: <span className="font-medium text-primary">{course.createdBy?.name || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-primary">Assignments</h2>
                        {isCreator && (
                            <Link to={`/courses/${id}/assignments/create`} className="btn btn-primary text-sm py-2">
                                + Create Assignment
                            </Link>
                        )}
                    </div>

                    {assignments.length > 0 ? (
                        <div className="space-y-4">
                            {assignments.map(assignment => (
                                <Link key={assignment._id} to={`/assignments/${assignment._id}`} className="block bg-white p-6 rounded-xl border border-gray-100 hover:border-link transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-primary group-hover:text-link transition-colors">{assignment.title}</h3>
                                        {assignment.dueDate && (
                                            <span className="text-xs font-medium bg-red-50 text-error px-2 py-1 rounded">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{assignment.description}</p>
                                    <div className="flex gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><FileText size={12} /> {assignment.maxPoints} Points</span>
                                        <span className={`px-2 py-0.5 rounded-full ${assignment.type === 'AI_Generated' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {assignment.type === 'AI_Generated' ? 'AI' : 'Manual'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-primary mb-1">No assignments yet</h3>
                            <p className="text-gray-500 text-sm">
                                {isCreator ? "Create your first assignment to get started." : "Check back later for new tasks."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-primary">Classroom Info</h2>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="font-medium text-primary mb-4">Syllabus</h3>
                        <p className="text-sm text-gray-500 mb-4">No syllabus uploaded.</p>
                        {isCreator && (
                            <button className="btn btn-outline w-full text-sm">Upload Syllabus</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
