// context/AuthContext.js
import React, { useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';

// ✅ Create and export the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(userData);
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                console.log('✅ Restored user session:', userData);
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);






    // context/AuthContext.js - Fixed login function

const login = async (username, password) => {
    try {
        console.log('🔐 AuthContext: Logging in user:', username);
        
        // ✅ Create form data (OAuth2 format)
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        // ✅ Send as form data, NOT JSON
        const response = await axios.post(
            'https://sos-alert-app-backend.onrender.com/users/login',
            formData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('✅ Login response:', response.data);
        
        // ✅ Your backend returns: {"access_token": token, "token_type": "bearer"}
        // Note: The response doesn't include user data directly
        const { access_token } = response.data;
        
        if (!access_token) {
            throw new Error('No token received from server');
        }
        
        // ✅ Store token
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // ✅ Fetch user data after successful login
        const userResponse = await axios.get(
            'https://sos-alert-app-backend.onrender.com/users/me',
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );
        
        const user = userResponse.data;
        localStorage.setItem('user', JSON.stringify(user));
        
        if (user.role) {
            localStorage.setItem('userRole', user.role);
        }
        
        setToken(access_token);
        setUser(user);
        
        console.log('✅ Login successful:', { id: user.id, username: user.username });
        
        return { token: access_token, user };
        
    } catch (err) {
        console.error('❌ Login error:', err);
        
        // ✅ Detailed error logging
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
            
            // ✅ Handle 400 specifically for incorrect credentials
            if (err.response.status === 400) {
                throw new Error('Incorrect username or password');
            }
            
            const errorMsg = err.response.data?.detail || err.response.data?.message || 'Login failed';
            throw new Error(errorMsg);
        } else {
            throw new Error('Network error. Please check your connection.');
        }
    }
};

    // const login = async (username, password) => {
    //     try {
    //         console.log('🔐 AuthContext: Logging in user:', username);
            
    //         const response = await axios.post(
    //             'https://sos-alert-app-backend.onrender.com/users/login',
    //             { username, password }
    //         );
            
    //         console.log('✅ AuthContext: Login response:', response.data);
            
    //         const { token, user } = response.data;
            
    //         if (!token) {
    //             throw new Error('No token received from server');
    //         }
            
    //         if (!user || !user.id) {
    //             console.error('Invalid user data:', user);
    //             throw new Error('Invalid user data received from server');
    //         }
            
    //         localStorage.setItem('token', token);
    //         localStorage.setItem('user', JSON.stringify(user));
            
    //         if (user.role) {
    //             localStorage.setItem('userRole', user.role);
    //         }
            
    //         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
    //         setToken(token);
    //         setUser(user);
            
    //         console.log('✅ AuthContext: User stored successfully:', {
    //             id: user.id,
    //             username: user.username,
    //             role: user.role || 'user'
    //         });
            
    //         return { token, user };
            
    //     } catch (err) {
    //         console.error('❌ AuthContext: Login error:', err);
            
    //         localStorage.removeItem('token');
    //         localStorage.removeItem('user');
    //         setToken(null);
    //         setUser(null);
            
    //         throw err;
    //     }
    // };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        console.log('🔓 User logged out');
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user
    };

    // ✅ Use React.createElement to avoid build issues
    return React.createElement(
        AuthContext.Provider,
        { value: value },
        children
    );
};

// ✅ Export the useAuth hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// ✅ Default export (optional)
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

