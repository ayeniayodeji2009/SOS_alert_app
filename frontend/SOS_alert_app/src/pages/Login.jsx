import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            alert("Invalid Login Credentials: " + err.message + '. Are you sure you have an account ?. If not, Register for one at the registration page !!!');
        }
    };

    return (
        <div className="container" style={{maxWidth: '400px', marginTop: '100px'}}>
            <form onSubmit={handleSubmit} className="alert-card">
                <h2 style={{color: 'var(--emergency-red)'}}>Lagos SOS Login</h2>
                <input 
                    type="text" 
                    placeholder="Username" 
                    className="history-table" // Reusing styles for clean look
                    onChange={(e) => setUsername(e.target.value)} 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    className="history-table"
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button type="submit" className="btn-resolve" style={{width: '100%', marginTop: '20px'}}>
                    ENTER SYSTEM
                </button>
            </form>
        </div>
    );
};

export default Login;