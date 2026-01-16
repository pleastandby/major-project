import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/elevare-logo.svg';

const Navbar = () => {
    const location = useLocation();
    const isFaculty = location.pathname.includes('faculty');

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-primary/10 dark:border-gray-800 py-4 transition-colors">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-primary dark:text-white text-xl font-bold no-underline group">
                    <img src={logo} alt="Elevare Logo" className="h-8 w-auto" />
                    <span>Elevare</span>
                </Link>

                <div className="flex gap-4">
                    {/* Buttons removed as per user request */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
