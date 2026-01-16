import { Link } from 'react-router-dom';

const DashboardCourseCard = ({ course, isFaculty }) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            {/* Dark Square Icon Placeholder */}
            <div className="w-20 h-20 bg-gray-700 rounded-lg shrink-0"></div>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate" title={course?.title}>
                    {course?.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {isFaculty ? `Code: ${course?.code}` : `Faculty : ${course?.createdBy?.name || 'Unknown'}`}
                </p>
                <Link
                    to={`/courses/${course._id}`}
                    className="mt-2 text-primary text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-full px-4 py-1 w-fit hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
                >
                    View
                </Link>
            </div>
        </div>
    );
};

export default DashboardCourseCard;
