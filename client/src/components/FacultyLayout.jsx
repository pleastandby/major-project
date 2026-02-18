import { Outlet } from 'react-router-dom';
import FacultySidebar from './FacultySidebar';

const FacultyLayout = () => {
    return (
        <div className="flex min-h-screen bg-secondary dark:bg-[#09090b] transition-colors duration-300 text-gray-900 dark:text-gray-100">
            <FacultySidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <Outlet />
            </main>
        </div>
    );
};

export default FacultyLayout;
