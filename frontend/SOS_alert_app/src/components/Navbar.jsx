import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../App.css';

const Navbar = () => {  
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">Lagos <span>SOS</span></Link>
            </div>
            
            <div className="nav-links">
                {user ? (
                    <>
                        <Link to="/dashboard">My SOS</Link>
                        {/* Only show Police link if user has admin/police role */}
                        {user.is_admin && <Link to="/police">Police Portal</Link>}
                        
                        <div className="user-profile">
                            <span>Welcome, <strong>{user.username}</strong></span>
                            <button onClick={handleLogout} className="btn-logout">
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="btn-login">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;