// context/AuthContext.jsx
import React from 'react';
import axios from 'axios';

// Create the context
const AuthContext = React.createContext();

// Provider component
export class AuthProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            token: null,
            loading: true
        };
    }

    componentDidMount() {
        // Check localStorage on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                this.setState({
                    token: storedToken,
                    user: userData,
                    loading: false
                });
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                console.log('✅ Restored user session:', userData);
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.setState({ loading: false });
            }
        } else {
            this.setState({ loading: false });
        }
    }

    login = async (username, password) => {
        try {
            console.log('🔐 AuthContext: Logging in user:', username);
            
            const response = await axios.post(
                'https://sos-alert-app-backend.onrender.com/users/login',
                { username, password }
            );
            
            console.log('✅ AuthContext: Login response:', response.data);
            
            const { token, user } = response.data;
            
            if (!token) {
                throw new Error('No token received from server');
            }
            
            if (!user || !user.id) {
                console.error('Invalid user data:', user);
                throw new Error('Invalid user data received from server');
            }
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            if (user.role) {
                localStorage.setItem('userRole', user.role);
            }
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            this.setState({
                token: token,
                user: user
            });
            
            console.log('✅ AuthContext: User stored successfully:', {
                id: user.id,
                username: user.username,
                role: user.role || 'user'
            });
            
            return { token, user };
            
        } catch (err) {
            console.error('❌ AuthContext: Login error:', err);
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.setState({
                token: null,
                user: null
            });
            
            throw err;
        }
    };

    logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        delete axios.defaults.headers.common['Authorization'];
        this.setState({
            token: null,
            user: null
        });
        console.log('🔓 User logged out');
    };

    render() {
        const value = {
            user: this.state.user,
            token: this.state.token,
            loading: this.state.loading,
            login: this.login,
            logout: this.logout,
            isAuthenticated: !!this.state.token && !!this.state.user
        };

        return React.createElement(
            AuthContext.Provider,
            { value: value },
            this.props.children
        );
    }
}

// Custom hook for using auth
export function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Default export
export default AuthContext;


























//import React, { createContext } from 'react';
//import React, { createContext, useState, useEffect } from 'react';

// import api from '../api';

//export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     // Instead of starting as true, check if a token even exists
//     const [loading, setLoading] = useState(!!localStorage.getItem('token'));

//     // 1. Move logout up here so useEffect can see it
//     const logout = () => {
//         localStorage.removeItem('token');
//         setUser(null);
//     };

//     // 2. Move login up here for consistency
//     const login = async (username, password) => {
//         const formData = new FormData();
//         formData.append('username', username);
//         formData.append('password', password);
//         const res = await api.post('/users/login', formData);
//         localStorage.setItem('token', res.data.access_token);
//         const userRes = await api.get('/users/me');
//         setUser(userRes.data);
//     };

//     // 3. Now useEffect can safely call logout()
//     // useEffect(() => {
//     //     const token = localStorage.getItem('token');
//     //     if (token) {
//     //         api.get('/users/me')
//     //             .then(res => setUser(res.data))
//     //             .catch(() => logout()); // logout is now defined above!
//     //     }
//     //     setLoading(false);
//     // }, []);
//     useEffect(() => {
//         const token = localStorage.getItem('token');
        
//         if (token) {
//             api.get('/users/me')
//                 .then(res => {
//                     setUser(res.data);
//                 })
//                 .catch(() => {
//                     logout();
//                 })
//                 .finally(() => {
//                     setLoading(false);
//                 });
//         } else {
//             // Wrapping this in a zero-delay timeout moves the state 
//             // update out of the synchronous execution body of the effect.
//             setTimeout(() => {
//                 setLoading(false);
//             }, 0);
//         }
//     }, []);

//     return (
//         <AuthContext.Provider value={{ user, login, logout, loading }}>
//             {!loading && children}
//         </AuthContext.Provider>
//     );
// };






















// import React, { createContext, useState, useEffect } from 'react';
// import api from '../api';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(!!localStorage.getItem('token'));

//     const logout = () => {
//         localStorage.removeItem('token');
//         setUser(null);
//     };

//     const login = async (username, password) => {
//         const formData = new FormData();
//         formData.append('username', username);
//         formData.append('password', password);
        
//         const res = await api.post('/users/login', formData);
//         localStorage.setItem('token', res.data.access_token);
        
//         const userRes = await api.get('/users/me');
//         setUser(userRes.data);
//     };

//     useEffect(() => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             api.get('/users/me')
//                 .then(res => setUser(res.data))
//                 .catch(() => logout())
//                 .finally(() => setLoading(false));
//         } else {
//             // Using a safe timeout to avoid the "cascading render" linter error
//             setTimeout(() => setLoading(false), 0);
//         }
//     }, []);

//     return (
//         <AuthContext.Provider value={{ user, login, logout, loading }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

