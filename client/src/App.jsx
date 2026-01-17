import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import StudentRegister from './pages/StudentRegister';
import FacultyRegister from './pages/FacultyRegister';

import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateCourse from './pages/CreateCourse';
import JoinCourse from './pages/JoinCourse';
import CourseDetails from './pages/CourseDetails';
import CourseSettings from './pages/CourseSettings';
import CreateAssignment from './pages/CreateAssignment';
import AssignmentDetails from './pages/AssignmentDetails';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import FacultySyllabus from './pages/FacultySyllabus';
import AssignmentGenerator from './pages/AssignmentGenerator';
import AssignmentList from './pages/AssignmentList';
import AssignmentView from './pages/AssignmentView';
import FacultyCourses from './pages/FacultyCourses';
import CreateNotification from './pages/CreateNotification';
import NotificationList from './pages/NotificationList';

import StudentLayout from './components/StudentLayout';
import FacultyLayout from './components/FacultyLayout';

// Placeholders for now
const NotFound = () => <h1>404 Not Found</h1>;

// Layout with Top Navbar
const DefaultLayout = () => (
  <>
    <Navbar />
    <main className="container mx-auto px-4 py-8">
      <Outlet />
    </main>
  </>
);

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-secondary font-sans text-primary dark:bg-gray-900 dark:text-gray-100">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public/Default Layout Routes */}
              <Route element={<DefaultLayout />}>
                {/* Unified Login */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Register Pages */}
                <Route path="/student/register" element={<StudentRegister />} />
                <Route path="/faculty/register" element={<FacultyRegister />} />

                {/* Shared/Course Routes - For now keeping in Default Layout */}
                <Route path="/courses/create" element={<CreateCourse />} />
                <Route path="/courses/join" element={<JoinCourse />} />
                <Route path="/courses/:id" element={<CourseDetails />} />
                <Route path="/courses/:id/settings" element={<CourseSettings />} />
                <Route path="/courses/:id/assignments/create" element={<CreateAssignment />} />
                <Route path="/assignments/:id" element={<AssignmentDetails />} />

                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Faculty Layout Routes (Sidebar) */}
              <Route element={<FacultyLayout />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/courses" element={<FacultyCourses />} />
                <Route path="/faculty/assignments" element={<AssignmentList />} />
                <Route path="/faculty/assignments/:id" element={<AssignmentView />} />
                <Route path="/faculty/notifications" element={<NotificationList />} />
                <Route path="/faculty/notifications/create" element={<CreateNotification />} />
                <Route path="/faculty/syllabus" element={<FacultySyllabus />} />
                <Route path="/faculty/profile" element={<div className="p-4"><h1>Profile</h1><p>Coming Soon</p></div>} />
                <Route path="/faculty/assignments/generate" element={<AssignmentGenerator />} />
              </Route>

              {/* Student Layout Routes (Sidebar) */}
              <Route element={<StudentLayout />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/assignments" element={<div className="p-4"><h1>Assignments</h1><p>Coming Soon</p></div>} />
                <Route path="/student/courses" element={<div className="p-4"><h1>My Courses</h1><p>Coming Soon</p></div>} />
                <Route path="/student/notifications" element={<div className="p-4"><h1>Notifications</h1><p>Coming Soon</p></div>} />
                <Route path="/student/results" element={<div className="p-4"><h1>Results</h1><p>Coming Soon</p></div>} />
                <Route path="/student/profile" element={<div className="p-4"><h1>Profile</h1><p>Coming Soon</p></div>} />
              </Route>

              {/* Redirect old routes */}
              <Route path="/student/login" element={<Navigate to="/login" replace />} />
              <Route path="/faculty/login" element={<Navigate to="/login" replace />} />

            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
