import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, ArrowRight, CheckCircle, Search, ChevronDown, Bot, ChartBar, Wand2, Clock, Loader2, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

const StudentResults = () => {
    const { authFetch } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedResult, setExpandedResult] = useState(null);

    const toggleExpand = (id) => {
        setExpandedResult(expandedResult === id ? null : id);
    };

    // Helper to calculate max points dynamically from questions if available
    const getClassScore = (sub) => {
        if (!sub || !sub.assignmentId) return 100;
        const questions = sub.assignmentId.questions;
        const defaultMax = sub.assignmentId.maxPoints || 100;

        if (questions && questions.length > 0) {
            const sum = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
            return sum > 0 ? sum : defaultMax;
        }
        return defaultMax;
    };

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await authFetch('/api/submissions/my-results');
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (error) {
            console.error("Failed to fetch results", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        const title = sub.assignmentId?.title || 'Unknown Assignment';
        return title.toLowerCase().includes(search.toLowerCase());
    });

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <LoadingSpinner size="xl" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={28} />
                        My Results
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Track your performance across all assignments
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search assignments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Results Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {search ? "No assignments match your search." : "Complete assignments and wait for them to be graded to see your results here."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSubmissions.map((sub) => (
                        <div key={sub._id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${(sub.grade / getClassScore(sub)) >= 0.8
                                    ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                    <span className="font-bold text-lg">{sub.grade}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                        {sub.assignmentId?.title || 'Unknown Assignment'}
                                    </h3>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                                        {sub.assignmentId?.courseTitle || 'Course Assignment'}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(sub.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                                            Graded
                                        </span>
                                        {sub.gradingMode === 'AI' ? (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                                <Wand2 size={12} /> AI Graded
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                                <User size={12} /> Faculty Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="hidden md:block text-right">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Score</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {Math.round((sub.grade / getClassScore(sub)) * 100)}%
                                    </p>
                                </div>
                                <Link
                                    to={`/student/assignments/${sub.assignmentId?._id}`}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity"
                                >
                                    View Feedback
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentResults;
