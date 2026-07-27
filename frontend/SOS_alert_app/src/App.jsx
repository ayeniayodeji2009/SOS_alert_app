import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import RescuerDashboard from './pages/RescuerDashboard';
import './App.css';

// ✅ Simple Protected Route
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Navbar />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes - all require authentication */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <UserDashboard />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/police" element={
                        <ProtectedRoute>
                            <RescuerDashboard responderType="POLICE" />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/amotekun" element={
                        <ProtectedRoute>
                            <RescuerDashboard responderType="AMOTEKUN" />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;













































































































// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useContext } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext'; // ✅ Correct import
// import Navbar from './components/Navbar';
// import HomePage from './pages/HomePage';
// import Login from './pages/Login';
// import UserDashboard from './pages/UserDashboard';
// // import PoliceDashboard from './pages/PoliceDashboard';
// // import AmotekunDashboard from './pages/AmotekunDashboard';
// import Register from './pages/Register';
// import AdminDashboard from './pages/AdminDashboard';
// import RescuerDashboard from './pages/RescuerDashboard';
// import './App.css'

// // ✅ Fixed ProtectedRoute - use useAuth hook
// const ProtectedRoute = ({ children }) => {
//     const { user } = useAuth(); // ✅ Use useAuth hook instead of useContext(AuthProvider)
//     return user ? children : <Navigate to="/login" />;
// };

// // ✅ Admin-only Protected Route
// const AdminRoute = ({ children }) => {
//     const { user } = useAuth();
//     if (!user) return <Navigate to="/login" />;
//     if (user.role !== 'admin') return <Navigate to="/dashboard" />;
//     return children;
// };

// function App() {
//     return (
//         <Router>
//             <AuthProvider>
//                 <Navbar />
//                 <Routes>
//                     {/* Authentication */}
//                     <Route path="/" element={<HomePage />} />
//                     <Route path="/register" element={<Register />} />
//                     <Route path="/login" element={<Login />} />

//                     {/* Protected Routes */}
//                     <Route path="/dashboard" element={
//                         <ProtectedRoute>
//                             <UserDashboard />
//                         </ProtectedRoute>
//                     } />
                    
//                     <Route path="/admin" element={
//                         <AdminRoute>
//                             <AdminDashboard />
//                         </AdminRoute>
//                     } />
                    
//                     {/* Rescue Team Routes */}
//                     <Route path="/police" element={
//                         <ProtectedRoute>
//                             <RescuerDashboard responderType="POLICE" />
//                         </ProtectedRoute>
//                     } />
                    
//                     <Route path="/amotekun" element={
//                         <ProtectedRoute>
//                             <RescuerDashboard responderType="AMOTEKUN" />
//                         </ProtectedRoute>
//                     } />

//                     {/* Catch all - redirect to home */}
//                     <Route path="*" element={<Navigate to="/" />} />
//                 </Routes>
//             </AuthProvider>
//         </Router>
//     );
// }

// export default App;





























































// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import { AuthProvider, AuthContext } from './context/AuthContext';
// // import { AuthProvider } from './context/AuthProvider';
// import AuthContext, { AuthProvider } from '../context/AuthContext';
// import { useContext } from 'react';
// import Navbar from './components/Navbar';
// import HomePage from './pages/HomePage';
// import Login from './pages/Login';
// import UserDashboard from './pages/UserDashboard';
// // import PoliceDashboard from './pages/PoliceDashboard';
// // import AmotekunDashboard from './pages/AmotekunDashboard';
// import Register from './pages/Register';
// import AdminDashboard from './pages/AdminDashboard';
// import RescuerDashboard from './pages/RescuerDashboard';
// import './App.css'



// const ProtectedRoute = ({ children }) => {
//     const { user } = useContext(AuthProvider);
//     return user ? children : <Navigate to="/login" />;
// };

// function App() {
//     return (
//         <BrowserRouter>
//             <AuthProvider>
//                 {/* <Router> */}
//                     <Navbar /> {/* Place it here */}
//                     <Routes>
//                         {/* Authentication */}
//                         <Route path="/" element={<HomePage />} />
//                         <Route path="/register" element={<Register />} />
//                         <Route path="/login" element={<Login />} />


//                         <Route path="/dashboard" element={<UserDashboard />} />
//                         {/* <Route path="/police" element={<PoliceDashboard />} /> */}
//                         {/* <Route path="/amotekun" element={<AmotekunDashboard />} /> */}
//                         <Route path="/admin" element={<AdminDashboard />} />
//                         {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
//                         {/* <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} /> */}
//                         {/* <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute> /> */}
//                         {/* Rescue Team Routes */}
//                         <Route path="/police" element={<RescuerDashboard responderType="POLICE" />} />
//                         <Route path="/amotekun" element={<RescuerDashboard responderType="AMOTEKUN" />} 
//                         />

//                     </Routes>
//                 {/* </Router> */}
//             </AuthProvider>
//         </BrowserRouter>
//     );
// }

// export default App;

//style={{ height: '100vh' }}