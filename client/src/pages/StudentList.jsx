import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Search, BookOpen, Trash2, GraduationCap, X, AlertTriangle } from 'lucide-react';
import { getCourseIcon } from '../utils/iconUtils';
import { Link } from 'react-router-dom';

const StudentList = () => {
    const { authFetch } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null); // For removal modal

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await authFetch('/api/courses/students/all');
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (courseId, studentId) => {
        if (!confirm('Are you sure you want to remove this student from the course? This cannot be undone.')) return;

        try {
            const res = await authFetch(`/api/courses/${courseId}/students/${studentId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Update local state
                setStudents(prev => prev.map(student => {
                    if (student._id === studentId) {
                        return {
                            ...student,
                            enrolledCourses: student.enrolledCourses.filter(c => c._id !== courseId)
                        };
                    }
                    return student;
                }).filter(s => s.enrolledCourses.length > 0)); // Remove student if no courses left? Maybe keep them but show empty. 
                // Actually filter removes them if they have 0 courses left, which makes sense for this view "Students in your courses"

                alert('Student removed from course');
            } else {
                alert('Failed to remove student');
            }
        } catch (error) {
            console.error(error);
            alert('Error removing student');
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Students</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage {students.length} student{students.length !== 1 ? 's' : ''} across your courses
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {filteredStudents.map(student => (
                        <div key={student._id} className="bg-white dark:bg-[#121214] rounded-xl border border-gray-100 dark:border-white/5 p-6 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                {/* Student Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{student.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5">
                                                <GraduationCap size={14} />
                                                Student
                                            </span>
                                            <span>•</span>
                                            <span>{student.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enrolled Courses */}
                                <div className="flex-1 w-full md:w-auto">
                                    <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                                        {student.enrolledCourses.map(course => (
                                            <div key={course._id} className="group relative flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors">
                                                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs" style={{ backgroundColor: `var(--color-${course.theme?.color || 'blue'}-500)` }}>
                                                    {(() => {
                                                        const Icon = getCourseIcon(course.theme?.icon);
                                                        return <Icon size={12} />;
                                                    })()}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{course.code}</span>

                                                {/* Remove Button (Hover) */}
                                                <button
                                                    onClick={() => handleRemoveStudent(course._id, student._id)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title={`Remove from ${course.title}`}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <User size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No students found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? "Try adjusting your search terms" : "You don't have any students enrolled in your courses yet."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default StudentList;
