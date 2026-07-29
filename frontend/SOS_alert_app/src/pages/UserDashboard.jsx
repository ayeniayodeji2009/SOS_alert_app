import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, CheckCircle, MapPin, Phone, Navigation } from 'lucide-react';
import '../App.css';

const UserDashboard = () => {
    // ✅ Get user from localStorage
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const [nearestStation, setNearestStation] = useState(null);
    const [loadingActions, setLoadingActions] = useState({});
    const navigate = useNavigate();

   

     // ✅ Load user data from localStorage - FIXED
    useEffect(() => {
        try {
            console.log("🔍 Checking localStorage...");
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            console.log("Token exists:", !!token);
            console.log("Stored user:", storedUser);
            
            if (!token || !storedUser) {
                console.error('❌ No token or user data found');
                navigate('/login');
                return;
            }
            
            const userData = JSON.parse(storedUser);
            console.log("✅ Parsed user data:", userData);
            
            // ✅ Get user ID - try multiple possible field names
            const id = userData.id || userData.user_id || userData.userId;
            console.log("✅ User ID found:", id);
            
            if (!id) {
                console.error('❌ No user ID found in user data:', userData);
                setError('Invalid user data. Please login again.');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }
            
            setUser(userData);
            setUserId(id);
            
            // ✅ Set axios default header
            // const token = localStorage.getItem('token');
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // ✅ Fetch alerts immediately after user is set
            fetchMyAlerts(id);
            
        } catch (err) {
            console.error('❌ Error loading user data:', err);
            setError('Failed to load user data. Please login again.');
            setTimeout(() => navigate('/login'), 3000);
        }
    }, []);



    // ✅ Fetch nearest police station
    const fetchNearestStation = useCallback(async (lat, lon) => {
        try {
            const response = await axios.get(
                `https://sos-alert-app-backend.onrender.com/police-posts/nearby?lat=${lat}&lon=${lon}&radius=10000`
            );
            if (response.data && response.data.length > 0) {
                setNearestStation(response.data[0]);
            }
        } catch (err) {
            console.error('Error fetching nearest station:', err);
        }
    }, []);




    // ✅ Fetch user's alerts
    // const fetchMyAlerts = useCallback(async () => {
    //     if (!userId) return;
        
    //     try {
    //         console.log("Fetching alerts for user ID:", userId);
    //         const res = await axios.get(
    //             `https://sos-alert-app-backend.onrender.com/alerts/history/${userId}`
    //         );
    //         console.log("Fetched alerts:", res.data);
            
    //         const activeAlerts = res.data.filter(a => !a.is_deleted_by_user);
    //         setAlerts(activeAlerts);
    //     } catch (err) {
    //         console.error("Error fetching alerts:", err);
    //         if (err.response?.status === 404) {
    //             console.log("No alerts found for this user");
    //             setAlerts([]);
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // }, [userId]);
    // UserDashboard.jsx - Add token to request
    const fetchMyAlerts = useCallback(async (userIdParam) => {
        const userIdToUse = userIdParam || userId;
        
        if (!userIdToUse) {
            console.log("⚠️ No userId available, skipping fetch");
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            console.log(`📡 Fetching alerts for user ID: ${userIdToUse}`);
            const token = localStorage.getItem('token');
            
            const res = await axios.get(
                `https://sos-alert-app-backend.onrender.com/alerts/history/${userIdToUse}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`  // ✅ Add this
                    }
                }
            );
            console.log("✅ Fetched alerts:", res.data);
            
            const activeAlerts = res.data.filter(a => !a.is_deleted_by_user);
            setAlerts(activeAlerts);
            setError(null);
        } catch (err) {
            console.error("❌ Error fetching alerts:", err);
            // ... error handling
        }
    }, [userId]);

    


    // Add to UserDashboard.jsx - right after fetching
    console.log("📊 UserDashboard - Alerts state:", alerts);
    console.log("📊 UserDashboard - User ID:", userId);

     // ✅ Trigger SOS - FIXED to show alert immediately
    const triggerSOS = async () => {
        if (!userId) {
            alert("User not authenticated. Please login again.");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const payload = { 
                user_id: userId,
                username: user?.username || "Unknown User", 
                lat: pos.coords.latitude, 
                lon: pos.coords.longitude 
            };
            try {
                const token = localStorage.getItem('token');
                const res = await axios.post(
                    'https://sos-alert-app-backend.onrender.com/alerts/trigger',
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                alert(`🚨 SOS SENT! Nearest Station: ${res.data.nearest_station}`);
                
                // ✅ Refresh alerts immediately
                await fetchMyAlerts();
                
            } catch (err) {
                alert("Error sending SOS: " + (err.response?.data?.detail || err.message));
                console.error("SOS Error:", err);
            }
        }, (err) => {
            alert("Please enable location services to send SOS");
            console.error("Geolocation error:", err);
        });
    };


    // ✅ Confirm Arrival
    // const confirmArrival = async (alertId) => {
    //     setLoadingActions(prev => ({ ...prev, [alertId]: true }));
        
    //     try {
    //         console.log("Confirming arrival for alert:", alertId);
            
    //         const response = await axios.patch(
    //             `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/confirm-arrival`,
    //             {},
    //             { headers: { 'Content-Type': 'application/json' } }
    //         );
            
    //         console.log("Arrival confirmed:", response.data);
            
    //         // ✅ Update state immediately (optimistic)
    //         setAlerts(prev => 
    //             prev.map(a => 
    //                 a.id === alertId 
    //                     ? { ...a, user_confirmed_arrival: true }
    //                     : a
    //             )
    //         );
            
    //         // ✅ Also refresh from server
    //         await fetchMyAlerts();
            
    //         alert("✅ Arrival confirmed! Rescuer will be notified.");
            
    //     } catch (err) {
    //         console.error("Error confirming arrival:", err);
    //         if (err.response?.status === 404) {
    //             alert("Alert not found");
    //         } else if (err.response?.status === 422) {
    //             alert("Validation error. Please check if the alert exists.");
    //         } else {
    //             alert(`Error: ${err.response?.data?.detail || "Something went wrong"}`);
    //         }
    //     } finally {
    //         setLoadingActions(prev => ({ ...prev, [alertId]: false }));
    //     }
    // };

    // // ✅ WebSocket Connection
    // useEffect(() => {
    //     let ws = null;
    //     let reconnectTimer = null;
    //     let isMounted = true;
        
    //     const connectWebSocket = () => {
    //         if (!isMounted) return;
            
    //         try {
    //             if (ws && ws.readyState === WebSocket.OPEN) {
    //                 ws.close();
    //             }
                
    //             ws = new WebSocket('wss://sos-alert-app-backend.onrender.com/ws/alerts');

    //             ws.onopen = () => {
    //                 if (isMounted) {
    //                     console.log("🔌 UserDashboard WebSocket Connected");
    //                     setWsConnected(true);
                        
    //                     // ✅ Authenticate
    //                     const token = localStorage.getItem('token');
    //                     if (token && userId) {
    //                         ws.send(JSON.stringify({
    //                             type: 'auth',
    //                             token: token,
    //                             user_id: userId
    //                         }));
    //                     }
    //                 }
    //                 if (reconnectTimer) clearTimeout(reconnectTimer);
    //             };
                
    //             ws.onmessage = (event) => {
    //                 try {
    //                     const data = JSON.parse(event.data);
    //                     console.log("📨 UserDashboard WebSocket:", data);
                        
    //                     // ✅ Handle different event types
    //                     switch(data.type || data.event) {
    //                         case 'new_alert':
    //                         case 'NEW_SOS':
    //                             // ✅ Only refresh if it's the current user's alert
    //                             if (data.alert?.user_id === userId || data.payload?.user_id === userId) {
    //                                 fetchMyAlerts();
    //                                 // Show notification
    //                                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
    //                                     .play()
    //                                     .catch(() => console.log("Audio play blocked"));
    //                             }
    //                             break;
                                
    //                         case 'alert_assigned':
    //                         case 'ALERT_CLAIMED':
    //                             // ✅ Update the alert status
    //                             const alertId = data.alert_id || data.payload?.id;
    //                             setAlerts(prev => 
    //                                 prev.map(a => 
    //                                     a.id === alertId
    //                                         ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: data.responder_type || data.payload?.assigned_to }
    //                                         : a
    //                                 )
    //                             );
    //                             break;
                                
    //                         case 'alert_resolved':
    //                         case 'INCIDENT_RESOLVED':
    //                             const resolvedId = data.alert_id || data.payload?.id;
    //                             setAlerts(prev => 
    //                                 prev.map(a => 
    //                                     a.id === resolvedId
    //                                         ? { ...a, status: 'RESOLVED', resolved_by: data.responder_type || data.payload?.resolved_by }
    //                                         : a
    //                                 )
    //                             );
    //                             break;
                                
    //                         case 'user_confirmed':
    //                         case 'USER_CONFIRMED_ARRIVAL':
    //                             const confirmedId = data.alert_id || data.payload?.id;
    //                             setAlerts(prev => 
    //                                 prev.map(a => 
    //                                     a.id === confirmedId
    //                                         ? { ...a, user_confirmed_arrival: true }
    //                                         : a
    //                                 )
    //                             );
    //                             break;
                                
    //                         default:
    //                             // If it's a full alert object for this user
    //                             if (data.id && data.user_id === userId) {
    //                                 fetchMyAlerts();
    //                             }
    //                     }
    //                 } catch (err) {
    //                     console.error("WebSocket parse error:", err);
    //                 }
    //             };
                
    //             ws.onerror = (err) => {
    //                 console.error("WebSocket Error:", err);
    //                 setWsConnected(false);
    //             };
                
    //             ws.onclose = (event) => {
    //                 if (isMounted) {
    //                     console.log(`⚠️ WebSocket Disconnected (${event.code})`);
    //                     setWsConnected(false);
    //                     if (event.code !== 1000) {
    //                         reconnectTimer = setTimeout(connectWebSocket, 5000);
    //                     }
    //                 }
    //             };
    //         } catch (err) {
    //             console.error("WebSocket connection error:", err);
    //             reconnectTimer = setTimeout(connectWebSocket, 5000);
    //         }
    //     };
        
    //     if (userId) {
    //         connectWebSocket();
    //         fetchMyAlerts();
    //     }
        
    //     return () => {
    //         isMounted = false;
    //         if (reconnectTimer) clearTimeout(reconnectTimer);
    //         if (ws && ws.readyState === WebSocket.OPEN) {
    //             ws.close(1000, "Component unmounting");
    //         }
    //     };
    // }, [userId, fetchMyAlerts]);

    // // ✅ Loading state
    // if (loading) {
    //     return (
    //         <div className="h-screen bg-slate-900 text-white flex items-center justify-center">
    //             <div className="text-center">
    //                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
    //                 <p>Loading your dashboard...</p>
    //                 <p className="text-sm text-slate-400 mt-2">WebSocket: {wsConnected ? "✅ Connected" : "⏳ Connecting..."}</p>
    //             </div>
    //         </div>
    //     );
    // }




    // ✅ Confirm Arrival - changes button to "Delete" but disabled
    const confirmArrival = async (alertId) => {
        setLoadingActions(prev => ({ ...prev, [alertId]: true }));
        
        try {
            console.log("Confirming arrival for alert:", alertId);
            const token = localStorage.getItem('token');
            
            const response = await axios.patch(
                `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/confirm-arrival`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log("Arrival confirmed:", response.data);
            
            // ✅ Update state - button will show "Delete" but disabled
            setAlerts(prev => 
                prev.map(a => 
                    a.id === alertId 
                        ? { ...a, user_confirmed_arrival: true, status: 'ARRIVED' }
                        : a
                )
            );
            
            await fetchMyAlerts();
            
        } catch (err) {
            console.error("Error confirming arrival:", err);
            alert(`Error: ${err.response?.data?.detail || "Something went wrong"}`);
        } finally {
            setLoadingActions(prev => ({ ...prev, [alertId]: false }));
        }
    };

    // ✅ Delete Alert - only after rescuer has resolved
    const deleteAlert = async (alertId) => {
        if (!window.confirm('Are you sure you want to delete this alert?')) return;
        
        try {
            const token = localStorage.getItem('token');
            
            await axios.delete(
                `https://sos-alert-app-backend.onrender.com/alerts/${alertId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // ✅ Remove from local state
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            
            alert('✅ Alert deleted successfully');
            
        } catch (err) {
            console.error("Error deleting alert:", err);
            alert(`Error: ${err.response?.data?.detail || "Failed to delete alert"}`);
        }
    };

    // ✅ Render
    return (
        <div className="max-w-6xl mx-auto p-6 bg-slate-900 min-h-screen text-white">
            <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <Shield className="text-red-500" size={32} /> SOS Center
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Welcome, {user?.username || 'User'}! 
                        WebSocket: {wsConnected ? "🟢 Connected" : "🔴 Disconnected"}
                    </p>
                    {nearestStation && (
                        <p className="text-xs text-blue-400 mt-1">
                            📍 Nearest Station: {nearestStation.name} ({nearestStation.area_command})
                        </p>
                    )}
                </div>
                <button 
                    onClick={triggerSOS} 
                    className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-black animate-bounce shadow-2xl transition-all hover:scale-105"
                >
                    🚨 TRIGGER SOS
                </button>
            </header>

            <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-700 text-slate-300 text-xs uppercase">
                            <th className="p-4">Incident</th>
                            <th className="p-4">Time</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Rescuer</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-10 text-center text-slate-500">
                                    No records found. Click the SOS button to send an alert.
                                </td>
                            </tr>
                        ) : (
                            alerts.map((alert) => (
                                <tr key={alert.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="p-4 font-mono text-blue-400">#{alert.id}</td>
                                    <td className="p-4 text-sm">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                            alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500' :
                                            alert.status === 'RESOLVED' ? 'bg-green-500' :
                                            alert.status === 'ASSIGNED' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {alert.claimed_by_type || alert.assigned_to || 'Searching...'}
                                        {alert.responder_name && ` (${alert.responder_name})`}
                                    </td>
                                    <td className="p-4 text-center">
                                        {/* ✅ Disable button if already confirmed or loading */}
                                        {alert.status === 'HELP_ON_THE_WAY' && !alert.user_confirmed_arrival ? (
                                            <button 
                                                onClick={() => confirmArrival(alert.id)} 
                                                disabled={loadingActions[alert.id]}
                                                className={`bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors ${
                                                    loadingActions[alert.id] ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                {loadingActions[alert.id] ? '⏳...' : '✅ Arrived?'}
                                            </button>
                                        ) : alert.user_confirmed_arrival ? (
                                            <span className="text-green-500 flex items-center gap-1 justify-center">
                                                <CheckCircle size={16} /> Verified
                                            </span>
                                        ) : alert.status === 'PENDING' ? (
                                            <span className="text-yellow-500">Waiting for responder...</span>
                                        ) : alert.status === 'RESOLVED' ? (
                                            <span className="text-green-500">✅ Resolved</span>
                                        ) : "—"}
                                    </td>
                                    <td className="p-4 text-center">
                                        {/* ✅ Delete button only if resolved */}
                                        {alert.status === 'RESOLVED' && (
                                            <button 
                                                onClick={() => deleteAlert(alert.id)} 
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                            >
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserDashboard;













































































































































// import React, { useEffect, useState, useCallback } from 'react';
// import axios from 'axios';
// import { Shield, CheckCircle } from 'lucide-react';
// import '../App.css';

// const UserDashboard = ({ userId = 1, user = "maja" }) => {
//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [wsConnected, setWsConnected] = useState(false);

//     const fetchMyAlerts = useCallback(async () => {
//         if (!userId) return;
        
//         try {
//             console.log("Fetching alerts for user ID:", userId);
//             const res = await axios.get(`https://sos-alert-app-backend.onrender.com/alerts/history/${userId}`);
//             // const res = await axios.get(`http://localhost:8000/alerts/history/${userId}`);
//             console.log("Fetched alerts:", res.data);
            
//             // Filter out deleted alerts if needed
//             const activeAlerts = res.data.filter(a => !a.is_deleted_by_user);
//             setAlerts(activeAlerts);
//         } catch (err) {
//             console.error("Error fetching alerts:", err);
//             if (err.response?.status === 404) {
//                 console.log("No alerts found for this user");
//                 setAlerts([]);
//             }
//         } finally {
//             setLoading(false);
//         }
//     }, [userId]);

//     const triggerSOS = async () => {
//         if (!userId) return;
        
//         navigator.geolocation.getCurrentPosition(async (pos) => {
//             const payload = { 
//                 user_id: userId,
//                 username: user?.username || "Unknown User", 
//                 lat: pos.coords.latitude, 
//                 lon: pos.coords.longitude 
//             };
//             try {
//                 // const res = await axios.post('http://localhost:8000/alerts/trigger', payload);
//                 const res = await axios.post('https://sos-alert-app-backend.onrender.com/alerts/trigger', payload);
//                 alert(`SOS SENT! Nearest Station: ${res.data.nearest_station}`);
//                 await fetchMyAlerts(); 
//             } catch (err) {
//                 alert("Error sending SOS: " + err.message);
//             }
//         }, (err) => {
//             alert("Please enable location services to send SOS");
//             console.error("Geolocation error:", err);
//         });
//     };

//     // WebSocket connection effect
//     useEffect(() => {
//         let ws = null;
//         let reconnectTimer = null;
//         let isMounted = true;
        
//         const connectWebSocket = () => {
//             if (!isMounted) return;
            
//             try {
//                 // Close existing connection if any
//                 if (ws && ws.readyState === WebSocket.OPEN) {
//                     ws.close();
//                 }
                
//                 // ws = new WebSocket('ws://localhost:8000/ws/alerts');
//                 ws = new WebSocket('wss://sos-alert-app-backend.onrender.com/ws/alerts');

//                 ws.onopen = () => {
//                     if (isMounted) {
//                         console.log("UserDashboard WebSocket Connected ✅");
//                         setWsConnected(true);
//                     }
//                     if (reconnectTimer) clearTimeout(reconnectTimer);
//                 };
                
//                 ws.onmessage = (event) => {
//                     try {
//                         const data = JSON.parse(event.data);
//                         console.log("UserDashboard WebSocket message received:", data);
                        
//                         // Refresh alerts for these events
//                         const relevantEvents = ["ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED", "NEW_SOS"];
//                         if (relevantEvents.includes(data.event)) {
//                             console.log("Refreshing alerts due to event:", data.event);
//                             fetchMyAlerts();
//                         }
//                     } catch (err) {
//                         console.error("WebSocket message parse error:", err);
//                     }
//                 };
                
//                 ws.onerror = (err) => {
//                     console.error("WebSocket Error:", err);
//                     setWsConnected(false);
//                 };
                
//                 ws.onclose = (event) => {
//                     if (isMounted) {
//                         console.log("WebSocket Disconnected, code:", event.code, "reason:", event.reason);
//                         setWsConnected(false);
//                         // Only reconnect if it wasn't a normal closure
//                         if (event.code !== 1000) {
//                             reconnectTimer = setTimeout(connectWebSocket, 5000);
//                         }
//                     }
//                 };
//             } catch (err) {
//                 console.error("WebSocket connection error:", err);
//             }
//         };
        
//         // Start WebSocket connection
//         connectWebSocket();
        
//         // Cleanup function
//         return () => {
//             isMounted = false;
//             if (reconnectTimer) clearTimeout(reconnectTimer);
//             if (ws && ws.readyState === WebSocket.OPEN) {
//                 console.log("Closing UserDashboard WebSocket 🛑");
//                 ws.close(1000, "Component unmounting");
//             }
//         };
//     }, [fetchMyAlerts]); // Only re-run if fetchMyAlerts changes

//     // Separate effect for initial data loading
//     useEffect(() => {
//         // Load initial data
//         fetchMyAlerts();
//     }, [fetchMyAlerts]); // This effect only runs once when component mounts

//     const confirmArrival = async (alertId) => {
//         try {
//             console.log("Confirming arrival for alert:", alertId);
            
//             const response = await axios.patch(
//                 // `http://localhost:8000/alerts/${alertId}/confirm-arrival`,
//                 `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/confirm-arrival`,
//                 {}, // Empty body - no data needed
//                 {
//                     headers: {
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );
            
//             console.log("Arrival confirmed:", response.data);
            
//             // Refresh alerts immediately
//             await fetchMyAlerts();
            
//             // Show success message
//             alert("Arrival confirmed! Rescuer will be notified.");
            
//         } catch (err) {
//             console.error("Error confirming arrival:", err);
            
//             if (err.response) {
//                 console.error("Backend Error:", err.response.data);
//                 if (err.response.status === 404) {
//                     alert("Alert not found");
//                 } else if (err.response.status === 422) {
//                     alert("Validation error. Please check if the alert exists.");
//                 } else {
//                     alert(`Error: ${err.response.data.detail || "Something went wrong"}`);
//                 }
//             } else {
//                 alert("Network error. Please check if the backend server is running.");
//             }
//         }
//     };

//     if (loading) {
//         return (
//             <div className="h-screen bg-slate-900 text-white flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
//                     <p>Loading your dashboard...</p>
//                     <p className="text-sm text-slate-400 mt-2">WebSocket: {wsConnected ? "✅ Connected" : "⏳ Connecting..."}</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="max-w-6xl mx-auto p-6 bg-slate-900 min-h-screen text-white">
//             <header className="mb-8 flex justify-between items-center">
//                 <div>
//                     <h2 className="text-3xl font-bold flex items-center gap-3">
//                         <Shield className="text-red-500" size={32} /> SOS Center
//                     </h2>
//                     <p className="text-sm text-slate-400 mt-1">
//                         WebSocket: {wsConnected ? "🟢 Connected" : "🔴 Disconnected"}
//                     </p>
//                 </div>
//                 <button 
//                     onClick={triggerSOS} 
//                     className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-black animate-bounce shadow-2xl"
//                 >
//                     TRIGGER SOS
//                 </button>
//             </header>

//             <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
//                 <table className="w-full text-left">
//                     <thead>
//                         <tr className="bg-slate-700 text-slate-300 text-xs uppercase">
//                             <th className="p-4">Incident</th>
//                             <th className="p-4">Time</th>
//                             <th className="p-4">Status</th>
//                             <th className="p-4">Rescuer</th>
//                             <th className="p-4 text-center">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {alerts.length === 0 ? (
//                             <tr>
//                                 <td colSpan="5" className="p-10 text-center text-slate-500">
//                                     No records found. Click the SOS button to send an alert.
//                                 </td>
//                             </tr>
//                         ) : (
//                             alerts.map((alert) => (
//                                 <tr key={alert.id} className="border-b border-slate-700">
//                                     <td className="p-4 font-mono text-blue-400">#{alert.incident_number}</td>
//                                     <td className="p-4">{new Date(alert.created_at).toLocaleTimeString()}</td>
//                                     <td className="p-4">
//                                         <span className={`px-2 py-1 rounded text-[10px] font-bold ${
//                                             alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500' :
//                                             alert.status === 'RESOLVED' ? 'bg-green-500' :
//                                             'bg-red-500'
//                                         }`}>
//                                             {alert.status}
//                                         </span>
//                                     </td>
//                                     <td className="p-4 text-sm">
//                                         {alert.claimed_by_type || 'Searching...'}
//                                         {alert.responder_name && ` (${alert.responder_name})`}
//                                     </td>
//                                     <td className="p-4 text-center">
//                                         {alert.status === 'HELP_ON_THE_WAY' && !alert.user_confirmed_arrival ? (
//                                             <button 
//                                                 onClick={() => confirmArrival(alert.id)} 
//                                                 className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
//                                             >
//                                                 Arrived?
//                                             </button>
//                                         ) : alert.user_confirmed_arrival ? (
//                                             <span className="text-green-500 flex items-center gap-1 justify-center">
//                                                 <CheckCircle size={16} /> Verified
//                                             </span>
//                                         ) : alert.status === 'PENDING' ? (
//                                             <span className="text-yellow-500">Waiting for responder...</span>
//                                         ) : "—"}
//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default UserDashboard;

























































// import React, { useEffect, useState, useCallback } from 'react';
// import axios from 'axios';
// import { Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
// import '../App.css';

// const UserDashboard = ({ userId = 1, user = "maja" }) => { // Added user prop for username
//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const fetchMyAlerts = useCallback(async () => {
//         console.log(userId)
//         if (!userId) return;
//         try {
//             const res = await axios.get(`http://localhost:8000/alerts/history/${userId}`);
//             // If the column is_deleted_by_user doesn't exist yet, use: setAlerts(res.data)
//             setAlerts(res.data.filter(a => !a.is_deleted_by_user));
//         } catch (err) {
//             console.error("Error fetching alerts:", err);
//         } finally {
//             setLoading(false);
//         }
//     }, [userId]);

//     const triggerSOS = async () => {
//         if (!userId) return;
        
//         navigator.geolocation.getCurrentPosition(async (pos) => {
//             const payload = { 
//                 user_id: userId,
//                 username: user?.username || "Unknown User", 
//                 lat: pos.coords.latitude, 
//                 lon: pos.coords.longitude 
//             };
//             try {
//                 const res = await axios.post('http://localhost:8000/alerts/trigger', payload);
//                 alert(`SOS SENT! Nearest Station: ${res.data.nearest_station}`);
//                 fetchMyAlerts(); 
//             } catch (err) {
//                 alert("Error sending SOS: " + err.message);
//             }
//         });
//     };

//     // useEffect(() => {
//     //     fetchMyAlerts();
//     //     const ws = new WebSocket('ws://localhost:8000/ws/alerts');
        
//     //     ws.onmessage = (event) => {
//     //         const data = JSON.parse(event.data);
//     //         const relevantEvents = ["ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"];
//     //         if (relevantEvents.includes(data.event)) {
//     //             fetchMyAlerts();
//     //         }
//     //     };

//     //     return () => ws.close();
//     // }, [fetchMyAlerts]);
//     // UserDashboard.jsx
//     useEffect(() => {
//         let ws = null;
//         let reconnectTimer = null;
//         let isMounted = true;
        
//         const connectWebSocket = () => {
//             if (!isMounted) return;
            
//             try {
//                 ws = new WebSocket('ws://localhost:8000/ws/alerts');
                
//                 ws.onopen = () => {
//                     if (isMounted) console.log("WebSocket Connected ✅");
//                     if (reconnectTimer) clearTimeout(reconnectTimer);
//                 };
                
//                 ws.onmessage = (event) => {
//                     try {
//                         const data = JSON.parse(event.data);
//                         console.log("WebSocket message received:", data);
                        
//                         // Refresh alerts when relevant events happen
//                         if (data.event === "ALERT_CLAIMED" || data.event === "USER_CONFIRMED_ARRIVAL") {
//                             fetchMyAlerts(); // Your function to fetch user's alerts
//                         }
//                     } catch (err) {
//                         console.error("WebSocket message parse error:", err);
//                     }
//                 };
                
//                 ws.onerror = (err) => {
//                     console.error("WebSocket Error:", err);
//                 };
                
//                 ws.onclose = () => {
//                     if (isMounted) {
//                         console.log("WebSocket Disconnected, reconnecting in 3 seconds...");
//                         reconnectTimer = setTimeout(connectWebSocket, 3000);
//                     }
//                 };
//             } catch (err) {
//                 console.error("WebSocket connection error:", err);
//             }
//         };
        
//         connectWebSocket();
        
//         return () => {
//             isMounted = false;
//             if (reconnectTimer) clearTimeout(reconnectTimer);
//             if (ws && ws.readyState === WebSocket.OPEN) {
//                 ws.close();
//             }
//         };
//     }, [fetchMyAlerts]); // Empty dependency array

//     // const confirmArrival = async (alertId) => {
//     //     try {
//     //         await axios.patch(`http://localhost:8000/alerts/${alertId}/confirm-arrival`);
//     //         alert("Arrival confirmed!");
//     //         fetchMyAlerts();
//     //     } catch (err) {
//     //         alert(err+" Failed to send feedback.");
//     //     }
//     // };




//     const confirmArrival = async (alertId) => {
//         try {
//             console.log("Confirming arrival for alert:", alertId);
            
//             const response = await axios.patch(
//                 `http://localhost:8000/alerts/${alertId}/confirm-arrival`,
//                 {}, // Empty body - no data needed
//                 {
//                     headers: {
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );
            
//             console.log("Arrival confirmed:", response.data);
            
//             // Refresh alerts to update UI
//             fetchMyAlerts(); // Call your function to refresh alerts
            
//             // Optional: Show success message
//             alert("Arrival confirmed! Rescuer will be notified.");
            
//         } catch (err) {
//             console.error("Error confirming arrival:", err);
            
//             if (err.response) {
//                 console.error("Backend Error:", err.response.data);
//                 if (err.response.status === 404) {
//                     alert("Alert not found");
//                 } else if (err.response.status === 422) {
//                     alert("Validation error. Please check if the alert exists.");
//                 } else {
//                     alert(`Error: ${err.response.data.detail || "Something went wrong"}`);
//                 }
//             } else {
//                 alert("Network error. Please check if the backend server is running.");
//             }
//         }
//     };

//     if (loading) return <div className="h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

//     return (
//         <div className="max-w-6xl mx-auto p-6 bg-slate-900 min-h-screen text-white">
//             <header className="mb-8 flex justify-between items-center">
//                 <h2 className="text-3xl font-bold flex items-center gap-3">
//                     <Shield className="text-red-500" size={32} /> SOS Center
//                 </h2>
//                 <button onClick={triggerSOS} className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-black animate-bounce shadow-2xl">
//                     TRIGGER SOS
//                 </button>
//             </header>

//             <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
//                 <table className="w-full text-left">
//                     <thead>
//                         <tr className="bg-slate-700 text-slate-300 text-xs uppercase">
//                             <th className="p-4">Incident</th>
//                             <th className="p-4">Time</th>
//                             <th className="p-4">Status</th>
//                             <th className="p-4">Rescuer</th>
//                             <th className="p-4 text-center">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {alerts.length === 0 ? (
//                             <tr><td colSpan="5" className="p-10 text-center text-slate-500">No records found.</td></tr>
//                         ) : (
//                             alerts.map((alert) => (
//                                 <tr key={alert.id} className="border-b border-slate-700">
//                                     <td className="p-4 font-mono text-blue-400">#{alert.incident_number}</td>
//                                     <td className="p-4">{new Date(alert.created_at).toLocaleTimeString()}</td>
//                                     <td className="p-4">
//                                         <span className="px-2 py-1 rounded bg-slate-900 text-[10px]">{alert.status}</span>
//                                     </td>
//                                     <td className="p-4 text-sm">{alert.claimed_by_type || 'Searching...'}</td>
//                                     <td className="p-4 text-center">
//                                         {alert.status === 'HELP_ON_THE_WAY' && !alert.user_confirmed_arrival ? (
//                                             <button onClick={() => confirmArrival(alert.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs">
//                                                 Arrived?
//                                             </button>
//                                         ) : alert.user_confirmed_arrival ? "✅ Verified" : "—"}
//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default UserDashboard;





































// import React, { useEffect, useState, useCallback } from 'react';
// import axios from 'axios';
// import { Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
// import '../App.css';

// const UserDashboard = ({ userId }) => {
//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // 1. Memoized fetch function to prevent infinite re-renders
//     const fetchMyAlerts = useCallback(async () => {
//         try {
//             const res = await axios.get(`http://localhost:8000/alerts/history/${userId}`);
//             // Filter to show only alerts not hidden/deleted by the user
//             setAlerts(res.data.filter(a => !a.is_deleted_by_user));
//         } catch (err) {
//             console.error("Error fetching alerts:", err);
//         } finally {
//             setLoading(false);
//         }
//     }, [userId]);

//     // 2. Real-time updates via WebSocket
//     useEffect(() => {
//         fetchMyAlerts();

//         const ws = new WebSocket('ws://localhost:8000/ws/alerts');
        
//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             // Refresh list if an alert is claimed, resolved, or arrival is confirmed
//             const relevantEvents = ["ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"];
//             if (relevantEvents.includes(data.event)) {
//                 fetchMyAlerts();
//             }
//         };

//         ws.onerror = (error) => console.error("WebSocket Error:", error);

//         return () => ws.close();
//     }, [fetchMyAlerts]);

//     // 3. Confirm Arrival Handshake
//     const confirmArrival = async (alertId) => {
//         try {
//             await axios.patch(`http://localhost:8000/alerts/${alertId}/confirm-arrival`);
//             alert("Arrival confirmed! The rescue team has been notified.");
//             fetchMyAlerts();
//         } catch (err) {
//             console.error("Feedback failed:", err);
//             alert("Failed to send feedback. Please try again.");
//         }
//     };

//     if (loading) {
//         return (
//             <div className="flex h-screen items-center justify-center bg-slate-900">
//                 <div className="text-white animate-pulse">Establishing Secure Connection...</div>
//             </div>
//         );
//     }

//     return (
//         <div className="max-w-6xl mx-auto p-6 bg-slate-900 min-h-screen text-white">
//             <header className="mb-8 flex justify-between items-center">
//                 <h2 className="text-3xl font-bold flex items-center gap-3">
//                     <Shield className="text-red-500" size={32} /> 
//                     SOS Response Center
//                 </h2>
//                 <div className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
//                     Live Tracking Enabled
//                 </div>
//             </header>

//             <div className="overflow-x-auto bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
//                 <table className="w-full text-left border-collapse">
//                     <thead>
//                         <tr className="bg-slate-700/50 text-slate-300 uppercase text-xs tracking-wider">
//                             <th className="p-4">Incident</th>
//                             <th className="p-4">Time Sent</th>
//                             <th className="p-4">Status</th>
//                             <th className="p-4">Rescuer Info</th>
//                             <th className="p-4 text-center">Arrival Feedback</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {alerts.length === 0 ? (
//                             <tr>
//                                 <td colSpan="5" className="p-10 text-center text-slate-500">
//                                     <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
//                                     No active or past emergency records found.
//                                 </td>
//                             </tr>
//                         ) : (
//                             alerts.map((alert) => (
//                                 <tr key={alert.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
//                                     <td className="p-4 font-mono text-blue-400">#{alert.incident_number}</td>
//                                     <td className="p-4 text-slate-400">
//                                         {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                     </td>
//                                     <td className="p-4">
//                                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
//                                             alert.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
//                                             alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
//                                             'bg-green-500/10 text-green-500 border border-green-500/20'
//                                         }`}>
//                                             {alert.status.replace(/_/g, ' ')}
//                                         </span>
//                                     </td>
//                                     <td className="p-4">
//                                         {alert.status === 'HELP_ON_THE_WAY' ? (
//                                             <div className="flex flex-col">
//                                                 <span className="font-bold text-blue-300">{alert.claimed_by_type} En Route</span>
//                                                 <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
//                                                     <Clock size={12} /> ETA: {alert.estimated_arrival_time || 'Calculating...'}
//                                                 </span>
//                                             </div>
//                                         ) : alert.status === 'RESOLVED' ? (
//                                             <span className="text-slate-400 text-sm">Case Closed</span>
//                                         ) : (
//                                             <span className="text-slate-500 italic text-sm">Awaiting Dispatcher...</span>
//                                         )}
//                                     </td>
//                                     <td className="p-4 text-center">
//                                         {alert.status === 'HELP_ON_THE_WAY' && !alert.user_confirmed_arrival ? (
//                                             <button 
//                                                 onClick={() => confirmArrival(alert.id)}
//                                                 className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold animate-pulse shadow-lg transition-all active:scale-95"
//                                             >
//                                                 Confirm {alert.claimed_by_type} Arrival
//                                             </button>
//                                         ) : alert.user_confirmed_arrival ? (
//                                             <div className="text-green-400 flex flex-col items-center justify-center gap-1">
//                                                 <CheckCircle size={18} />
//                                                 <span className="text-[10px] font-bold">VERIFIED</span>
//                                             </div>
//                                         ) : (
//                                             <span className="text-slate-600 text-xs">—</span>
//                                         )}
//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default UserDashboard;

















































































































// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { MapPin, Shield, CheckCircle, Clock } from 'lucide-react';

// const UserDashboard = ({ userId }) => {
//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const fetchMyAlerts = async () => {
//         try {
//             const res = await axios.get(`http://localhost:8000/alerts/history/${userId}`);
//             // Filter to show only active (not deleted) alerts
//             setAlerts(res.data.filter(a => !a.is_deleted_by_user));
//         } catch (err) {
//             console.error("Error fetching alerts", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchMyAlerts();
//         // Setup WebSocket for real-time status updates
//         const ws = new WebSocket('ws://localhost:8000/ws/alerts');
//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.event === "ALERT_CLAIMED" || data.event === "USER_CONFIRMED_ARRIVAL") {
//                 fetchMyAlerts(); // Refresh list when status changes
//             }
//         };
//         return () => ws.close();
//     }, [fetchMyAlerts]);

//     const confirmArrival = async (alertId) => {
//         try {
//             await axios.patch(`http://localhost:8000/alerts/${alertId}/confirm-arrival`);
//             alert("Feedback sent! The officer can now resolve the case.");
//             fetchMyAlerts();
//         } catch (err) {
//             alert(err + " Failed to send feedback.");
//         }
//     };

//     if (loading) return <div className="p-10 text-center text-white">Loading Security Status...</div>;

//     return (
//         <div className="max-w-6xl mx-auto p-6 bg-slate-900 min-h-screen text-white">
//             <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
//                 <Shield className="text-red-500" /> SOS Management
//             </h2>

//             <div className="overflow-x-auto bg-slate-800 rounded-xl shadow-2xl">
//                 <table className="w-full text-left border-collapse">
//                     <thead>
//                         <tr className="bg-slate-700 text-slate-300 uppercase text-xs">
//                             <th className="p-4">Incident ID</th>
//                             <th className="p-4">Time Sent</th>
//                             <th className="p-4">Status</th>
//                             <th className="p-4">Rescuer Details</th>
//                             <th className="p-4 text-center">Give Feedback</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {alerts.map((alert) => (
//                             <tr key={alert.id} className="border-b border-slate-700 hover:bg-slate-750 transition-colors">
//                                 <td className="p-4 font-mono text-blue-400">#{alert.incident_number}</td>
//                                 <td className="p-4">{new Date(alert.created_at).toLocaleTimeString()}</td>
//                                 <td className="p-4">
//                                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${
//                                         alert.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 
//                                         alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
//                                     }`}>
//                                         {alert.status.replace(/_/g, ' ')}
//                                     </span>
//                                 </td>
//                                 <td className="p-4">
//                                     {alert.status === 'HELP_ON_THE_WAY' ? (
//                                         <div className="flex flex-col">
//                                             <span className="font-bold text-blue-300">{alert.claimed_by_type} Unit Dispatched</span>
//                                             <span className="text-xs text-slate-400 flex items-center gap-1">
//                                                 <Clock size={12} /> Est. Arrival: {alert.estimated_arrival_time || 'Calculating...'}
//                                             </span>
//                                         </div>
//                                     ) : (
//                                         <span className="text-slate-500 italic">Waiting for dispatch...</span>
//                                     )}
//                                 </td>
//                                 <td className="p-4 text-center">
//                                     {alert.status === 'HELP_ON_THE_WAY' && !alert.user_confirmed_arrival ? (
//                                         <button 
//                                             onClick={() => confirmArrival(alert.id)}
//                                             className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse shadow-lg transition-all"
//                                         >
//                                             Click once {alert.claimed_by_type} arrive
//                                         </button>
//                                     ) : alert.user_confirmed_arrival ? (
//                                         <span className="text-green-400 flex items-center justify-center gap-1 font-bold">
//                                             <CheckCircle size={16} /> Arrival Verified
//                                         </span>
//                                     ) : (
//                                         <span className="text-slate-600">—</span>
//                                     )}
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default UserDashboard;


















































































































// import React, { useContext, useState, useEffect, useCallback } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import api from '../api';
// import '../App.css';

// const UserDashboard = () => {
//     const { user } = useContext(AuthContext);
//     const [history, setHistory] = useState([]);
//     const [nearestStation, setNearestStation] = useState(null);
//     const [activeDispatch, setActiveDispatch] = useState(null);

//     // 1. Extract the ID outside to satisfy the Compiler
//     const userId = user?.id;

//     // 2. Memoized fetch function
//     const fetchHistory = useCallback(async () => {
//         if (!userId) return; 

//         try {
//             const res = await api.get(`/alerts/history/${userId}`);
//             setHistory(res.data);
//         } catch (err) {
//             console.error("Failed to fetch history", err);
//         }
//     }, [userId]); // No optional chaining here, just the variable

//     // 3. Effect for History
//     useEffect(() => {
//         let isMounted = true;

//         const loadData = async () => {
//             // We call fetchHistory, but we ensure the component 
//             // is still mounted before React processes the result.
//             if (isMounted) {
//                 await fetchHistory();
//             }
//         };

//         loadData();

//         return () => {
//             isMounted = false; // Cleanup to prevent memory leaks/cascading renders
//         };
//     }, [fetchHistory]);
    




//     // 4. Effect for Nearest Station
//     useEffect(() => {
//         navigator.geolocation.getCurrentPosition(async (pos) => {
//             try {
//                 const res = await api.get(`/alerts/nearest?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
//                 setNearestStation(res.data);
//             } catch (err) {
//                 console.log("Could not find nearest station: ", err.message);
//             }
//         });
//     }, []); // Runs once on mount

//     const triggerSOS = async () => {
//         if (!userId) return;
        
//         navigator.geolocation.getCurrentPosition(async (pos) => {
//             const payload = { 
//                 user_id: userId,
//                 username: user.username, // Include username for better identification
//                 lat: pos.coords.latitude, 
//                 lon: pos.coords.longitude 
//             };
//             try {
//                 const res = await api.post('/alerts/trigger', payload);
//                 alert(`SOS SENT! Nearest Station: ${res.data.nearest_station}`);
//                 fetchHistory(); // Refresh history list
//             } catch (err) {
//                 alert("Error sending SOS: " + err.message);
//             }
//         });
//     };






//     useEffect(() => {
//         // We pass the userId so the backend knows which user to notify
//         if (!userId) return;

//         const statusWs = new WebSocket(`ws://127.0.0.1:8000/ws/status/${userId}`);

//         statusWs.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.status === 'DISPATCHED') {
//                 setActiveDispatch({
//                     station: data.station_name || "Nearest Unit",
//                     eta: data.eta || "10-15 mins"
//                 });
//                 alert(`🚨 UPDATE: Police have been dispatched to your location! Expected arrival: ${data.eta || '10-15 mins'}`);
//                 fetchHistory(); // Refresh the list to show the status change
//             } else if (data.status === 'RESOLVED') {
//                 setActiveDispatch(null); // Hide banner when help arrives
//                 alert("Emergency resolved. Stay safe.");
//             }
//         };

//         return () => statusWs.close();
//     }, [userId, fetchHistory]);

//     console.log(activeDispatch); // Debugging line to check if activeDispatch is being set


//     return (
//         <div className="container">
//             <h1>Emergency Dashboard</h1>
            
//             {/* Nearest Station Card */}
//             {nearestStation && (
//                 <div className="alert-card" style={{ borderLeft: '5px solid #4CAF50' }}>
//                     <p>Closest Help: <strong>{nearestStation.station_name}</strong></p>
//                 </div>
//             )}

//             <div className="sos-container">
//                 <button onClick={triggerSOS} className="sos-btn">
//                     SOS
//                 </button>
//             </div>

//             {/* History Table */}
//             <table className="history-table">
//                 <thead>
//                     <tr>
//                         <th>Time</th>
//                         <th>Status</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {history.map((item) => (
//                         <tr key={item.id}>
//                             <td>{new Date(item.created_at).toLocaleString()}</td>
//                             <td>
//                                 <span className={`status-badge status-${item.status.toLowerCase()}`}>
//                                     {item.status}
//                                 </span>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// };

// export default UserDashboard;