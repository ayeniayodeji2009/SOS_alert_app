// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✅ Check localStorage on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(userData);
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post(
                'https://sos-alert-app-backend.onrender.com/users/login',
                { username, password }
            );
            
            const { token, user } = response.data;
            
            // ✅ Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // ✅ Set axios headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // ✅ Update state
            setToken(token);
            setUser(user);
            
            return { token, user };
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        }
    };

    const logout = () => {
        // ✅ Clear all
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

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

