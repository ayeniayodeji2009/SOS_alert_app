import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Shield, MapPin, User, CheckCircle, Navigation } from 'lucide-react';
import '../App.css';


// Fix for default marker icons not showing up
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Helper: Real-time Routing Component ---
const RoutingMachine = ({ userPos, responderPos }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !userPos || !responderPos) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(responderPos[0], responderPos[1]),
                L.latLng(userPos[0], userPos[1])
            ],
            lineOptions: { styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] },
            createMarker: () => null, // We use our own markers
            addWaypoints: false,
            routeWhileDragging: false,
            show: false // Hide the text instructions panel
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [map, userPos, responderPos]);

    return null;
};

// --- Helper: Marker with Username Label ---
const createVictimIcon = (username) => {
    return new L.DivIcon({
        html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="background: white; color: #ef4444; padding: 2px 8px; border-radius: 12px; 
                    font-size: 11px; font-weight: bold; border: 2px solid #ef4444; white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
                    ${username}
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/564/564619.png" style="width: 30px; height: 30px;" />
            </div>`,
        className: 'custom-label-icon',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
    });
};

const RescueDashboard = ({ responderType }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
    const [myLocation, setMyLocation] = useState(null);





    // Get Rescuer's current location for routing
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setMyLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.error("Location access denied", err)
        );
    }, []);

    // const fetchAlerts = useCallback(async () => {
    //     try {
    //         const res = await axios.get('http://localhost:8000/admin/alerts/active');
    //         setAlerts(res.data);
    //     } catch (err) {
    //         console.error("Fetch Error:", err);
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

    // useEffect(() => {
    //     fetchAlerts();
    //     const ws = new WebSocket('ws://localhost:8000/ws/alerts');

    //     ws.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         // Auto-refresh on any relevant event
    //         if (["NEW_SOS", "ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"].includes(data.event)) {
    //             fetchAlerts();
    //             if (data.event === "NEW_SOS") {
    //                 setMapCenter([data.alert.lat, data.alert.lon]);
    //                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3').play().catch(() => {});
    //             }
    //         }
    //     };
    //     return () => ws.close();
    // }, [fetchAlerts]);
    // useEffect(() => {
    //     fetchAlerts();
        
    //     const ws = new WebSocket('ws://localhost:8000/ws/alerts');

    //     ws.onopen = () => console.log("WebSocket Connected ✅");

    //     ws.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         if (["NEW_SOS", "ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"].includes(data.event)) {
    //             fetchAlerts();
    //             if (data.event === "NEW_SOS") {
    //                 setMapCenter([data.alert.lat, data.alert.lon]);
    //                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3').play().catch(() => {});
    //             }
    //         }
    //     };

    //     ws.onerror = (err) => console.error("WebSocket Error:", err);

    //     // Return the cleanup function to close the connection properly
    //     return () => {
    //         if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    //     };
    // }, [fetchAlerts]);

    // 1. Wrap fetchAlerts in useCallback so it doesn't change on every render
    const fetchAlerts = useCallback(async () => {
        try {
            // const response = await axios.get('http://localhost:8000/alerts');
            const response = await axios.get('https://sos-alert-app-backend.onrender.com/alerts');
            setAlerts(response.data);
        } catch (err) {
            // console.error("Error fetching alerts:", err.response?.status === 404 ? "Route not found on backend!" : err.message);
            console.error("Error fetching alerts:", err);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is stable







    // Fixed WebSocket implementation
    useEffect(() => {
        // 1. Initial fetch when component mounts
        fetchAlerts();
        
        // 2. Setup WebSocket with error handling and reconnection
        let ws = null;
        let reconnectTimer = null;
        
        const connectWebSocket = () => {
            try {
                // ws = new WebSocket('ws://localhost:8000/ws/alerts');
                ws = new WebSocket('ws://sos-alert-app-backend.onrender.com/ws/alerts');

                ws.onopen = () => {
                    console.log("WebSocket Connected ✅");
                    // Clear any reconnect timer on successful connection
                    if (reconnectTimer) clearTimeout(reconnectTimer);
                };
                
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        const validEvents = ["NEW_SOS", "ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"];
                        
                        if (validEvents.includes(data.event)) {
                            fetchAlerts();
                            
                            if (data.event === "NEW_SOS" && data.alert) {
                                setMapCenter([data.alert.lat, data.alert.lon]);
                                new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
                                    .play()
                                    .catch(() => console.log("Audio play blocked"));
                            }
                        }
                    } catch (err) {
                        console.error("WebSocket message parse error:", err);
                    }
                };
                
                ws.onerror = (err) => {
                    console.error("WebSocket Error:", err);
                    // Don't close immediately on error, let it try to recover
                };
                
                ws.onclose = (event) => {
                    console.log("WebSocket Disconnected, attempting reconnect in 3 seconds...:"+ event, event.reason);
                    // Attempt to reconnect after 3 seconds
                    reconnectTimer = setTimeout(() => {
                        if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
                            connectWebSocket();
                        }
                    }, 3000);
                };
            } catch (err) {
                console.error("WebSocket connection error:", err);
            }
        };
        
        // Start WebSocket connection
        connectWebSocket();
        
        // 4. Cleanup function
        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log("Closing WebSocket 🛑");
                ws.close();
            }
        };
    }, [fetchAlerts]);

    // useEffect(() => {
    //     // 2. Initial fetch when component mounts
    //     fetchAlerts();
        
    //     // 3. Setup WebSocket
    //     const ws = new WebSocket('ws://localhost:8000/ws/alerts');

    //     ws.onopen = () => console.log("WebSocket Connected ✅");

    //     ws.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         const validEvents = ["NEW_SOS", "ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"];
            
    //         if (validEvents.includes(data.event)) {
    //             fetchAlerts(); // Now safe to call because it's stable
                
    //             if (data.event === "NEW_SOS" && data.alert) {
    //                 setMapCenter([data.alert.lat, data.alert.lon]);
    //                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
    //                     .play()
    //                     .catch(() => {}); // Browsers block audio until user clicks something
    //             }
    //         }
    //     };

    //     ws.onerror = (err) => console.error("WebSocket Error:", err);

    //     // 4. Cleanup function: Runs when the component unmounts
    //     return () => {
    //         if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    //             console.log("Closing WebSocket 🛑");
    //             ws.close();
    //         }
    //     };
    // }, [fetchAlerts]); // This only triggers if fetchAlerts changes (which it won't now)

    // const handleClaim = async (alertId) => {
    //     console.log(`Attempting to claim alert ${alertId} as ${responderType} from location:`, myLocation);
    //     if (!myLocation) return alert("Please enable GPS to attend alerts.");
    //     try {
    //         await axios.patch(`http://localhost:8000/alerts/${alertId}/respond`, {
    //             responder_type: responderType,
    //             responder_lat: myLocation[0],
    //             responder_lon: myLocation[1]
    //         });
    //         fetchAlerts();
    //     } catch (err) {
    //         alert("Claim failed: " + (err.response?.data?.detail || "Server error"));
    //     }
    // };
    // const handleClaim = async (alertId) => {
    //     // 1. Safety check for location
    //     if (!myLocation || !myLocation[0] || !myLocation[1]) {
    //         return alert("Error: GPS location not acquired yet. Please wait a moment. Check if you have granted location permissions and that your device's GPS is active.");
    //     }

    //     const payload = {
    //         responder_type: String(responderType), // Ensure it's a string
    //         responder_lat: Number(myLocation[0]), // Ensure it's a number
    //         responder_lon: Number(myLocation[1])  // Ensure it's a number
    //     };

    //     console.log("Sending Payload to backend:", payload); // Debugging: Check your browser console
    //     console.log("Alert ID:", alertId);
    //     console.log(typeof alertId); // Should be a number if backend expects int
    //     try {
    //         await axios.patch(`http://localhost:8000/alerts/${alertId}/respond`, payload);
    //         fetchAlerts();
    //     } catch (err) {
    //         // If it still fails, the error message from the backend will tell us exactly which field is wrong
    //         console.error("Backend Validation Error:", err.response?.data?.detail);
    //         alert("Claim failed: Check console for validation details.");
    //     }
    // };
    // const handleClaim = async (e, alertId) => {


    //     if (e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //     }


    //     try {
    //         const payload = {
    //             responder_type: String(responderType), // Ensure it's a string (e.g., "POLICE")
    //             responder_lat: parseFloat(myLocation[0]),
    //             responder_lon: parseFloat(myLocation[1])
    //         };

    //         console.log("Sending Payload to backend:", payload);
    //         console.log("Alert ID:", alertId);
    //         console.log(typeof alertId); // Should be a number if backend expects int

    //         const response = await axios.patch(
    //             `http://localhost:8000/alerts/${alertId}/respond`, 
    //             payload // No "data:" wrapper here!
    //         );

    //         console.log("Claim Successful:", response.data);
    //     } catch (err) {
    //         if (err.response && err.response.data) {
    //             console.error("Backend Validation Error:", err.response.data.detail);
    //         } else {
    //             console.error("Error claiming alert:", err.message);
    //         }
    //     }
    // };

    const handleClaim = async (e, alertId) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Check if we have location
        if (!myLocation) {
            console.error("Location not available");
            alert("Please enable location services");
            return;
        }

        try {
            const payload = {
                responder_type: responderType, // Make sure this matches the expected string
                responder_lat: myLocation[0],
                responder_lon: myLocation[1]
            };

            console.log("Sending Payload to backend:", payload);
            console.log("Alert ID:", alertId);
            console.log("Location:", myLocation);

            const response = await axios.patch(
                // `http://localhost:8000/alerts/${alertId}/respond`,
                `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/respond`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("Claim Successful:", response.data);
            // Refresh alerts after successful claim
            fetchAlerts();
            
        } catch (err) {
            if (err.response) {
                console.error("Backend Error Response:", err.response.data);
                console.error("Status Code:", err.response.status);
                
                // Show specific error message to user
                if (err.response.status === 422) {
                    const errorDetails = err.response.data.detail;
                    if (Array.isArray(errorDetails)) {
                        errorDetails.forEach(detail => {
                            console.error(`Validation error for ${detail.loc.join('.')}: ${detail.msg}`);
                        });
                        alert(`Validation error: ${errorDetails.map(d => d.msg).join(', ')}`);
                    } else {
                        alert(`Error: ${JSON.stringify(errorDetails)}`);
                    }
                } else if (err.response.status === 404) {
                    alert("Alert not found");
                } else {
                    alert(`Error: ${err.response.data.detail || "Something went wrong"}`);
                }
            } else {
                console.error("Error claiming alert:", err.message);
                alert("Network error. Please check if the backend server is running.");
            }
        }
    };



    const handleResolve = async (alertId) => {
        try {
            // await axios.patch(`http://localhost:8000/alerts/${alertId}/resolve`);
            await axios.patch(`https://sos-alert-app-backend.onrender.com/alerts/${alertId}/resolve`);
            fetchAlerts();
        } catch (err) {
            console.error("Resolve error:", err);
        }
    };

    if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Initializing Secure Terminal...</div>;
    //<div className="flex h-screen w-screen bg-slate-900 overflow-hidden font-sans">
    //<aside className="w-96 bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl z-50">

    return (
        <div className="dashboard-wrapper bg-slate-900 font-sans">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar-container bg-slate-800 border-r border-slate-700 shadow-2xl">
                <div className="p-6 bg-slate-900 flex items-center gap-4 border-b border-slate-700">
                    <Shield size={40} className="text-red-500" />
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">{responderType}</h1>
                        <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">Emergency Control</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase px-2">Active Emergencies ({alerts.length})</h2>
                    
                    {alerts.length === 0 ? (
                        <div className="py-20 text-center opacity-30 text-white">
                            <CheckCircle size={48} className="mx-auto mb-2" />
                            <p>Area Secured</p>
                        </div>
                    ) : (
                        alerts.map(alert => (
                            <div key={alert.id} className={`p-4 rounded-xl border-l-4 transition-all ${
                                alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-700 border-red-500 animate-pulse'
                            }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-mono text-slate-400">#{alert.incident_number}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                                    }`}>{alert.status}</span>
                                </div>
                                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                                    <User size={16} className="text-slate-400"/> {alert.username}
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button 
                                        disabled={alert.status === 'HELP_ON_THE_WAY'}
                                        onClick={(e) => handleClaim(e, alert.id)}
                                        className={`py-2 rounded font-bold text-xs uppercase ${
                                            alert.status === 'HELP_ON_THE_WAY' ? 'bg-slate-600 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                                        }`}>
                                        {alert.status === 'HELP_ON_THE_WAY' ? 'En Route' : 'Attend'}
                                    </button>
                                    
                                    <button 
                                        disabled={!alert.user_confirmed_arrival}
                                        onClick={() => handleResolve(alert.id)}
                                        className={`py-2 rounded font-bold text-xs uppercase border ${
                                            alert.user_confirmed_arrival 
                                            ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white' 
                                            : 'border-slate-600 text-slate-600 opacity-50 cursor-not-allowed'
                                        }`}>
                                        Resolve
                                    </button>
                                </div>
                                {!alert.user_confirmed_arrival && alert.status === 'HELP_ON_THE_WAY' && (
                                    <p className="text-[10px] text-yellow-500 mt-2 text-center">Waiting for user arrival confirmation...</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* --- MAP AREA --- */}
            {/*<main className="flex-1 relative">*/}
            <main className="map-main-area">
                <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {alerts.map(alert => (
                        <React.Fragment key={alert.id}>
                            <Marker position={[alert.lat, alert.lon]} icon={createVictimIcon(alert.username)}>
                                <Popup>
                                    <div className="p-2 text-slate-900">
                                        <p className="font-bold border-b pb-1 mb-2 text-red-600">{alert.username}</p>
                                        <button onClick={(e) => handleClaim(e, alert.id)} className="w-full bg-blue-600 text-white text-xs py-1 rounded">Dispatch Unit</button>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Show Route Line if claimed */}
                            {alert.status === 'HELP_ON_THE_WAY' && alert.responder_lat && (
                                <RoutingMachine 
                                    userPos={[alert.lat, alert.lon]} 
                                    responderPos={[alert.responder_lat, alert.responder_lon]} 
                                />
                            )}
                        </React.Fragment>
                    ))}
                </MapContainer>
            </main>
        </div>
    );
};

export default RescueDashboard;















































































































// import React, { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import axios from 'axios';
// import 'leaflet/dist/leaflet.css';
// import { Shield, MapPin, User, CheckCircle } from 'lucide-react';

// // Fixing the Missing Marker Icon Issue (Standard Leaflet Bug)
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// const victimIcon = new L.Icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
//     iconSize: [35, 35],
//     iconAnchor: [17, 35],
//     popupAnchor: [0, -35]
// });

// function ChangeView({ center }) {
//     const map = useMap();
//     useEffect(() => {
//         if (center && center[0] !== 0) {
//             map.flyTo(center, 14, { animate: true });
//         }
//     }, [center, map]);
//     return null;
// }

// const RescueDashboard = ({ responderType }) => {
//     console.log("RescueDashboard mounted. Fetching active alerts...");
//     console.log("Responder Type:", responderType);

//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]); // Default Lagos

//     useEffect(() => {
//         const fetchAlerts = async () => {
//             try {
//                 const res = await axios.get('http://localhost:8000/admin/alerts/active');
//                 setAlerts(res.data);
//             } catch (err) {
//                 console.error("API Error:", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAlerts();

//         // FIXED: Protocol must be ws:// not http://
//         const ws = new WebSocket('ws://localhost:8000/ws/alerts');

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.event === "NEW_SOS") {
//                 setAlerts(prev => [data.alert, ...prev]);
//                 setMapCenter([data.alert.lat, data.alert.lon]);
//                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3').play().catch(() => {});
//             } else if (data.event === "ALERT_CLAIMED" || data.event === "INCIDENT_RESOLVED") {
//                 setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
//             }
//         };

//         return () => ws.close();
//     }, []);

//     console.log("Active alerts loaded:", JSON.stringify(alerts));


//     const handleAction = async (id, action) => {
//         try {
//             const url = action === 'claim' 
//                 ? `http://localhost:8000/alerts/${id}/respond?responder_type=${responderType}`
//                 : `http://localhost:8000/alerts/${id}/resolve`;
            
//             await axios.patch(url);
//             if (action === 'resolve' || action === 'claim') {
//                 setAlerts(prev => prev.filter(a => a.id !== id));
//             }
//             alert(`Incident ${action}ed successfully.`);
//         } catch (err) {
//             console.error("Action failed:", err);
//         }
//     };

//     if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Connecting to Emergency Network...</div>;

//     return (
//         <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
//             <aside className="sidebar" style={{ width: '350px', background: '#1e293b', color: 'white', overflowY: 'auto', zIndex: 1000 }}>
//                 <div style={{ padding: '20px', background: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
//                     <Shield color="#ef4444" size={32} />
//                     <div>
//                         <h2 style={{ margin: 0, fontSize: '18px' }}>{responderType}</h2>
//                         <small style={{ color: '#60a5fa' }}>LIVE CONTROL</small>
//                     </div>
//                 </div>

//                 <div style={{ padding: '15px' }}>
//                     <h3 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>ACTIVE CALLS ({alerts.length})</h3>
//                     {alerts.length === 0 ? (
//                         <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>
//                             <CheckCircle size={48} style={{ marginBottom: '10px' }} />
//                             <p>No active emergencies</p>
//                         </div>
//                     ) : (
//                         alerts.map(alert => (
//                             <div key={alert.id} className="alert-card" style={{ background: '#334155', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #ef4444' }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
//                                     <span>#{alert.incident_number}</span>
//                                     <span style={{ color: '#ef4444', fontWeight: 'bold' }}>SOS</span>
//                                 </div>
//                                 <p style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}><User size={14}/> {alert.username}</p>
//                                 <div style={{ display: 'flex', gap: '5px' }}>
//                                     <button onClick={() => handleAction(alert.id, 'claim')} style={{ flex: 1, padding: '8px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>ATTEND</button>
//                                     <button onClick={() => handleAction(alert.id, 'resolve')} style={{ flex: 1, padding: '8px', border: '1px solid #22c55e', color: '#22c55e', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}>RESOLVE</button>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </aside>

//             <main style={{ flex: 1, position: 'relative' }}>
//                 <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
//                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                     <ChangeView center={mapCenter} />
//                     {alerts.map(alert => (
//                         <Marker key={alert.id} position={[alert.lat, alert.lon]} icon={victimIcon}>
//                             <Popup>
//                                 <div style={{ color: 'black' }}>
//                                     <strong>{alert.username}</strong><br/>
//                                     <button onClick={() => handleAction(alert.id, 'claim')} style={{ marginTop: '10px', width: '100%' }}>Dispatch Unit</button>
//                                 </div>
//                             </Popup>
//                         </Marker>
//                     ))}
//                 </MapContainer>
//             </main>
//         </div>
//     );
//     // return (<h1>Hello Rescue team test</h1>)
// };

// export default RescueDashboard;















































































































// import React, { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import axios from 'axios';
// import 'leaflet/dist/leaflet.css';
// import { Shield, MapPin, User, CheckCircle } from 'lucide-react';
// import '../App.css'; 

// // Custom Marker Icon for the Victim
// const victimIcon = new L.Icon({
//     iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
//     iconSize: [35, 35],
//     iconAnchor: [17, 35],
//     popupAnchor: [0, -35]
// });

// // Helper component to auto-center map when a new alert arrives
// function ChangeView({ center }) {
//     const map = useMap();
//     useEffect(() => {
//         if (center) map.setView(center, 14);
//     }, [center, map]);
//     return null;
// }

// const RescueDashboard = ({ responderType }) => {
//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]); // Default Lagos

//     // 1. Fetch Active Alerts and Setup WebSockets
//     useEffect(() => {
//         // const fetchAlerts = async () => {
//         //     try {
//         //         const res = await axios.get('http://localhost:8000/admin/alerts/active');
//         //         setAlerts(res.data);
//         //     } catch (err) {
//         //         console.error("Failed to load active alerts", err);
//         //     }
//         // };
//         // fetchAlerts();

//         const fetchAlerts = async () => {
//         try {
//             console.log("Fetching active alerts...");
//             const res = await axios.get('http://localhost:8000/admin/alerts/active');
//             console.log("Alerts received:", res.data);
//             setAlerts(res.data);
//         } catch (err) {
//             console.error("API Error:", err);
//         } finally {
//             setLoading(false);
//         }
//         };
//         fetchAlerts();








//         const ws = new WebSocket('http://localhost:8000/ws/alerts');

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.event === "NEW_SOS") {
//                 setAlerts(prev => [data.alert, ...prev]);
//                 setMapCenter([data.alert.lat, data.alert.lon]);
//                 // Play SOS Sound
//                 const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
//                 audio.play().catch(e => console.log("Audio play blocked by browser: ", e));
//             } else if (data.event === "ALERT_CLAIMED") {
//                 // If another responder claimed it, remove from list
//                 setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
//             } else if (data.event === "INCIDENT_RESOLVED") {
//                 setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
//             }
//         };

//         return () => ws.close();
//     }, []);

//     console.log(alerts); // Debug: Check incoming alerts
//     console.log("Current map center:", mapCenter);
//     console.log("Loading state:", loading);

//     // 2. Claim/Attend Action
//     const handleClaim = async (alertId) => {
//         try {
//             await axios.patch(`http://localhost:8000/alerts/${alertId}/respond?responder_type=${responderType}`);
//             alert(`${responderType} unit is now en route!`);
//         } catch (err) {
//             console.error("Claim failed:", err);
//             alert("Could not claim alert. It may have been taken by another unit.");
//         }
//     };

//     // 3. Resolve Action
//     const handleResolve = async (alertId) => {
//         if (!window.confirm("Mark this incident as resolved?")) return;
//         try {
//             await axios.patch(`http://localhost:8000/alerts/${alertId}/resolve`);
//             setAlerts(prev => prev.filter(a => a.id !== alertId));
//             alert("Incident successfully closed.");
//         } catch (err) {
//             console.error("Resolve failed:", err);
//             alert("Error updating incident status.");
//         }
//     };

//     return (
//         <div className="dashboard-container">
//             <aside className="sidebar">
//                 <div className="sidebar-header">
//                     <Shield className="icon-shield" />
//                     <div>
//                         <h2 className="text-xl font-bold">{responderType}</h2>
//                         <span className="text-xs text-blue-400">CONTROL CENTER</span>
//                     </div>
//                 </div>
                
//                 <div className="alert-list">
//                     <h3 className="text-sm font-semibold mb-4 text-gray-400">ACTIVE EMERGENCIES ({alerts.length})</h3>
//                     {alerts.length === 0 ? (
//                         <div className="no-alerts-container">
//                             <CheckCircle className="mx-auto mb-2 text-green-500" size={40} />
//                             <p className="no-alerts text-center">All clear. No pending calls.</p>
//                         </div>
//                     ) : (
//                         alerts.map(alert => (
//                             <div key={alert.id} className="alert-card animate-pulse">
//                                 <div className="card-top">
//                                     <span className="incident-id">#{alert.incident_number}</span>
//                                     <span className="badge-pending">SOS</span>
//                                 </div>
//                                 <div className="card-body">
//                                     <p><User size={16} className="text-blue-400"/> <strong>{alert.username}</strong></p>
//                                     <p><MapPin size={16} className="text-red-400"/> {alert.lat.toFixed(4)}, {alert.lon.toFixed(4)}</p>
//                                 </div>
//                                 <div className="action-buttons">
//                                     <button onClick={() => handleClaim(alert.id)} className="btn-claim">
//                                         ATTEND
//                                     </button>
//                                     <button onClick={() => handleResolve(alert.id)} className="btn-resolve">
//                                         RESOLVE
//                                     </button>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </aside>

//             <main className="map-area">
//                 <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
//                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                     <ChangeView center={mapCenter} />
//                     {alerts.map(alert => (
//                         <Marker key={alert.id} position={[alert.lat, alert.lon]} icon={victimIcon}>
//                             <Popup>
//                                 <div className="popup-content">
//                                     <h4 className="font-bold text-red-600">{alert.username}</h4>
//                                     <p className="text-sm mb-2">Emergency Reported</p>
//                                     <div className="flex flex-col gap-2">
//                                         <button onClick={() => handleClaim(alert.id)} className="p-2 bg-blue-600 text-white rounded">Dispatch Team</button>
//                                         <button onClick={() => handleResolve(alert.id)} className="p-2 bg-green-600 text-white rounded">Resolve SOS</button>
//                                     </div>
//                                 </div>
//                             </Popup>
//                         </Marker>
//                     ))}
//                 </MapContainer>
//             </main>
//         </div>
//     );
// };

// export default RescueDashboard;


























// // import React, { useEffect, useState } from 'react';
// // import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// // import L from 'leaflet';
// // import axios from 'axios';
// // import 'leaflet/dist/leaflet.css';
// // import { Shield, MapPin, User, AlertTriangle } from 'lucide-react';
// // import '../App.css';


// // // Custom Marker Icon for the Victim
// // const victimIcon = new L.Icon({
// //     iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
// //     iconSize: [35, 35],
// //     iconAnchor: [17, 35],
// // });

// // // Helper to auto-center map when a new alert arrives
// // function ChangeView({ center }) {
// //     const map = useMap();
// //     map.setView(center, 14);
// //     return null;
// // }

// // const RescueDashboard = ({ responderType }) => { // 'POLICE' or 'AMOTEKUN'
// //     const [alerts, setAlerts] = useState([]);
// //     const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]); // Default Lagos

// //     useEffect(() => {
// //         // 1. Fetch initial active alerts
// //         const fetchAlerts = async () => {
// //             const res = await axios.get('http://localhost:8000/admin/alerts/active');
// //             setAlerts(res.data);
// //         };
// //         fetchAlerts();

// //         // 2. Connect to WebSocket
// //         const ws = new WebSocket('ws://localhost:8000/ws/alerts');

// //         ws.onmessage = (event) => {
// //             const data = JSON.parse(event.data);
// //             if (data.event === "NEW_SOS") {
// //                 setAlerts(prev => [data.alert, ...prev]);
// //                 setMapCenter([data.alert.lat, data.alert.lon]);
// //                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3').play(); // Alert sound
// //             } else if (data.event === "ALERT_CLAIMED") {
// //                 // Remove from pending list if someone else claimed it
// //                 setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
// //             }
// //         };

// //         return () => ws.close();
// //     }, []);

// //     const handleClaim = async (alertId) => {
// //         try {
// //             await axios.patch(`http://localhost:8000/alerts/${alertId}/respond?responder_type=${responderType}`);
// //             // Remove from local list after claiming
// //             setAlerts(prev => prev.filter(a => a.id !== alertId));
// //             alert("Rescue mission started! Navigation data sent to your unit.");
// //         } catch (err) {
// //             alert("Error claiming alert: " + err.response?.data?.detail);
// //         }
// //     };




// //         // 1. Update the handleResolve function to use the 'err' variable for logging
// //         const handleResolve = async (alertId) => {
// //             if (!window.confirm("Are you sure this incident is resolved?")) return;
// //             try {
// //                 await axios.patch(`http://localhost:8000/alerts/${alertId}/resolve`);
// //                 setAlerts(prev => prev.filter(a => a.id !== alertId));
// //             } catch (err) {
// //                 // Now 'err' is used!
// //                 console.error("Resolution failed:", err.response?.data || err.message);
// //                 alert("Could not resolve incident. Please check your connection.");
// //             }
// //         };



// //     return (
// //         <div className="dashboard-container">
// //             <aside className="sidebar">
// //                 <div className="sidebar-header">
// //                     <Shield className="icon-shield" />
// //                     <h2>{responderType} CONTROL</h2>
// //                 </div>
                
// //                 <div className="alert-list">
// //                     <h3>Incoming SOS ({alerts.length})</h3>
// //                     {alerts.length === 0 ? (
// //                         <p className="no-alerts">No active emergencies</p>
// //                     ) : (
// //                         alerts.map(alert => (
// //                             <div key={alert.id} className="alert-card animate-pulse">
// //                                 <div className="card-top">
// //                                     <span className="incident-id">{alert.incident_number}</span>
// //                                     <span className="badge-pending">PENDING</span>
// //                                 </div>
// //                                 <div className="card-body">
// //                                     <p><User size={16}/> <strong>{alert.username}</strong></p>
// //                                     <p><MapPin size={16}/> {alert.lat.toFixed(4)}, {alert.lon.toFixed(4)}</p>
// //                                 </div>
// //                                 <button onClick={() => handleClaim(alert.id)} className="btn-claim">
// //                                     ATTEND NOW
// //                                 </button>
// //                             </div>
// //                         ))
// //                     )}
// //                 </div>
// //             </aside>

// //             <main className="map-area">
// //                 <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
// //                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
// //                     <ChangeView center={mapCenter} />
// //                     {alerts.map(alert => (
// //                         <Marker key={alert.id} position={[alert.lat, alert.lon]} icon={victimIcon}>
// //                             <Popup>
// //                                 <div className="popup-content">
// //                                     <h4>{alert.username}</h4>
// //                                     <p>Emergency SOS triggered</p>
// //                                     <button onClick={() => handleClaim(alert.id)}>Dispatch Team</button>
// //                                 </div>
// //                             </Popup>
// //                         </Marker>
// //                     ))}
// //                 </MapContainer>
// //             </main>
// //         </div>
// //     );
// // };

// // export default RescueDashboard;