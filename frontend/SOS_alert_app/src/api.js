// import axios from 'axios';

// // Define backend URLs
// const BACKEND_URLS = {
//     RENDER: 'https://sos-alert-app-backend.onrender.com', // Replace with your actual Render URL
//     LOCAL: 'http://127.0.0.1:8000'
// };

// // Track the active backend URL
// let activeBackendUrl = null;
// let connectionAttempted = false;

// /**
//  * Check if a backend URL is reachable
//  */
// const checkBackendHealth = async (url) => {
//     try {
//         const response = await axios.get(`${url}/`, {
//             timeout: 3000, // 3 second timeout
//             validateStatus: (status) => status < 500 // Accept any status < 500
//         });
//         return response.status === 200 || response.status < 500;
//     } catch (error) {
//         return false;
//     }
// };

// /**
//  * Initialize the API with the first available backend
//  */
// const initializeApi = async () => {
//     if (connectionAttempted) {
//         return; // Already tried
//     }
    
//     connectionAttempted = true;
    
//     // Try Render first
//     const renderReachable = await checkBackendHealth(BACKEND_URLS.RENDER);
//     if (renderReachable) {
//         activeBackendUrl = BACKEND_URLS.RENDER;
//         console.log(`✅ Connected to Render backend: ${activeBackendUrl}`);
//         return;
//     }
    
//     // Try local backend
//     const localReachable = await checkBackendHealth(BACKEND_URLS.LOCAL);
//     if (localReachable) {
//         activeBackendUrl = BACKEND_URLS.LOCAL;
//         console.log(`✅ Connected to Local backend: ${activeBackendUrl}`);
//         return;
//     }
    
//     // No backend available
//     activeBackendUrl = null;
//     console.error('❌ No backend server available. Please check your connection.');
// };

// /**
//  * Create axios instance with dynamic baseURL
//  */
// const createApiInstance = () => {
//     const instance = axios.create({
//         baseURL: activeBackendUrl || BACKEND_URLS.LOCAL, // Fallback to LOCAL if not initialized
//         timeout: 10000,
//     });

//     // Request interceptor - attach JWT token
//     instance.interceptors.request.use(
//         (config) => {
//             const token = localStorage.getItem('token');
//             if (token) {
//                 config.headers.Authorization = `Bearer ${token}`;
//             }
//             return config;
//         },
//         (error) => {
//             return Promise.reject(error);
//         }
//     );

//     // Response interceptor - handle errors
//     instance.interceptors.response.use(
//         (response) => response,
//         (error) => {
//             // If backend is unreachable, try to reconnect
//             if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
//                 console.warn('⚠️ Backend connection lost. Attempting to reconnect...');
//                 // Reset connection state to try again
//                 connectionAttempted = false;
//                 activeBackendUrl = null;
//                 // Re-initialize on next request
//                 return Promise.reject({
//                     ...error,
//                     message: 'Backend server is unavailable. Please check your connection.'
//                 });
//             }
//             return Promise.reject(error);
//         }
//     );

//     return instance;
// };

// // Create a wrapper that initializes before making requests
// const createApiWrapper = () => {
//     const api = {
//         _instance: null,
//         _initializing: false,
//         _initialized: false,

//         // Get or create the axios instance
//         async getInstance() {
//             // If we don't have an active backend, initialize
//             if (!activeBackendUrl && !connectionAttempted) {
//                 await initializeApi();
//                 this._instance = createApiInstance();
//                 this._initialized = true;
//                 return this._instance;
//             }
            
//             // If we have an instance but no active URL, re-initialize
//             if (!activeBackendUrl && this._instance) {
//                 await initializeApi();
//                 this._instance = createApiInstance();
//                 this._initialized = true;
//                 return this._instance;
//             }
            
//             // Create instance if not exists
//             if (!this._instance) {
//                 this._instance = createApiInstance();
//                 this._initialized = true;
//             }
            
//             return this._instance;
//         },

//         // Make a GET request
//         async get(url, config = {}) {
//             const instance = await this.getInstance();
//             // Check if we have a valid backend before making request
//             if (!activeBackendUrl) {
//                 throw new Error('⚠️ No backend server available. Please check your connection.');
//             }
//             return instance.get(url, config);
//         },

//         // Make a POST request
//         async post(url, data = {}, config = {}) {
//             const instance = await this.getInstance();
//             if (!activeBackendUrl) {
//                 throw new Error('⚠️ No backend server available. Please check your connection.');
//             }
//             return instance.post(url, data, config);
//         },

//         // Make a PUT request
//         async put(url, data = {}, config = {}) {
//             const instance = await this.getInstance();
//             if (!activeBackendUrl) {
//                 throw new Error('⚠️ No backend server available. Please check your connection.');
//             }
//             return instance.put(url, data, config);
//         },

//         // Make a DELETE request
//         async delete(url, config = {}) {
//             const instance = await this.getInstance();
//             if (!activeBackendUrl) {
//                 throw new Error('⚠️ No backend server available. Please check your connection.');
//             }
//             return instance.delete(url, config);
//         },

//         // Get the current active backend URL
//         getActiveBackendUrl() {
//             return activeBackendUrl;
//         },

//         // Get the status of the backend connection
//         getBackendStatus() {
//             if (activeBackendUrl) {
//                 return {
//                     connected: true,
//                     url: activeBackendUrl,
//                     message: `✅ Connected to ${activeBackendUrl === BACKEND_URLS.RENDER ? 'Render' : 'Local'} backend`
//                 };
//             }
//             return {
//                 connected: false,
//                 url: null,
//                 message: '❌ No backend server available'
//             };
//         },

//         // Force re-initialization (useful for retry)
//         async reconnect() {
//             connectionAttempted = false;
//             activeBackendUrl = null;
//             this._instance = null;
//             this._initialized = false;
//             await initializeApi();
//             this._instance = createApiInstance();
//             this._initialized = true;
//             return this._instance;
//         }
//     };

//     return api;
// };

// // Create and export the API wrapper
// const api = createApiWrapper();

// // Optional: Initialize on import (if you want to check connection immediately)
// // You can call this in your App.js or index.js
// // api.getInstance().catch(console.error);

// export default api;

// // Export the backend URLs for debugging
// export { BACKEND_URLS };











































import axios from 'axios';

const api = axios.create({
    // Replace with your actual FastAPI backend URL
    baseURL: 'https://sos-alert-app-backend.onrender.com', 
});

http://127.0.0.1:8000
// Automatically attach the JWT token to every request if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;



