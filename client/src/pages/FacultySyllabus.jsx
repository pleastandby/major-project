import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FacultySyllabus = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
    const [message, setMessage] = useState('');
    const { token } = useAuth(); // Assuming auth context provides token

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setUploadStatus('error');
                setMessage('Only PDF files are allowed.');
                setFile(null);
                return;
            }
            // Check file size (e.g., 10MB limit matching backend)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setUploadStatus('error');
                setMessage('File size exceeds 10MB limit.');
                setFile(null);
                return;
            }

            setFile(selectedFile);
            setUploadStatus(null);
            setMessage('');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setUploadStatus(null);
        setMessage('');

        const formData = new FormData();
        formData.append('syllabus', file);

        try {
            // Note: In a real environment, you should use an environment variable for the API URL
            // and include the Authorization header with the token
            const response = await fetch('http://localhost:5000/api/faculty/syllabus', {
                method: 'POST',
                // headers: {
                //    'Authorization': `Bearer ${token}` 
                // },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setUploadStatus('success');
                setMessage('Syllabus uploaded successfully!');
                setFile(null); // Clear file after success
                // Reset file input in DOM if needed, currently controlled via state somewhat
                // but for file input, we might need a ref to clear the value strictly
            } else {
                setUploadStatus('error');
                setMessage(data.message || 'Upload failed');
            }
        } catch (error) {
            setUploadStatus('error');
            setMessage('Network error. Please try again.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Syllabus Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Upload and manage course syllabus for your students.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 bg-gray-50 dark:bg-gray-900/50 transition-colors hover:border-primary/50">

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-4">
                        <Upload className="text-primary w-8 h-8" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Syllabus PDF</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
                        Select a PDF file to upload. This will be accessible to students enrolled in your courses.
                    </p>

                    <form onSubmit={handleUpload} className="w-full max-w-md flex flex-col items-center gap-4">
                        <div className="relative w-full">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="syllabus-upload"
                            />
                            <label
                                htmlFor="syllabus-upload"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm"
                            >
                                <FileText size={18} />
                                {file ? file.name : 'Choose PDF File'}
                            </label>
                        </div>

                        {file && (
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload Syllabus'
                                )}
                            </button>
                        )}
                    </form>
                </div>

                {/* Status Messages */}
                {message && (
                    <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${uploadStatus === 'success'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {uploadStatus === 'success' ? (
                            <CheckCircle className="shrink-0 mt-0.5" size={20} />
                        ) : (
                            <AlertCircle className="shrink-0 mt-0.5" size={20} />
                        )}
                        <div>
                            <p className="font-medium">{uploadStatus === 'success' ? 'Success' : 'Error'}</p>
                            <p className="text-sm opacity-90">{message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultySyllabus;
