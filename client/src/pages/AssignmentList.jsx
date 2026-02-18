import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Calendar, Eye, Sparkles, Trash2, Inbox } from 'lucide-react';

const AssignmentList = () => {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await authFetch('/api/faculty/assignments');
                if (res.ok) {
                    const data = await res.json();
                    setAssignments(data);
                }
            } catch (err) {
                console.error('Failed to fetch assignments:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [authFetch]);

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`/api/faculty/assignments/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setAssignments(assignments.filter(a => a._id !== id));
            } else {
                alert('Failed to delete assignment');
            }
        } catch (err) {
            console.error('Error deleting assignment:', err);
            alert('Error deleting assignment');
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Assignments</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        View and manage your generated assignments
                    </p>
                </div>
                <Link
                    to="/faculty/assignments/generate"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-md"
                >
                    <Sparkles size={18} />
                    Generate New
                </Link>
            </div>

            {assignments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-full w-fit mx-auto mb-6">
                        <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Assignments Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Get started by generating your first AI-powered assignment
                    </p>
                    <Link
                        to="/faculty/assignments/generate"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all"
                    >
                        <Sparkles size={18} />
                        Generate Assignment
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {assignments.map((assignment) => (
                        <Link
                            key={assignment._id}
                            to={`/faculty/assignments/${assignment._id}`}
                            className="card group block hover:no-underline"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                            {assignment.title}
                                        </h3>
                                        {assignment.type === 'AI_Generated' && (
                                            <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                                <Sparkles size={12} />
                                                AI
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                        {assignment.description || 'No description'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full">
                                            <FileText size={14} />
                                            {assignment.questions?.length || 0} Qs
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full">
                                            <Calendar size={14} />
                                            {new Date(assignment.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full">
                                            <Calendar size={14} className="text-red-400" />
                                            Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate('/faculty/submissions', { state: { expandedAssignmentId: assignment._id } });
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors border ${(() => {
                                                const total = assignment.totalStudents || 0;
                                                const submitted = assignment.submissionCount || 0;

                                                if (total === 0) return 'border-gray-200 text-gray-500 bg-gray-50';

                                                const ratio = submitted / total;
                                                if (ratio < 0.3) return 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100';
                                                if (ratio < 0.7) return 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100';
                                                return 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100';
                                            })()}`}
                                            title={`${assignment.submissionCount || 0} of ${assignment.totalStudents || 0} students submitted`}
                                        >
                                            <Inbox size={14} />
                                            {assignment.submissionCount || 0}/{assignment.totalStudents || 0}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                    <button
                                        className="btn bg-gray-50 dark:bg-white/5 text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full px-3 hover:px-5 py-2.5 transition-all duration-300 group flex items-center justify-center gap-0 hover:gap-2"
                                        aria-label="View Assignment"
                                    >
                                        <Eye size={18} />
                                        <span className="max-w-0 overflow-hidden group-hover:max-w-[40px] transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                            View
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (window.confirm('Are you sure you want to delete this assignment?')) {
                                                handleDelete(assignment._id);
                                            }
                                        }}
                                        className="btn bg-black text-white hover:bg-gray-800 rounded-full px-3 hover:px-5 py-2.5 transition-all duration-300 group flex items-center justify-center gap-0 hover:gap-2"
                                        aria-label="Delete Assignment"
                                    >
                                        <Trash2 size={18} />
                                        <span className="max-w-0 overflow-hidden group-hover:max-w-[50px] transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                            Delete
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignmentList;
