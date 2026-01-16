import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Sparkles, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const AssignmentGenerator = () => {
    const { authFetch } = useAuth();

    // State
    const [syllabi, setSyllabi] = useState([]);
    const [loadingSyllabi, setLoadingSyllabi] = useState(true);

    // Form Inputs
    const [selectedSyllabus, setSelectedSyllabus] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topics, setTopics] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [marksPerQuestion, setMarksPerQuestion] = useState(10);

    const [generating, setGenerating] = useState(false);
    const [generatedAssignment, setGeneratedAssignment] = useState(null);
    const [error, setError] = useState('');

    // Fetch Syllabi on Mount
    useEffect(() => {
        const fetchSyllabi = async () => {
            try {
                const res = await authFetch('/api/faculty/syllabus');
                if (res.ok) {
                    const data = await res.json();
                    setSyllabi(data);
                }
            } catch (err) {
                console.error("Failed to fetch syllabi", err);
            } finally {
                setLoadingSyllabi(false);
            }
        };
        fetchSyllabi();
    }, [authFetch]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedSyllabus) {
            setError('Please select a syllabus');
            return;
        }

        setGenerating(true);
        setError('');
        setGeneratedAssignment(null);

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
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-fit">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Configuration</h2>

                    <form onSubmit={handleGenerate} className="space-y-5">
                        {/* Syllabus Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select Syllabus
                            </label>
                            {loadingSyllabi ? (
                                <div className="animate-pulse h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                            ) : syllabi.length > 0 ? (
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
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
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
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
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none h-24"
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
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                placeholder="e.g. Thermodynamics, Chapter 1"
                                value={topics}
                                onChange={(e) => setTopics(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to generate from the entire syllabus.</p>
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
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
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
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    value={marksPerQuestion}
                                    onChange={(e) => setMarksPerQuestion(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={generating || syllabi.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed font-medium mt-4"
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
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
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
                                            <div className="flex gap-3">
                                                <span className="font-bold text-gray-400">Q{idx + 1}.</span>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{q.questionText}</p>
                                            </div>
                                            <span className="shrink-0 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                {q.marks} Marks
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => setGeneratedAssignment(null)}
                                >
                                    Discard
                                </button>
                                <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm">
                                    Save as Draft
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
        </div>
    );
};

export default AssignmentGenerator;
