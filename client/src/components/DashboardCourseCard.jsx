import { Link } from 'react-router-dom';
import { getCourseIcon } from '../utils/iconUtils';

const DashboardCourseCard = ({ course, isFaculty }) => {
    return (
        <div className="bg-white dark:bg-[#09090b] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4 hover:shadow-md transition-all duration-300 group">
            {/* Course Icon */}
            <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden relative`} style={{ backgroundColor: !course.theme?.logo ? `var(--color-${course.theme?.color || 'blue'}-900)` : 'transparent', background: !course.theme?.logo && course.theme?.color ? `var(--color-${course.theme.color}-900)` : undefined }}>
                {course.theme?.logo ? (
                    <img
                        src={`http://localhost:5000/${course.theme.logo}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.style.backgroundColor = `var(--color-${course.theme?.color || 'blue'}-900)`;
                            e.target.parentNode.innerHTML = `<span class="text-2xl font-mono capitalize">${(course.code || 'C').charAt(0).toUpperCase()}</span>`;
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {(() => {
                            const Icon = getCourseIcon(course.theme?.icon);
                            return <Icon size={32} />;
                        })()}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate" title={course?.title}>
                    {course?.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    <span className="block">Code: {course?.code}</span>
                    <span className="block">Instructor: {course?.createdBy?.name || 'Unknown'}</span>
                </p>
                <Link
                    to={isFaculty ? `/courses/${course._id}` : `/student/courses/${course._id}`}
                    className="mt-2 btn btn-outline btn-sm text-xs rounded-full w-fit px-4"
                >
                    View Course
                </Link>
            </div>
        </div>
    );
};

export default DashboardCourseCard;
