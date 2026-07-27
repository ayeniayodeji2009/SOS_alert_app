import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // ✅ Validate inputs
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        try {
            console.log('🔑 Attempting login for user:', username);
            
            // ✅ Call login from AuthContext
            const result = await login(username.trim(), password.trim());
            
            console.log('✅ Login successful:', result);
            
            // ✅ Navigate to dashboard
            navigate('/dashboard');
            
        } catch (err) {
            console.error('❌ Login error:', err);
            
            // ✅ Handle specific error cases
            if (err.response) {
                const status = err.response.status;
                const detail = err.response.data?.detail || err.response.data?.message;
                
                if (status === 401) {
                    setError('Invalid username or password. Please try again.');
                } else if (status === 404) {
                    setError('User not found. Please check your username or register.');
                } else if (status === 422) {
                    setError('Validation error. Please check your input.');
                } else {
                    setError(`Server error: ${detail || 'Please try again later'}`);
                }
            } else if (err.request) {
                setError('Cannot connect to server. Please check your internet connection.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
            
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{maxWidth: '400px', marginTop: '100px'}}>
            <form onSubmit={handleSubmit} className="alert-card">
                <h2 style={{color: 'var(--emergency-red)'}}>Lagos SOS Login</h2>
                
                {/* ✅ Show error message */}
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}
                
                <input 
                    type="text" 
                    placeholder="Username" 
                    className="history-table"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)} 
                    disabled={loading}
                    required
                />
                
                <input 
                    type="password" 
                    placeholder="Password" 
                    className="history-table"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={loading}
                    required
                />
                
                <button 
                    type="submit" 
                    className="btn-resolve" 
                    style={{width: '100%', marginTop: '20px'}}
                    disabled={loading}
                >
                    {loading ? '🔄 Logging in...' : '🚨 ENTER SYSTEM'}
                </button>
                
                {/* ✅ Link to registration */}
                <div style={{marginTop: '15px', textAlign: 'center', fontSize: '14px'}}>
                    <span style={{color: '#666'}}>Don't have an account? </span>
                    <a 
                        href="/register" 
                        style={{color: 'var(--emergency-red)', fontWeight: 'bold', textDecoration: 'none'}}
                    >
                        Register here
                    </a>
                </div>
            </form>
        </div>
    );
};

export default Login;



































































// import React, { useState, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import '../App.css';

// const Login = () => {
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const { login } = useContext(AuthContext);
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             await login(username, password);
//             navigate('/dashboard');
//         } catch (err) {
//             alert("Invalid Login Credentials: " + err.message + '. Are you sure you have an account ?. If not, Register for one at the registration page !!!');
//         }
//     };

//     return (
//         <div className="container" style={{maxWidth: '400px', marginTop: '100px'}}>
//             <form onSubmit={handleSubmit} className="alert-card">
//                 <h2 style={{color: 'var(--emergency-red)'}}>Lagos SOS Login</h2>
//                 <input 
//                     type="text" 
//                     placeholder="Username" 
//                     className="history-table" // Reusing styles for clean look
//                     onChange={(e) => setUsername(e.target.value)} 
//                 />
//                 <input 
//                     type="password" 
//                     placeholder="Password" 
//                     className="history-table"
//                     onChange={(e) => setPassword(e.target.value)} 
//                 />
//                 <button type="submit" className="btn-resolve" style={{width: '100%', marginTop: '20px'}}>
//                     ENTER SYSTEM
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default Login;