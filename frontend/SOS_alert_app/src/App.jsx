import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import { useContext } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
// import PoliceDashboard from './pages/PoliceDashboard';
// import AmotekunDashboard from './pages/AmotekunDashboard';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import RescuerDashboard from './pages/RescuerDashboard';
import './App.css'



const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthProvider);
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar /> {/* Place it here */}
                <Routes>
                    {/* Authentication */}
                    <Route path="/" element={<UserDashboard />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />


                    <Route path="/dashboard" element={<UserDashboard />} />
                    {/* <Route path="/police" element={<PoliceDashboard />} /> */}
                    {/* <Route path="/amotekun" element={<AmotekunDashboard />} /> */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
                    {/* <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} /> */}
                    {/* <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute> /> */}
                    {/* Rescue Team Routes */}
                    <Route path="/police" element={<RescuerDashboard responderType="POLICE" />} />
                    <Route path="/amotekun" element={<RescuerDashboard responderType="AMOTEKUN" />} 
                    />

                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

//style={{ height: '100vh' }}