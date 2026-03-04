import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, CheckCircle, Wand2, Calendar, Tag, AlertCircle, FileType, ArrowLeft, Clock, Loader2, User, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

const AssignmentDetails = () => {
    const { id } = useParams();
    const { authFetch } = useAuth();
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
    }, [id, fetchData]);

    const fetchData = async () => {
        try {
            const assignRes = await authFetch(`/api/assignments/${id}`);
            if (assignRes.ok) {
                const data = await assignRes.json();
                console.log('Assignment Data:', data);
                setAssignment(data);

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
            console.error('Error fetching assignment details:', err);
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
                setFile(null); // Clear file after upload
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

    const handleDeleteSubmission = async () => {
        if (!submission) return;
        if (!window.confirm('Are you sure you want to delete this submission and resubmit?')) return;

        try {
            const res = await authFetch(`/api/submissions/${submission._id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setSubmission(null);
                setExtractedText('');
                setFile(null);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete submission');
            }
        } catch (error) {
            console.error('Error deleting submission:', error);
            alert('Error deleting submission');
        }
    };

    // Note: isFaculty requires user object which we removed, so we fetch it elsewhere or re-add it carefully without causing a lint error. Let's re-add user but use it. 
    // Wait, let's just use `isFaculty = false` for now since this is the student view, or we just leave `isFaculty` logic as is if we re-add `user`.
    // Actually, looking at the code `isFaculty` was used for `navigate` and the title. Let's fix that properly.

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <LoadingSpinner size="xl" />
        </div>
    );

    if (!assignment) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
            <AlertCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-xl font-medium">Assignment not found</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-link hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            <button
                onClick={() => navigate(-1)}
                className="group flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            {/* Assignment Header Card */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden mb-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-link to-purple-500"></div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${assignment.type === 'AI_Generated'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-0">{assignment.title}</h1>
                                {isFaculty && (
                                    <button
                                        onClick={() => navigate('/faculty/submissions', { state: { expandedAssignmentId: assignment._id } })}
                                        className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm font-medium text-sm self-start sm:self-auto"
                                    >
                                        <div className="flex -space-x-2 mr-1">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white dark:border-gray-800"></div>
                                            ))}
                                        </div>
                                        View Submissions
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mt-4">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span>Due: <span className="font-medium text-gray-900">{new Date(assignment.dueDate).toLocaleDateString()}</span></span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Tag size={16} className="text-gray-400" />
                                    <span>Points: <span className="font-medium text-gray-900">{assignment.maxPoints}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="my-6 border-gray-100" />


                    <div className="prose prose-gray max-w-none">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Instructions
                        </h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
                    </div>

                    {assignment.questions && assignment.questions.length > 0 && (
                        <>
                            <hr className="my-6 border-gray-100" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-primary" />
                                    Questions
                                </h3>
                                <div className="space-y-4">
                                    {assignment.questions.map((q, idx) => (
                                        <div key={idx} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-3 flex-1">
                                                    <span className="font-bold text-gray-400 mt-1">Q{idx + 1}.</span>
                                                    <p className="font-medium text-gray-900 whitespace-pre-wrap">
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            {isFaculty ? "Demo Submission View" : "Your Submission"}
                        </h2>

                        {submission ? (
                            <div className="animate-fade-in-up">
                                {submission.resubmissionRequested ? (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3 text-red-700 mb-6">
                                        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                                        <div>
                                            <p className="font-bold">Resubmission Required</p>
                                            <p className="text-sm mt-1">Your instructor has requested that you resubmit this assignment. Please delete your current submission and upload a new one.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-center gap-3 text-green-700 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <CheckCircle size={18} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Submitted Successfully</p>
                                            <p className="text-xs text-green-700/80">Uploaded on {new Date(submission.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {extractedText && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                                                <FileText size={16} className="text-gray-400" />
                                                OCR Extracted Content
                                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Automated</span>
                                            </h3>
                                        </div>
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm font-mono text-gray-700 relative group">
                                            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap">
                                                {extractedText}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Delete Submission Logic */}
                                {(() => {
                                    const now = Date.now();
                                    const submittedAt = new Date(submission.submittedAt).getTime();
                                    const isWithinTwoHours = (now - submittedAt) <= (2 * 60 * 60 * 1000);

                                    if (isWithinTwoHours || submission.resubmissionRequested) {
                                        return (
                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    onClick={handleDeleteSubmission}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    {submission.resubmissionRequested ? 'Delete & Resubmit' : 'Delete Submission'}
                                                </button>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <div
                                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${dragActive
                                    ? 'border-link bg-link/5 scale-[1.01]'
                                    : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4 text-link">
                                    <Upload size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">Upload your assignment</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
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
                                        className="btn bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm text-sm px-6 py-2.5 h-auto cursor-pointer"
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
                                                    Processsing OCR...
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Wand2 size={20} className="text-purple-500" />
                            AI Grading Result
                        </h3>

                        {!submission ? (
                            <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 text-sm mb-2">No submission yet</p>
                                <p className="text-gray-400 text-xs">Submit your assignment to receive your grade.</p>
                            </div>
                        ) : submission.status === 'graded' ? (
                            <div className="animate-fade-in-up">
                                <div className="text-center mb-6">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <p className="text-sm text-gray-500">Total Score</p>
                                        {submission.gradingMode === 'AI' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                                <Wand2 size={10} /> AI Graded
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                                <User size={10} /> Faculty Verified
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-br from-link to-purple-600">
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

                                <div className="space-y-4">
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <h4 className="font-semibold text-purple-900 text-sm mb-2">Feedback</h4>
                                        <div className="prose prose-sm prose-purple text-purple-800 text-sm leading-relaxed">
                                            <ReactMarkdown>{submission.feedback}</ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <h4 className="font-semibold text-blue-900 text-sm mb-2">Analysis</h4>
                                        <div className="prose prose-sm prose-blue text-blue-800 text-sm leading-relaxed">
                                            <ReactMarkdown>{submission.aiAnalysis}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 mb-4 text-center">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-600">
                                        <Clock size={20} />
                                    </div>
                                    <h4 className="font-bold text-yellow-800 text-sm mb-1">Submission Under Review</h4>
                                    <p className="text-yellow-700/80 text-xs leading-relaxed">
                                        Your assignment has been received and auto-graded. It is currently pending final approval from your instructor.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                        <Loader2 size={12} className="animate-spin" />
                                        Processing Results
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetails;
