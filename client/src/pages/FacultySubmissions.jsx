import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FileText,
    ChevronDown,
    ChevronUp,
    User,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock,
    Search,
    Filter,
    Loader2
} from 'lucide-react';

const FacultySubmissions = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
    const [submissionsCache, setSubmissionsCache] = useState({});
    const [loadingSubmissions, setLoadingSubmissions] = useState({});
    const { authFetch } = useAuth(); // Removed token, used authFetch
    const navigate = useNavigate();

    useEffect(() => {
        // Test connectivity
        fetch('/api/submissions/test-connectivity')
            .then(res => res.json())
            .then(data => console.log('Connectivity Test:', data))
            .catch(err => console.error('Connectivity Test Failed:', err));

        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const coursesRes = await authFetch('/api/courses/my');
            const coursesData = await coursesRes.json();

            // The API returns { enrolled: [], created: [] }
            // For faculty dashboard, we generally want 'created' (which includes instructed courses)
            const courses = coursesData.created || [];

            let allAssignments = [];
            for (const course of courses) {
                try {
                    const assignRes = await authFetch(`/api/assignments/course/${course._id}`);
                    const courseAssignments = await assignRes.json();

                    if (Array.isArray(courseAssignments)) {
                        const mappedAssignments = courseAssignments.map(a => ({ ...a, courseTitle: course.title, courseCode: course.code }));
                        allAssignments = [...allAssignments, ...mappedAssignments];
                    }
                } catch (err) {
                    console.error(`Failed to fetch assignments for course ${course._id}`, err);
                }
            }

            allAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAssignments(allAssignments);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = async (assignmentId) => {
        if (expandedAssignmentId === assignmentId) {
            setExpandedAssignmentId(null);
            return;
        }

        setExpandedAssignmentId(assignmentId);
        console.log("Expanding assignment:", assignmentId);

        if (!submissionsCache[assignmentId]) {
            setLoadingSubmissions(prev => ({ ...prev, [assignmentId]: true }));
            try {
                const res = await authFetch(`/api/submissions/list/${assignmentId}`);
                const data = await res.json();
                setSubmissionsCache(prev => ({ ...prev, [assignmentId]: data }));
            } catch (error) {
                console.error("Error fetching submissions:", error);
            } finally {
                setLoadingSubmissions(prev => ({ ...prev, [assignmentId]: false }));
            }
        }
    };

    const handleGradeClick = (submissionId) => {
        navigate(`/faculty/submissions/${submissionId}/grading`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Submissions</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Review student submissions across all courses</p>
                    </div>
                </div>
                {/* Search/Filter (Visual only for MVP) */}
                <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <Search size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {assignments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No assignments found. Create an assignment to see submissions here.</p>
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div key={assignment._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                            {/* Assignment Header */}
                            <div
                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleExpand(assignment._id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-lg ${expandedAssignmentId === assignment._id ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{assignment.title}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            <span className="font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                                                {assignment.courseCode}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-xs text-gray-400 dark:text-gray-500">Status</div>
                                        {/* We could show count of submissions here if we had it in assignment object */}
                                        <div className="font-medium text-gray-700 dark:text-gray-300">View Students</div>
                                    </div>
                                    {expandedAssignmentId === assignment._id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Submissions List */}
                            {expandedAssignmentId === assignment._id && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                                    {loadingSubmissions[assignment._id] ? (
                                        <div className="p-8 text-center">
                                            <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                                            <p className="text-sm text-gray-500 mt-2">Loading submissions...</p>
                                        </div>
                                    ) : (submissionsCache[assignment._id] && submissionsCache[assignment._id].length > 0) ? (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Student</th>
                                                    <th className="px-6 py-3 font-medium">Submitted</th>
                                                    <th className="px-6 py-3 font-medium">AI Grade</th>
                                                    <th className="px-6 py-3 font-medium">Status</th>
                                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {submissionsCache[assignment._id].map((sub) => (
                                                    <tr key={sub._id} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                                                                    {sub.studentId?.name?.charAt(0) || 'S'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{sub.studentId?.name || 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-500">{sub.studentId?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={14} />
                                                                {new Date(sub.submittedAt).toLocaleDateString()}
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {sub.grade !== undefined ? (
                                                                <span className={`font-bold ${sub.gradingMode === 'AI' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                                    {sub.grade}/{(() => {
                                                                        const questions = assignment.questions;
                                                                        const defaultMax = assignment.maxPoints || 100;
                                                                        const dynamicMax = (questions && questions.length > 0)
                                                                            ? questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
                                                                            : defaultMax;
                                                                        return dynamicMax > 0 ? dynamicMax : defaultMax;
                                                                    })()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Pending</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sub.status === 'graded'
                                                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                                : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                                                                }`}>
                                                                {sub.status === 'graded' ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                                                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleGradeClick(sub._id)}
                                                                className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm hover:underline"
                                                            >
                                                                {sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-800/50">
                                            No submissions received yet for this assignment.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FacultySubmissions;
