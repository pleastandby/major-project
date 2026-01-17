import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, Eye, BookOpen, Users } from 'lucide-react';

const FacultyCourses = () => {
    const { authFetch, user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await authFetch('/api/courses/my');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.created || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [authFetch]);

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
                    <p className="text-gray-500 text-sm mt-1">View and manage your courses</p>
                </div>
                <Link to="/courses/create" className="btn btn-primary text-sm px-4 py-2">
                    + Create Course
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {courses.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold">Course</th>
                                    <th className="px-6 py-4 font-semibold">Department</th>
                                    <th className="px-6 py-4 font-semibold">Semester</th>
                                    <th className="px-6 py-4 font-semibold">Instructors</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {courses.map(course => (
                                    <tr key={course._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-gray-900">{course.title}</div>
                                                <div className="text-xs text-gray-500 font-mono">{course.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {course.meta?.department || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {course.meta?.semester || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {course.instructors?.map(inst => (
                                                    <div key={inst._id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600" title={inst.name}>
                                                        {inst.name?.[0]}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/courses/${course._id}`} className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 transition-colors" title="View Details">
                                                    <Eye size={18} />
                                                </Link>
                                                {course.createdBy?._id === user._id && (
                                                    <Link to={`/courses/${course._id}/settings`} className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 transition-colors" title="Settings">
                                                        <Settings size={18} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
                        <p className="mb-6">You haven't created or been assigned to any courses yet.</p>
                        <Link to="/courses/create" className="btn btn-primary">
                            Create your first course
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyCourses;
