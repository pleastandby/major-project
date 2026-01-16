import { Link } from 'react-router-dom';

const CourseCard = ({ course, isFaculty }) => {
    if (!course) return null; // Safety check

    return (
        <div className="card h-full flex flex-col gap-3 group hover:border-link/30 transition-colors">
            <h3 className="text-xl font-bold text-primary group-hover:text-link transition-colors">{course?.title}</h3>
            <div className="text-sm font-bold text-accent tracking-wide uppercase">
                {course?.code}
            </div>
            <p className="text-sm text-gray-600 flex-1 line-clamp-3">
                {course?.description || 'No description provided.'}
            </p>

            <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {course?.meta?.semester || 'General'}
                </span>
                <Link to={`/courses/${course._id}`} className="text-sm  font-medium text-blue-600 hover:underline flex items-center gap-1">
                    View Course <span>&rarr;</span>
                </Link>
            </div>
        </div>
    );
};

export default CourseCard;
