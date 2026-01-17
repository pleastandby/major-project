import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCourseIcon, getIconNames } from '../utils/iconUtils';

const CreateCourse = () => {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        department: '',
        semester: '',
        themeColor: 'blue',
        themeIcon: 'book',
        logoFile: null
    });
    const [logoPreview, setLogoPreview] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'logoFile' && formData[key]) {
                    data.append('logo', formData[key]);
                } else if (key !== 'logoFile') {
                    data.append(key, formData[key]);
                }
            });

            const res = await authFetch('/api/courses', {
                method: 'POST',
                // Content-Type header is handled automatically by browser for FormData
                body: data
            });

            if (res.ok) {
                navigate('/faculty/dashboard');
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create course');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#121214] p-8 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
            <h1 className="text-2xl font-bold text-primary dark:text-gray-100 mb-6">Create New Course</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-error dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900/20 flex items-center gap-2">
                    <span>•</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary dark:text-gray-300">Course Title</label>
                        <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:text-gray-100 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Introduction to CS" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary dark:text-gray-300">Course Code</label>
                        <input name="code" value={formData.code} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:text-gray-100 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="CS101" />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-primary dark:text-gray-300">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:text-gray-100 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all" placeholder="Course overview..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary dark:text-gray-300">Department</label>
                        <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] dark:text-gray-100 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all">
                            <option value="">Select Department</option>
                            <option value="Civil Engineering">Civil Engineering</option>
                            <option value="Computer Engineering">Computer Engineering</option>
                            <option value="Electronics Engineering">Electronics Engineering</option>
                            <option value="Electrical and Electronics">Electrical and Electronics</option>
                            <option value="Automobile Engineering">Automobile Engineering</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-primary dark:text-gray-300">Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] dark:text-gray-100 focus:border-link focus:ring-4 focus:ring-link/10 outline-none transition-all">
                            <option value="">Select Semester</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                        </select>
                    </div>
                </div>

                {/* Theme Customization */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Course Branding</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            {/* Color Picker */}
                            <div className="space-y-3 mb-6">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {['blue', 'purple', 'emerald', 'amber', 'rose', 'indigo', 'cyan', 'orange'].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, themeColor: color })}
                                            className={`w-8 h-8 rounded-full transition-all ${formData.themeColor === color
                                                ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                                : 'hover:scale-105 opacity-70 hover:opacity-100'
                                                }`}
                                            style={{ backgroundColor: `var(--color-${color}-900)` }}
                                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                                        >
                                            <div className={`w-full h-full rounded-full bg-${color}-900`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icon/Logo Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Icon Style</label>
                                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg w-fit">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, themeIcon: 'book', logoFile: null }); // Default to book
                                            setLogoPreview(null);
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${!formData.logoFile && formData.themeIcon !== 'image'
                                            ? 'bg-white dark:bg-white/10 text-primary dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Choose Icon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, themeIcon: 'image' })}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${formData.themeIcon === 'image'
                                            ? 'bg-white dark:bg-white/10 text-primary dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Upload Logo
                                    </button>
                                </div>

                                {formData.themeIcon === 'image' ? (
                                    <div className="mt-4">
                                        <label className="block w-full border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 dark:bg-white/5">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData({ ...formData, logoFile: file });
                                                        setLogoPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="text-primary font-medium">Click to upload</span> custom logo
                                                <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <div className="flex flex-wrap gap-3">
                                            {getIconNames().map(iconName => {
                                                const Icon = getCourseIcon(iconName);
                                                return (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, themeIcon: iconName })}
                                                        className={`p-2 rounded-lg border transition-all flex items-center justify-center ${formData.themeIcon === iconName
                                                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                                                            : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300'
                                                            }`}
                                                        title={iconName.charAt(0).toUpperCase() + iconName.slice(1)}
                                                    >
                                                        <Icon size={20} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="mt-2 text-center md:text-left">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider font-semibold">Live Preview</p>
                            <div className="max-w-sm mx-auto md:mx-0 bg-white dark:bg-[#121214] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden transform transition-all hover:scale-[1.02]">
                                <div className={`h-32 bg-${formData.themeColor || 'blue'}-900 relative transition-colors`}>
                                    <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center p-1 overflow-hidden">
                                        {formData.themeIcon === 'image' && logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className={`w-full h-full rounded-xl flex items-center justify-center text-white font-bold text-2xl`} style={{ backgroundColor: `var(--color-${formData.themeColor}-900)` }}>
                                                {(() => {
                                                    const Icon = getCourseIcon(formData.themeIcon);
                                                    return <Icon size={32} />;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-10 px-6 pb-6 text-left">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">{formData.title || 'Course Title'}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formData.code || 'CODE101'} • {formData.department || 'Department'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 transition-all shadow-lg shadow-primary/20">
                        {isLoading ? 'Creating...' : 'Create Course'}
                    </button>
                    <button type="button" onClick={() => navigate('/faculty/dashboard')} className="px-6 py-3 border border-gray-200 dark:border-white/30 text-primary dark:text-white rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCourse;
