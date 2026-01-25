import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Sparkles, Edit2, Save, X, RefreshCw, Loader2 } from 'lucide-react';

const AssignmentView = () => {
    const { authFetch } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestions, setEditedQuestions] = useState([]);
    const [editedMetadata, setEditedMetadata] = useState({ title: '', description: '', dueDate: '' });
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await authFetch(`/api/faculty/assignments/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAssignment(data);
                    setEditedQuestions(data.questions || []);
                    setEditedMetadata({
                        title: data.title,
                        description: data.description,
                        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : ''
                    });
                }
            } catch (err) {
                console.error('Failed to fetch assignment:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [authFetch, id]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedQuestions([...assignment.questions]);
        setEditedMetadata({
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : ''
        });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedQuestions([...assignment.questions]);
    };

    const handleQuestionChange = (index, field, value) => {
        const updated = [...editedQuestions];
        updated[index][field] = value;
        setEditedQuestions(updated);
    };

    const handleMetadataChange = (e) => {
        setEditedMetadata({ ...editedMetadata, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authFetch(`/api/faculty/assignments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: editedQuestions,
                    ...editedMetadata
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAssignment(data.assignment);
                setEditedQuestions(data.assignment.questions);
                setIsEditing(false);
                alert('Changes saved successfully!');
            } else {
                alert('Failed to save changes');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async (index) => {
        setRegenerating(index);
        try {
            const res = await authFetch(`/api/faculty/assignments/${id}/regenerate-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionIndex: index,
                    syllabusId: assignment.syllabusId,
                    topics: assignment.topics,
                    marksPerQuestion: editedQuestions[index].marks
                })
            });

            if (res.ok) {
                const newQuestion = await res.json();
                const updated = [...editedQuestions];
                updated[index] = newQuestion;
                setEditedQuestions(updated);
            } else {
                alert('Failed to regenerate question');
            }
        } catch (err) {
            console.error(err);
            alert('Error regenerating question');
        } finally {
            setRegenerating(null);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Assignment not found</p>
                    <Link to="/faculty/assignments" className="text-primary hover:underline mt-4 inline-block">
                        Back to Assignments
                    </Link>
                </div>
            </div>
        );
    }

    const displayQuestions = isEditing ? editedQuestions : assignment.questions;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <Link
                to="/faculty/assignments"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-6"
            >
                <ArrowLeft size={18} />
                Back to Assignments
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                {/* Header */}
                <div className="border-b border-gray-100 dark:border-gray-700 pb-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 mr-4">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="title"
                                    value={editedMetadata.title}
                                    onChange={handleMetadataChange}
                                    className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none w-full"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {assignment.title}
                                </h1>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {assignment.type === 'AI_Generated' && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                                    <Sparkles size={14} />
                                    AI Generated
                                </span>
                            )}
                            {!isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate('/faculty/submissions', { state: { expandedAssignmentId: assignment._id } })}
                                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex -space-x-1 mr-1">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-4 h-4 rounded-full bg-gray-500 border border-white"></div>
                                            ))}
                                        </div>
                                        View Submissions
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <textarea
                            name="description"
                            value={editedMetadata.description}
                            onChange={handleMetadataChange}
                            rows={3}
                            className="w-full text-gray-600 dark:text-gray-400 mb-4 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:border-primary outline-none"
                        />
                    ) : (
                        assignment.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">{assignment.description}</p>
                        )
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Created: {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>

                        <span className="flex items-center gap-1">
                            <Calendar size={14} className={isEditing ? "text-primary" : ""} />
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Due:</span>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={editedMetadata.dueDate}
                                        onChange={handleMetadataChange}
                                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            ) : (
                                <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                            )}
                        </span>

                        <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {assignment.questions?.length || 0} Questions
                        </span>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Questions</h2>
                    {displayQuestions && displayQuestions.length > 0 ? (
                        <div className="space-y-4">
                            {displayQuestions.map((q, idx) => (
                                <div
                                    key={idx}
                                    className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <div className="flex gap-3 flex-1">
                                            <span className="font-bold text-gray-400 mt-1">Q{idx + 1}.</span>
                                            {isEditing ? (
                                                <textarea
                                                    value={q.questionText}
                                                    onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
                                                    rows={3}
                                                />
                                            ) : (
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {q.questionText}
                                                </p>
                                            )}
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={q.marks}
                                                onChange={(e) => handleQuestionChange(idx, 'marks', parseInt(e.target.value))}
                                                className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-center text-sm font-semibold text-primary"
                                            />
                                        ) : (
                                            <span className="shrink-0 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                                                {q.marks} Marks
                                            </span>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="mt-3 ml-8 flex justify-end">
                                            <button
                                                onClick={() => handleRegenerate(idx)}
                                                disabled={regenerating === idx}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                                            >
                                                {regenerating === idx ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Regenerating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={14} />
                                                        Regenerate with AI
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No questions available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentView;
