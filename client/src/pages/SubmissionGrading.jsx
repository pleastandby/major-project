import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft,
    Bot,
    FileText,
    CheckCircle,
    Save,
    Download,
    Maximize2,
    Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SubmissionGrading = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authFetch } = useAuth(); // Changed to use authFetch

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('grading'); // 'ocr' or 'grading'
    const [gradingLoading, setGradingLoading] = useState(false);

    // Grading Form State
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [feedbackTab, setFeedbackTab] = useState('write'); // 'write' or 'preview'

    // Derived state for the file URL
    const backendUrl = 'http://localhost:5000';

    useEffect(() => {
        fetchSubmission();
    }, [id]);

    const fetchSubmission = async () => {
        try {
            const res = await authFetch(`/api/submissions/${id}`);
            const data = await res.json();
            setSubmission(data);
            setGrade(data.grade || '');
            setFeedback(data.feedback || '');
        } catch (error) {
            console.error("Error fetching submission:", error);
            alert("Failed to load submission");
        } finally {
            setLoading(false);
        }
    };

    const handleAIGrading = async () => {
        if (!window.confirm("Generate AI Grade? This will overwrite current feedback.")) return;

        setGradingLoading(true);
        try {
            const res = await authFetch(`/api/submissions/${id}/grade-ai`, {
                method: 'POST'
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'AI Grading failed');
            }

            setSubmission(data);
            setGrade(data.grade);

            // Clean up potentially quoted strings from AI
            const cleanFeedback = data.feedback ? data.feedback.replace(/^["']|["']$/g, '') : '';
            const cleanAnalysis = data.aiAnalysis ? data.aiAnalysis.replace(/^["']|["']$/g, '') : '';

            setFeedback(cleanFeedback);
            // Update submission directly in state to clean analysis too
            setSubmission(prev => ({ ...prev, aiAnalysis: cleanAnalysis }));

            setActiveTab('grading');
            setFeedbackTab('preview');
        } catch (error) {
            console.error("Error generating AI grade:", error);
            alert("AI Grading failed. Please ensure OCR text is available.");
        } finally {
            setGradingLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await authFetch(`/api/submissions/${id}/approve`, {
                method: 'PUT'
            });
            // Update local state
            setSubmission(prev => ({ ...prev, status: 'graded' }));
            alert("Submission approved and published!");
            navigate('/faculty/submissions');
        } catch (error) {
            console.error("Error approving:", error);
            alert("Failed to approve submission");
        }
    };

    const handleSaveManual = async () => {
        try {
            await authFetch(`/api/submissions/${id}/override`, {
                method: 'PUT',
                body: JSON.stringify({
                    grade: Number(grade),
                    feedback
                })
            });
            setSubmission(prev => ({ ...prev, status: 'graded', gradingMode: 'Manual', grade: Number(grade), feedback }));
            alert("Grade updated successfully!");
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Failed to save grade");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!submission) return <div>Submission not found</div>;

    const fileUrl = submission.files && submission.files.length > 0
        ? `${backendUrl}/${submission.files[0].path.replace(/\\/g, '/')}`
        : null;

    return (
        <div className="fixed inset-0 flex flex-col bg-gray-100 dark:bg-gray-900 z-50">
            {/* Header */}
            <div className="bg-white dark:bg-[#09090b] border-b border-gray-200 dark:border-white/5 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/faculty/submissions')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Grading Submission</h1>
                        <p className="text-xs text-gray-500">
                            Student: {submission.studentId?.name || 'Unknown'}
                            <span className="opacity-50 ml-2">({submission.studentId?._id || submission.studentId})</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${submission.status === 'graded'
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                        }`}>
                        {submission.status.toUpperCase()}
                    </span>
                    <button
                        onClick={handleApprove}
                        className="flex items-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <CheckCircle size={18} />
                        Approve & Publish
                    </button>
                </div>
            </div>

            {/* Main Content Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: File Viewer */}
                <div className="w-1/2 bg-gray-200 dark:bg-gray-950 flex flex-col border-r border-gray-300 dark:border-white/10">
                    <div className="p-2 bg-white dark:bg-[#09090b] border-b border-gray-200 dark:border-white/5 flex justify-between items-center text-xs text-gray-500">
                        <span>Original Submission</span>
                        <div className="flex gap-2">
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded"><Maximize2 size={16} /></a>
                            <a href={fileUrl} download className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded"><Download size={16} /></a>
                        </div>
                    </div>
                    <div className="flex-1 relative overflow-auto flex items-center justify-center p-4">
                        {fileUrl && fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                            <img src={fileUrl} alt="Submission" className="max-w-full max-h-full shadow-lg rounded" />
                        ) : fileUrl && fileUrl.match(/\.pdf$/i) ? (
                            <iframe src={fileUrl} className="w-full h-full rounded shadow-lg" title="PDF Viewer"></iframe>
                        ) : (
                            <div className="text-center text-gray-500">
                                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                                <p>File format not supported for preview</p>
                                <a href={fileUrl} className="text-primary hover:underline mt-2 inline-block">Download File</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Grading & OCR */}
                <div className="w-1/2 bg-white dark:bg-[#09090b] flex flex-col h-full overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-white/5">
                        <button
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ocr' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            onClick={() => setActiveTab('ocr')}
                        >
                            OCR Extraction
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'grading' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            onClick={() => setActiveTab('grading')}
                        >
                            Grading & Feedback
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'ocr' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <Bot className="text-blue-600 shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Gemini Vision OCR</h3>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                This text was automatically extracted from the student's handwritten submission.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Extracted Content</label>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                                        {submission.ocrText || "No text extracted."}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'grading' && (
                            <div className="space-y-6">
                                {/* AI Action */}
                                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-3">
                                            <Bot className="text-gray-900 dark:text-gray-100 shrink-0 mt-1" size={24} />
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">AI Auto-Grader</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Analyze OCR text against assignment criteria to generate a grade and feedback.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleAIGrading}
                                            disabled={gradingLoading}
                                            className="bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {gradingLoading ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} />}
                                            {submission.gradingMode === 'AI' ? 'Regenerate' : 'Generate Grade'}
                                        </button>
                                    </div>

                                    {submission.aiAnalysis && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase mb-3">AI Analysis</p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                                                <ReactMarkdown>{submission.aiAnalysis}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                                {/* Manual Form */}
                                <div className="space-y-4">
                                    <div>
                                        {(() => {
                                            const questions = submission.assignmentId?.questions;
                                            const defaultMax = submission.assignmentId?.maxPoints || 100;
                                            const dynamicMax = (questions && questions.length > 0)
                                                ? questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
                                                : defaultMax;
                                            const finalMax = dynamicMax > 0 ? dynamicMax : defaultMax;

                                            return (
                                                <>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Grade (Out of {finalMax})
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={grade}
                                                        max={finalMax}
                                                        onChange={(e) => setGrade(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-lg"
                                                        placeholder="0"
                                                    />
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Feedback
                                            </label>
                                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                                <button
                                                    onClick={() => setFeedbackTab('write')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${feedbackTab === 'write' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                                >
                                                    Write
                                                </button>
                                                <button
                                                    onClick={() => setFeedbackTab('preview')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${feedbackTab === 'preview' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                        </div>

                                        {feedbackTab === 'write' ? (
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                rows={8}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all resize-none font-mono text-sm"
                                                placeholder="Provide detailed feedback for the student (Markdown supported)..."
                                            />
                                        ) : (
                                            <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[200px] overflow-auto">
                                                {feedback ? (
                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                                                        <ReactMarkdown>{feedback}</ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 italic">No feedback entered yet.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleSaveManual}
                                            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                                        >
                                            <Save size={18} />
                                            Update Grade
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionGrading;
