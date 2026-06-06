import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext'; // Import the constant
import api from '../api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!localStorage.getItem('token'));

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const res = await api.post('/users/login', formData);
        localStorage.setItem('token', res.data.access_token);
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/users/me')
                .then(res => setUser(res.data))
                .catch(() => logout())
                .finally(() => setLoading(false));
        } else {
            setTimeout(() => setLoading(false), 0);
        }
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};











































// import React, { useState, useEffect, useCallback } from 'react';
// import { AuthContext } from './AuthContext'; // Import from the other file
// import api from '../api';

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(!!localStorage.getItem('token'));

//     const logout = useCallback(() => {
//         localStorage.removeItem('token');
//         setUser(null);
//     }, []);

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
//             setTimeout(() => setLoading(false), 0);
//         }
//     }, [logout]);

//     return (
//         <AuthContext.Provider value={{ user, login, logout, loading }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };