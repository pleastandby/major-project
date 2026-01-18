import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, CheckCircle, Wand2, Calendar, Tag, AlertCircle, FileType, ArrowLeft, Clock, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const StudentAssignmentSubmission = () => {
    const { id } = useParams();
    const { authFetch, user } = useAuth();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [grading, setGrading] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const assignRes = await authFetch(`/api/assignments/${id}`);
            if (assignRes.ok) {
                const data = await assignRes.json();
                setAssignment(data);

                // Fetch existing submission if any
                const subRes = await authFetch(`/api/submissions/assignment/${id}`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    if (subData) {
                        setSubmission(subData);
                        setExtractedText(subData.ocrText);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('assignmentId', id);

        try {
            const res = await authFetch('/api/submissions/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setSubmission(data.submission);
                setExtractedText(data.extractedText);
                setFile(null);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error uploading file');
        } finally {
            setUploading(false);
        }
    };

    // Allow student to trigger AI grading for instant feedback if enabled
    const handleAIGrade = async () => {
        if (!submission) return;
        setGrading(true);
        try {
            const res = await authFetch(`/api/submissions/${submission._id}/grade-ai`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setSubmission(data);
            } else {
                alert('Grading failed');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGrading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <LoadingSpinner size="xl" />
        </div>
    );

    if (!assignment) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
            <AlertCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-xl font-medium">Assignment not found</p>
            <button onClick={() => navigate('/student/assignments')} className="mt-4 text-primary hover:underline">Back to Assignments</button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            <button
                onClick={() => navigate('/student/assignments')}
                className="group flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Assignments
            </button>

            {/* Assignment Header Card */}
            <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-lg shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden mb-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-purple-500"></div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${assignment.type === 'AI_Generated'
                                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-100 dark:border-white/5'
                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-white/5'
                                    }`}>
                                    {assignment.type === 'AI_Generated' ? 'AI Generated' : 'Manual'}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${assignment.difficulty === 'Hard' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    assignment.difficulty === 'Medium' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                        'bg-green-50 text-green-600 border border-green-100'
                                    }`}>
                                    {assignment.difficulty}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{assignment.title}</h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span>Due: <span className="font-medium text-gray-900 dark:text-gray-200">{new Date(assignment.dueDate).toLocaleDateString()}</span></span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                                    <Tag size={16} className="text-gray-400" />
                                    <span>Points: <span className="font-medium text-gray-900 dark:text-gray-200">{assignment.maxPoints}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="my-6 border-gray-100 dark:border-white/5" />

                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Instructions
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
                    </div>

                    {assignment.questions && assignment.questions.length > 0 && (
                        <>
                            <hr className="my-6 border-gray-100 dark:border-white/5" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-primary" />
                                    Questions
                                </h3>
                                <div className="space-y-4">
                                    {assignment.questions.map((q, idx) => (
                                        <div key={idx} className="p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-3 flex-1">
                                                    <span className="font-bold text-gray-400 mt-1">Q{idx + 1}.</span>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                                        {q.questionText}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                                                    {q.marks} Marks
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Submission Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Submission Status/Upload */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                            Your Submission
                        </h2>

                        {submission ? (
                            <div className="animate-fade-in-up">
                                <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-3 text-green-700 dark:text-green-400 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                        <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">Submitted Successfully</p>
                                        <p className="text-xs text-green-700/80 dark:text-green-400/80">Uploaded on {new Date(submission.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {extractedText && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
                                                <FileText size={16} className="text-gray-400" />
                                                OCR Extracted Content
                                                <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">Automated</span>
                                            </h3>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-mono text-gray-700 dark:text-gray-300 relative group">
                                            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap">
                                                {extractedText}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${dragActive
                                    ? 'border-primary bg-primary/5 scale-[1.01]'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-white/5 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/10'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4 text-primary">
                                    <Upload size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">Upload your assignment</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                                    Drag and drop your file here, or click to browse.
                                    <br /><span className="text-xs mt-1 block opacity-70">Supports PDF, PNG, JPG (Max 5MB)</span>
                                </p>

                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept="image/*,.pdf"
                                />

                                <div className="flex flex-col items-center gap-4">
                                    <label
                                        htmlFor="file-upload"
                                        className="btn bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 shadow-sm text-sm px-6 py-2.5 h-auto cursor-pointer"
                                    >
                                        {file ? (
                                            <span className="flex items-center gap-2 text-primary font-semibold">
                                                <FileType size={16} />
                                                {file.name}
                                            </span>
                                        ) : "Select File from Computer"}
                                    </label>

                                    {file && (
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="btn btn-primary w-full max-w-xs shadow-lg shadow-primary/20"
                                        >
                                            {uploading ? (
                                                <span className="flex items-center gap-2">
                                                    <LoadingSpinner size="sm" className="border-white/20 border-t-white" />
                                                    Processing OCR...
                                                </span>
                                            ) : 'Submit Assignment'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Grading status */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 sticky top-6">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Wand2 size={20} className="text-purple-500" />
                            AI Prediction
                        </h3>

                        {!submission ? (
                            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">No submission yet</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs">Submit your assignment to get instant AI feedback.</p>
                            </div>
                        ) : submission.status === 'graded' || submission.aiAnalysis ? (
                            <div className="animate-fade-in-up">
                                {submission.grade && (
                                    <div className="text-center mb-6">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <p className="text-sm text-gray-500">Estimated Score</p>
                                            {submission.gradingMode === 'AI' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                    <Wand2 size={10} /> AI Graded
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    <User size={10} /> Faculty Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-br from-primary to-purple-600">
                                            {submission.grade}
                                            <span className="text-2xl text-gray-400 font-normal">
                                                /{(() => {
                                                    const questions = assignment.questions;
                                                    const defaultMax = assignment.maxPoints || 100;
                                                    if (questions && questions.length > 0) {
                                                        const sum = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
                                                        return sum > 0 ? sum : defaultMax;
                                                    }
                                                    return defaultMax;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {submission.feedback && (
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800">
                                            <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-2">Feedback</h4>
                                            <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">{submission.feedback}</p>
                                        </div>
                                    )}
                                    {submission.aiAnalysis && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">Analysis</h4>
                                            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{submission.aiAnalysis}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800 mb-6">
                                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">Ready to Analyze</h4>
                                    <p className="text-purple-800/80 dark:text-purple-200/80 text-xs">
                                        Your submission has been processed. Get instant feedback now?
                                    </p>
                                </div>
                                <button
                                    onClick={handleAIGrade}
                                    disabled={grading}
                                    className="w-full btn bg-linear-to-r from-purple-600 to-primary text-white hover:opacity-90 shadow-lg shadow-purple-500/20 border-none relative overflow-hidden group"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {grading ? (
                                            <>
                                                <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={18} />
                                                Get AI Feedback
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAssignmentSubmission;
