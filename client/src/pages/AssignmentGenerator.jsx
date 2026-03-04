import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGenerator } from '../context/GeneratorContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AssignmentGenerator = () => {
    const { authFetch } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Context State (Persisted)
    const {
        selectedCourse, setSelectedCourse,
        selectedSyllabus, setSelectedSyllabus,
        title, setTitle,
        description, setDescription,
        topics, setTopics,
        numQuestions, setNumQuestions,
        marksPerQuestion, setMarksPerQuestion,
        dueDate, setDueDate,
        generatedAssignment, setGeneratedAssignment,
        resetGenerator
    } = useGenerator();

    // Local State (Transient)
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [syllabi, setSyllabi] = useState([]);
    const [loadingSyllabi, setLoadingSyllabi] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    // Pre-select course from URL if provided and not already set
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const courseId = params.get('courseId');
        if (courseId && !selectedCourse) {
            setSelectedCourse(courseId);
        }
    }, [location, selectedCourse, setSelectedCourse]);

    // Fetch Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Syllabi
                const syllabiRes = await authFetch('/api/faculty/syllabus');
                if (syllabiRes.ok) {
                    setSyllabi(await syllabiRes.json());
                }

                // Fetch Courses
                const coursesRes = await authFetch('/api/courses');
                if (coursesRes.ok) {
                    setCourses(await coursesRes.json());
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoadingSyllabi(false);
                setLoadingCourses(false);
            }
        };
        fetchData();
    }, [authFetch]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedSyllabus) {
            setError('Please select a syllabus');
            return;
        }

        setGenerating(true);
        setError('');
        // Don't clear generatedAssignment here instantly if we want to show previous result while loading
        // But for clarity, maybe we should? Let's keep it to replace later.

        try {
            const res = await authFetch('/api/faculty/assignments/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    syllabusId: selectedSyllabus,
                    title,
                    description,
                    topics,
                    numQuestions: parseInt(numQuestions),
                    marksPerQuestion: parseInt(marksPerQuestion)
                })
            });

            const data = await res.json();

            if (res.ok) {
                setGeneratedAssignment(data);
            } else {
                setError(data.message || 'Generation failed');
            }
        } catch (err) {
            console.error(err);
            setError('Server error during generation');
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveAssignment = async () => {
        try {
            const res = await authFetch('/api/faculty/assignments/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...generatedAssignment,
                    courseId: selectedCourse,
                    syllabusId: selectedSyllabus,
                    topics,
                    numQuestions: parseInt(numQuestions),
                    marksPerQuestion: parseInt(marksPerQuestion),
                    answerKey: generatedAssignment.answerKey, // Include answer key
                    dueDate
                })
            });

            if (res.ok) {
                alert('Assignment saved successfully!');
                resetGenerator(); // Clear form after save
                // Redirect based on where we came from or default list
                if (selectedCourse) {
                    navigate(`/courses/${selectedCourse}`);
                } else {
                    navigate('/faculty/assignments');
                }
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to save assignment');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving assignment');
        }
    };

    const [regeneratingQuestion, setRegeneratingQuestion] = useState(null);

    const handleDiscard = () => {
        if (confirm('Are you sure you want to discard this generated assignment?')) {
            setGeneratedAssignment(null);
        }
    };

    const handleRegeneratePreview = async (index) => {
        setRegeneratingQuestion(index);
        try {
            const currentQuestion = generatedAssignment.questions[index];
            const res = await authFetch('/api/faculty/assignments/regenerate-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    syllabusId: selectedSyllabus,
                    topics, // Use context topics
                    marks: currentQuestion.marks,
                    currentQuestionText: currentQuestion.questionText
                })
            });

            if (res.ok) {
                const newQuestion = await res.json();
                const updated = { ...generatedAssignment };
                updated.questions[index] = newQuestion;
                setGeneratedAssignment(updated);
            } else {
                alert('Failed to regenerate question');
            }
        } catch (err) {
            console.error(err);
            alert('Error regenerating question');
        } finally {
            setRegeneratingQuestion(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Sparkles className="text-primary" />
                    AI Assignment Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Generate comprehensive assignments directly from your uploaded syllabus content using AI.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Form */}
                <div className="lg:col-span-1 card h-fit">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Configuration</h2>

                    <form onSubmit={handleGenerate} className="space-y-5">
                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select Course (Optional)
                            </label>
                            {loadingCourses ? (
                                <div className="animate-pulse h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                            ) : courses.length > 0 ? (
                                <select
                                    className="input-field w-full"
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                >
                                    <option value="">-- General / No Course --</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.title} ({c.code})</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-gray-500">No courses available.</p>
                            )}
                        </div>

                        {/* Syllabus Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select Syllabus
                            </label>
                            {loadingSyllabi ? (
                                <div className="animate-pulse h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                            ) : syllabi.length > 0 ? (
                                <select
                                    className="input-field w-full"
                                    value={selectedSyllabus}
                                    onChange={(e) => setSelectedSyllabus(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose a Syllabus --</option>
                                    {syllabi.map(s => (
                                        <option key={s._id} value={s._id}>{s.originalName}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-red-500">No syllabi uploaded. Please upload one first.</p>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assignment Title
                            </label>
                            <input
                                type="text"
                                className="input-field w-full"
                                placeholder="e.g. Midterm Exam"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                className="input-field w-full resize-none h-24"
                                placeholder="Brief instructions for students..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Topics */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Topics / Keywords (Optional)
                            </label>
                            <input
                                type="text"
                                className="input-field w-full"
                                placeholder="e.g. Thermodynamics, Chapter 1"
                                value={topics}
                                onChange={(e) => setTopics(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to generate from the entire syllabus.</p>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Due Date (Optional)
                            </label>
                            <input
                                type="date"
                                className="input-field w-full"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Num Questions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    No. of Questions
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="input-field w-full"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(e.target.value)}
                                />
                            </div>
                            {/* Marks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Marks / Q
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input-field w-full"
                                    value={marksPerQuestion}
                                    onChange={(e) => setMarksPerQuestion(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={generating || syllabi.length === 0}
                            className="btn btn-primary w-full mt-4"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate Assignment
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                {/* Preview / Results */}
                <div className="lg:col-span-2 space-y-6">
                    {generatedAssignment ? (
                        <div className="card">
                            <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{generatedAssignment.title}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">{generatedAssignment.description}</p>
                                </div>
                                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    Generated Successfully
                                </div>
                            </div>

                            <div className="space-y-6">
                                {generatedAssignment.questions.map((q, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-3 flex-1">
                                                <span className="font-bold text-gray-400 mt-1">Q{idx + 1}.</span>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{q.questionText}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="shrink-0 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                    {q.marks} Marks
                                                </span>
                                                <button
                                                    onClick={() => handleRegeneratePreview(idx)}
                                                    disabled={regeneratingQuestion === idx}
                                                    className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                                >
                                                    {regeneratingQuestion === idx ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <RefreshCw size={12} />
                                                    )}
                                                    Regenerate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {generatedAssignment.answerKey && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Answer Key (Faculty Only)</h3>
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl text-sm text-gray-800 dark:text-gray-200">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{generatedAssignment.answerKey}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    className="btn btn-outline"
                                    onClick={handleDiscard}
                                >
                                    Discard
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveAssignment}
                                >
                                    Save Assignment
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 h-full flex flex-col items-center justify-center text-center opacity-70">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-full mb-6">
                                <Sparkles className="text-purple-500 w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Generate</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                Content generated by AI will appear here for your review. You can generate questions from specific chapters or the entire syllabus.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AssignmentGenerator;
