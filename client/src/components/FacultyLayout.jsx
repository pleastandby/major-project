import { Outlet } from 'react-router-dom';
import FacultySidebar from './FacultySidebar';

const FacultyLayout = () => {
    return (
        <div className="flex min-h-screen bg-secondary">
            <FacultySidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <Outlet />
            </main>
        </div>
    );
};

export default FacultyLayout;
