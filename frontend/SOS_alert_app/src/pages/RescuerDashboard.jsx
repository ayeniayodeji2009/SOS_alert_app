import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Shield, MapPin, User, CheckCircle, Navigation, Phone, Target } from 'lucide-react';
import '../App.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- 🚨 Create Victim Icon with Username ---
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

// --- 🏢 Create Station Icon with Name ---
// const createStationIcon = (stationName, isPolice = true) => {
//     const iconUrl = isPolice 
//         ? 'https://cdn-icons-png.flaticon.com/512/2991/2991400.png' // Police badge
//         : 'https://cdn-icons-png.flaticon.com/512/2991/2991399.png'; // Amotekun shield
    
//     const color = isPolice ? '#2563eb' : '#16a34a';
    
//     return new L.DivIcon({
//         html: `
//             <div style="display: flex; flex-direction: column; align-items: center;">
//                 <div style="background: white; color: ${color}; padding: 2px 8px; border-radius: 12px; 
//                     font-size: 10px; font-weight: bold; border: 2px solid ${color}; white-space: nowrap;
//                     box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
//                     ${stationName}
//                 </div>
//                 <img src="${iconUrl}" style="width: 30px; height: 30px;" />
//             </div>`,
//         className: 'custom-label-icon',
//         iconSize: [30, 42],
//         iconAnchor: [15, 42],
//     });
// };

// // --- Routing Component ---
// const RoutingMachine = ({ userPos, responderPos }) => {
//     const map = useMap();

//     useEffect(() => {
//         if (!map || !userPos || !responderPos) return;

//         const routingControl = L.Routing.control({
//             waypoints: [
//                 L.latLng(responderPos[0], responderPos[1]),
//                 L.latLng(userPos[0], userPos[1])
//             ],
//             lineOptions: { styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] },
//             createMarker: () => null,
//             addWaypoints: false,
//             routeWhileDragging: false,
//             show: false
//         }).addTo(map);

//         return () => map.removeControl(routingControl);
//     }, [map, userPos, responderPos]);

//     return null;
// };

// const RescueDashboard = ({ responderType }) => {
//     const [alerts, setAlerts] = useState([]);
//     const [policeStations, setPoliceStations] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
//     const [myLocation, setMyLocation] = useState(null);
//     const [loadingActions, setLoadingActions] = useState({});
//     const [wsConnected, setWsConnected] = useState(false);
//     const [userRole] = useState(localStorage.getItem('userRole') || responderType);

//     // --- Get Rescuer's Location ---
//     useEffect(() => {
//         navigator.geolocation.getCurrentPosition(
//             (pos) => setMyLocation([pos.coords.latitude, pos.coords.longitude]),
//             (err) => console.error("Location access denied", err)
//         );
//     }, []);

//     // --- Fetch Police Stations ---
//     const fetchPoliceStations = useCallback(async () => {
//         try {
//             const response = await axios.get('https://sos-alert-app-backend.onrender.com/police-posts');
//             setPoliceStations(response.data);
//         } catch (err) {
//             console.error("Error fetching police stations:", err);
//         }
//     }, []);

//     // --- Fetch Alerts ---
//     const fetchAlerts = useCallback(async () => {
//         try {
//             const response = await axios.get('https://sos-alert-app-backend.onrender.com/alerts');
//             setAlerts(response.data);
//         } catch (err) {
//             console.error("Error fetching alerts:", err);
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     // --- Handle Claim Alert ---
//     const handleClaim = async (e, alertId) => {
//         if (e) {
//             e.preventDefault();
//             e.stopPropagation();
//         }

//         if (!myLocation) {
//             alert("Please enable location services");
//             return;
//         }

//         // ✅ Check if already assigned to someone else
//         const alert = alerts.find(a => a.id === alertId);
//         if (alert?.assigned_to && alert.assigned_to !== responderType) {
//             alert(`❌ This alert is already assigned to ${alert.assigned_to}`);
//             return;
//         }

//         setLoadingActions(prev => ({ ...prev, [alertId]: true }));

//         try {
//             const payload = {
//                 responder_type: responderType,
//                 responder_lat: myLocation[0],
//                 responder_lon: myLocation[1]
//             };

//             const response = await axios.patch(
//                 `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/respond`,
//                 payload,
//                 { headers: { 'Content-Type': 'application/json' } }
//             );

//             console.log("✅ Claim Successful:", response.data);
            
//             // ✅ Update state immediately (optimistic update)
//             setAlerts(prev => 
//                 prev.map(a => 
//                     a.id === alertId 
//                         ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: responderType }
//                         : a
//                 )
//             );
            
//             // ✅ Also fetch fresh data from server
//             await fetchAlerts();
            
//         } catch (err) {
//             console.error("❌ Error claiming alert:", err);
//             if (err.response?.status === 403) {
//                 alert(`❌ ${err.response.data.detail || 'Alert already assigned to someone else'}`);
//             } else {
//                 alert("Error claiming alert. Please try again.");
//             }
//         } finally {
//             setLoadingActions(prev => ({ ...prev, [alertId]: false }));
//         }
//     };

//     // --- Handle Resolve Alert ---
//     const handleResolve = async (alertId) => {
//         const alert = alerts.find(a => a.id === alertId);
        
//         // ✅ Only assigned rescuer can resolve
//         if (alert?.assigned_to !== responderType && alert?.assigned_to_role !== responderType) {
//             alert("❌ You are not authorized to resolve this alert");
//             return;
//         }

//         // ✅ Must have user confirmation
//         if (!alert?.user_confirmed_arrival) {
//             alert("⚠️ Waiting for user to confirm arrival");
//             return;
//         }

//         setLoadingActions(prev => ({ ...prev, [`resolve_${alertId}`]: true }));

//         try {
//             await axios.patch(
//                 `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/resolve`,
//                 { responder_type: responderType },
//                 { headers: { 'Content-Type': 'application/json' } }
//             );

//             // ✅ Optimistic update
//             setAlerts(prev => 
//                 prev.map(a => 
//                     a.id === alertId 
//                         ? { ...a, status: 'RESOLVED', resolved_by: responderType }
//                         : a
//                 )
//             );
            
//             await fetchAlerts();
            
//         } catch (err) {
//             console.error("❌ Error resolving alert:", err);
//             alert(`❌ ${err.response?.data?.detail || 'Failed to resolve alert'}`);
//         } finally {
//             setLoadingActions(prev => ({ ...prev, [`resolve_${alertId}`]: false }));
//         }
//     };

//     // --- WebSocket & Initial Fetch ---
//     useEffect(() => {
//         // Initial data fetch
//         fetchAlerts();
//         fetchPoliceStations();

//         // WebSocket setup
//         let ws = null;
//         let reconnectTimer = null;

//         const connectWebSocket = () => {
//             try {
//                 ws = new WebSocket('wss://sos-alert-app-backend.onrender.com/ws/alerts');

//                 ws.onopen = () => {
//                     console.log("🔌 WebSocket Connected");
//                     setWsConnected(true);
//                     if (reconnectTimer) clearTimeout(reconnectTimer);
                    
//                     // Authenticate WebSocket
//                     const token = localStorage.getItem('token');
//                     if (token) {
//                         ws.send(JSON.stringify({
//                             type: 'auth',
//                             token: token,
//                             role: responderType
//                         }));
//                     }
//                 };

//                 ws.onmessage = (event) => {
//                     try {
//                         const data = JSON.parse(event.data);
//                         console.log("📨 WebSocket message:", data);
                        
//                         // ✅ Handle all event types
//                         switch(data.type || data.event) {
//                             case 'new_alert':
//                             case 'NEW_SOS':
//                                 setAlerts(prev => [data.alert || data.payload, ...prev]);
//                                 if (data.alert?.lat) {
//                                     setMapCenter([data.alert.lat, data.alert.lon]);
//                                 }
//                                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
//                                     .play()
//                                     .catch(() => console.log("Audio play blocked"));
//                                 break;

//                             case 'alert_assigned':
//                             case 'ALERT_CLAIMED':
//                                 setAlerts(prev => 
//                                     prev.map(a => 
//                                         a.id === (data.alert_id || data.payload?.id)
//                                             ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: data.responder_type || data.payload?.assigned_to }
//                                             : a
//                                     )
//                                 );
//                                 break;

//                             case 'alert_resolved':
//                             case 'INCIDENT_RESOLVED':
//                                 setAlerts(prev => 
//                                     prev.map(a => 
//                                         a.id === (data.alert_id || data.payload?.id)
//                                             ? { ...a, status: 'RESOLVED', resolved_by: data.responder_type || data.payload?.resolved_by }
//                                             : a
//                                     )
//                                 );
//                                 break;

//                             case 'user_confirmed':
//                             case 'USER_CONFIRMED_ARRIVAL':
//                                 setAlerts(prev => 
//                                     prev.map(a => 
//                                         a.id === (data.alert_id || data.payload?.id)
//                                             ? { ...a, user_confirmed_arrival: true }
//                                             : a
//                                     )
//                                 );
//                                 break;

//                             default:
//                                 // If it's a full alert object, refresh
//                                 if (data.id) {
//                                     fetchAlerts();
//                                 }
//                         }
//                     } catch (err) {
//                         console.error("❌ WebSocket parse error:", err);
//                     }
//                 };

//                 ws.onerror = (err) => {
//                     console.error("❌ WebSocket Error:", err);
//                 };

//                 ws.onclose = (event) => {
//                     console.log("⚠️ WebSocket Disconnected, reconnecting in 3s...");
//                     setWsConnected(false);
//                     reconnectTimer = setTimeout(() => {
//                         if (!ws || ws.readyState === WebSocket.CLOSED) {
//                             connectWebSocket();
//                         }
//                     }, 3000);
//                 };

//             } catch (err) {
//                 console.error("❌ WebSocket connection error:", err);
//                 reconnectTimer = setTimeout(connectWebSocket, 5000);
//             }
//         };

//         connectWebSocket();

//         return () => {
//             if (reconnectTimer) clearTimeout(reconnectTimer);
//             if (ws && ws.readyState === WebSocket.OPEN) {
//                 ws.close();
//             }
//         };
//     }, [fetchAlerts, fetchPoliceStations, responderType]);

//     if (loading) {
//         return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Initializing Secure Terminal...</div>;
//     }






// ✅ Create Rescuer/Station Icon with Name
const createRescuerIcon = (name, isPolice = true) => {
    const color = isPolice ? '#3b82f6' : '#22c55e';
    const iconUrl = isPolice 
        ? 'https://cdn-icons-png.flaticon.com/512/2991/2991400.png' // Police badge
        : 'https://cdn-icons-png.flaticon.com/512/2991/2991399.png'; // Amotekun shield
    
    return new L.DivIcon({
        html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="background: white; color: ${color}; padding: 2px 8px; border-radius: 12px; 
                    font-size: 10px; font-weight: bold; border: 2px solid ${color}; white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
                    🚓 ${name}
                </div>
                <img src="${iconUrl}" style="width: 30px; height: 30px;" />
            </div>`,
        className: 'custom-label-icon',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
    });
};

// ✅ Live Tracking Component
const LiveTracking = ({ userPos, responderPos, color = '#3b82f6' }) => {
    const map = useMap();
    const [currentPos, setCurrentPos] = useState(responderPos);
    
    useEffect(() => {
        if (!map || !userPos) return;
        
        // ✅ Simulate movement (in real app, this comes from WebSocket)
        const interval = setInterval(() => {
            setCurrentPos(prev => {
                if (!prev) return prev;
                // Move slightly towards user
                const lat = prev[0] + (userPos[0] - prev[0]) * 0.02;
                const lng = prev[1] + (userPos[1] - prev[1]) * 0.02;
                return [lat, lng];
            });
        }, 2000);
        
        return () => clearInterval(interval);
    }, [map, userPos]);
    
    return (
        <>
            {/* ✅ Routing line with color */}
            {currentPos && userPos && (
                <Polyline
                    positions={[currentPos, userPos]}
                    color={color}
                    weight={6}
                    opacity={0.8}
                    dashArray="10, 10"
                />
            )}
            
            {/* ✅ Moving rescuer marker */}
            {currentPos && (
                <Marker 
                    position={currentPos} 
                    icon={createRescuerIcon('En Route', color === '#3b82f6')}
                >
                    <Popup>
                        <div className="p-2">
                            <p className="font-bold">🚓 En Route</p>
                            <p className="text-sm">Moving to victim...</p>
                        </div>
                    </Popup>
                </Marker>
            )}
        </>
    );
};

// ✅ Main RescuerDashboard Component
const RescueDashboard = ({ responderType }) => {
    // ... existing state
    // const [nearestStation, setNearestStation] = useState(null);
    // const [isTracking, setIsTracking] = useState(false);
    // const [wsConnected, setWsConnected] = useState(false);
    // const watchIdRef = useRef(null);
    const [alerts, setAlerts] = useState([]);
    const [policeStations, setPoliceStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
    const [myLocation, setMyLocation] = useState(null);
    const [loadingActions, setLoadingActions] = useState({});
    const [wsConnected, setWsConnected] = useState(false); // ✅ ADD THIS
    const [nearestStation, setNearestStation] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);
    const [userRole] = useState(localStorage.getItem('userRole') || responderType);

    // ✅ Get Rescuer's real-time location
    useEffect(() => {
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    setMyLocation([pos.coords.latitude, pos.coords.longitude]);
                    // ✅ Update backend with current location
                    updateRescuerLocation(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => console.error("Location error:", err),
                { enableHighAccuracy: true, interval: 3000 }
            );
        }
        
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // ✅ Update rescuer location in backend
    // const updateRescuerLocation = async (lat, lon) => {
    //     try {
    //         await axios.patch(
    //             `https://sos-alert-app-backend.onrender.com/rescuers/location`,
    //             {
    //                 responder_type: responderType,
    //                 latitude: lat,
    //                 longitude: lon
    //             },
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //                 }
    //             }
    //         );
    //     } catch (err) {
    //         console.error("Error updating location:", err);
    //     }
    // };

    // // ✅ Find nearest station when claiming
    // const handleClaim = async (e, alertId) => {
    //     // ... existing claim logic
        
    //     // ✅ Find nearest station
    //     const alert = alerts.find(a => a.id === alertId);
    //     if (alert) {
    //         const station = await findNearestStation(alert.lat, alert.lon);
    //         setNearestStation(station);
    //         setIsTracking(true);
    //     }
    // };

    // // ✅ Find nearest station
    // const findNearestStation = async (lat, lon) => {
    //     try {
    //         const response = await axios.get(
    //             `https://sos-alert-app-backend.onrender.com/police-posts/nearby?lat=${lat}&lon=${lon}&radius=10000`
    //         );
    //         if (response.data && response.data.length > 0) {
    //             return response.data[0];
    //         }
    //         return null;
    //     } catch (err) {
    //         console.error("Error finding nearest station:", err);
    //         return null;
    //     }
    // };

    // ✅ Update rescuer location in backend
    const updateRescuerLocation = async (lat, lon) => {
        try {
            const token = localStorage.getItem('token');
            
            await axios.patch(
                'https://sos-alert-app-backend.onrender.com/rescuers/location',
                {
                    responder_type: responderType,  // 'POLICE' or 'AMOTEKUN'
                    latitude: lat,
                    longitude: lon
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (err) {
            console.error("Error updating location:", err.response?.data || err.message);
        }
    };

    // ✅ Get Rescuer's real-time location with better error handling
    useEffect(() => {
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    setMyLocation([lat, lon]);
                    // ✅ Update backend with current location
                    updateRescuerLocation(lat, lon);
                },
                (err) => {
                    console.error("Location error:", err.message);
                    // ✅ If location is denied, use a default or show error
                    if (err.code === 1) {
                        alert('Please enable location services for this app');
                    }
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 10000,
                    maximumAge: 5000
                }
            );
        } else {
            console.error("Geolocation not supported");
        }
        
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);


    // --- Component Render ---
    return (
        <div className="dashboard-wrapper bg-slate-900 font-sans">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar-container bg-slate-800 border-r border-slate-700 shadow-2xl">
                <div className="p-6 bg-slate-900 flex items-center gap-4 border-b border-slate-700">
                    <Shield size={40} className="text-red-500" />
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">{responderType}</h1>
                        <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">
                            {wsConnected ? '🟢 Live' : '🔴 Offline'}
                        </p>
                    </div>
                </div>

                {/* <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase px-2">
                        Active Emergencies ({alerts.filter(a => a.status !== 'RESOLVED').length})
                    </h2>
                    
                    {alerts.filter(a => a.status !== 'RESOLVED').length === 0 ? (
                        <div className="py-20 text-center opacity-30 text-white">
                            <CheckCircle size={48} className="mx-auto mb-2" />
                            <p>Area Secured</p>
                        </div>
                    ) : (
                        alerts.filter(a => a.status !== 'RESOLVED').map(alert => {
                            const isAssignedToMe = alert.assigned_to === responderType || alert.assigned_to_role === responderType;
                            const isAssigned = alert.assigned_to && alert.assigned_to !== responderType;
                            
                            return (
                                <div key={alert.id} className={`p-4 rounded-xl border-l-4 transition-all ${
                                    alert.status === 'HELP_ON_THE_WAY' 
                                        ? isAssignedToMe ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-700 border-yellow-500'
                                        : 'bg-slate-700 border-red-500 animate-pulse'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-mono text-slate-400">#{alert.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                                        }`}>{alert.status}</span>
                                    </div>
                                    <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                                        <User size={16} className="text-slate-400"/> {alert.username || 'Anonymous'}
                                    </h3>
                                    {alert.assigned_to && (
                                        <p className="text-xs text-slate-400 mb-2">
                                            Assigned to: <span className="font-bold text-white">{alert.assigned_to}</span>
                                        </p>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button 
                                            disabled={isAssigned || alert.status === 'HELP_ON_THE_WAY' || loadingActions[alert.id]}
                                            onClick={(e) => handleClaim(e, alert.id)}
                                            className={`py-2 rounded font-bold text-xs uppercase transition-all ${
                                                isAssigned 
                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                    : alert.status === 'HELP_ON_THE_WAY'
                                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                                            }`}>
                                            {loadingActions[alert.id] ? '⏳ Processing...' : 
                                             isAssigned ? `Assigned to ${alert.assigned_to}` : 
                                             alert.status === 'HELP_ON_THE_WAY' ? 'En Route' : 'Attend'}
                                        </button>
                                        
                                        <button 
                                            disabled={!isAssignedToMe || !alert.user_confirmed_arrival || alert.status === 'RESOLVED' || loadingActions[`resolve_${alert.id}`]}
                                            onClick={() => handleResolve(alert.id)}
                                            className={`py-2 rounded font-bold text-xs uppercase transition-all ${
                                                isAssignedToMe && alert.user_confirmed_arrival && alert.status !== 'RESOLVED'
                                                    ? 'border border-green-500 text-green-500 hover:bg-green-500 hover:text-white' 
                                                    : 'border-slate-600 text-slate-600 opacity-50 cursor-not-allowed'
                                            }`}>
                                            {loadingActions[`resolve_${alert.id}`] ? '⏳ Processing...' : 'Resolve'}
                                        </button>
                                    </div>
                                    
                                    {!alert.user_confirmed_arrival && alert.status === 'HELP_ON_THE_WAY' && isAssignedToMe && (
                                        <p className="text-[10px] text-yellow-500 mt-2 text-center">⏳ Waiting for user arrival confirmation...</p>
                                    )}
                                    {alert.resolved_by && alert.status === 'RESOLVED' && (
                                        <p className="text-[10px] text-green-500 mt-2 text-center">✅ Resolved by {alert.resolved_by}</p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div> */}
                {nearestStation && (
                    <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg mb-4">
                        <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                            <Target size={16} /> Nearest Station
                        </h4>
                        <p className="text-white text-sm">{nearestStation.name}</p>
                        <p className="text-xs text-slate-400">{nearestStation.area_command}</p>
                        {nearestStation.phone_no && (
                            <p className="text-xs text-slate-400">📞 {nearestStation.phone_no}</p>
                        )}
                    </div>
                )}
            </aside>



             {/* Map with live tracking */}
            <main className="map-main-area">
                <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* ✅ Show nearest station on map */}
                    {nearestStation && nearestStation.latitude && nearestStation.longitude && (
                        <Marker 
                            position={[nearestStation.latitude, nearestStation.longitude]} 
                            icon={createStationIcon(nearestStation.name, responderType === 'POLICE')}
                        >
                            <Popup>
                                <div className="p-2">
                                    <p className="font-bold text-blue-600">🏛️ {nearestStation.name}</p>
                                    <p className="text-sm">{nearestStation.area_command}</p>
                                    <p className="text-sm">📞 {nearestStation.phone_no}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* ✅ Victim Alerts */}
                    {alerts.map(alert => (
                        <React.Fragment key={alert.id}>
                            <Marker 
                                position={[alert.lat, alert.lon]} 
                                icon={createVictimIcon(alert.username || 'Unknown')}
                            >
                                {/* ... existing popup */}
                            </Marker>

                            {/* ✅ Live Tracking - Police = Green, Amotekun = Blue */}
                            {alert.status === 'HELP_ON_THE_WAY' && myLocation && (
                                <LiveTracking 
                                    userPos={[alert.lat, alert.lon]} 
                                    responderPos={myLocation}
                                    color={responderType === 'POLICE' ? '#22c55e' : '#3b82f6'}
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




































            // {/* --- MAP AREA --- */}
            // <main className="map-main-area">
            //     <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            //         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
            //         {/* ✅ Police/Amotekun Stations */}
            //         {policeStations.map(station => (
            //             <Marker 
            //                 key={station.id} 
            //                 position={[station.latitude || station.lat, station.longitude || station.lon]} 
            //                 icon={createStationIcon(station.name, responderType === 'Police')}
            //             >
            //                 <Popup>
            //                     <div className="p-2 text-slate-900">
            //                         <p className="font-bold border-b pb-1 mb-2 text-blue-600">{station.name}</p>
            //                         <p className="text-sm"><Phone size={12} className="inline" /> {station.phone_no || station.phone}</p>
            //                         <p className="text-sm text-slate-500">{station.area_command}</p>
            //                     </div>
            //                 </Popup>
            //             </Marker>
            //         ))}

            //         {/* ✅ Victim Alerts */}
            //         {alerts.map(alert => (
            //             <React.Fragment key={alert.id}>
            //                 <Marker 
            //                     position={[alert.lat, alert.lon]} 
            //                     icon={createVictimIcon(alert.username || alert.reporter_name || 'Unknown')}
            //                 >
            //                     <Popup>
            //                         <div className="p-2 text-slate-900">
            //                             <p className="font-bold border-b pb-1 mb-2 text-red-600">
            //                                 {alert.username || alert.reporter_name}
            //                             </p>
            //                             <p className="text-sm">Status: {alert.status}</p>
            //                             {alert.assigned_to && (
            //                                 <p className="text-sm text-blue-600">Assigned to: {alert.assigned_to}</p>
            //                             )}
            //                             <button 
            //                                 onClick={(e) => handleClaim(e, alert.id)}
            //                                 disabled={alert.status === 'HELP_ON_THE_WAY' || alert.assigned_to}
            //                                 className="w-full bg-blue-600 text-white text-xs py-1 rounded mt-2 disabled:bg-slate-400"
            //                             >
            //                                 {alert.assigned_to ? `Assigned to ${alert.assigned_to}` : 'Dispatch Unit'}
            //                             </button>
            //                         </div>
            //                     </Popup>
            //                 </Marker>

            //                 {/* Routing */}
            //                 {alert.status === 'HELP_ON_THE_WAY' && alert.responder_lat && (
            //                     <RoutingMachine 
            //                         userPos={[alert.lat, alert.lon]} 
            //                         responderPos={[alert.responder_lat, alert.responder_lon]} 
            //                     />
            //                 )}
            //             </React.Fragment>
            //         ))}
            //     </MapContainer>
            // </main>


















































































































































// import React, { useEffect, useState, useCallback } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import axios from 'axios';
// import 'leaflet/dist/leaflet.css';
// import 'leaflet-routing-machine';
// import { Shield, MapPin, User, CheckCircle, Navigation } from 'lucide-react';
// import '../App.css';


// // Fix for default marker icons not showing up
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// // --- Helper: Real-time Routing Component ---
// const RoutingMachine = ({ userPos, responderPos }) => {
//     const map = useMap();

//     useEffect(() => {
//         if (!map || !userPos || !responderPos) return;

//         const routingControl = L.Routing.control({
//             waypoints: [
//                 L.latLng(responderPos[0], responderPos[1]),
//                 L.latLng(userPos[0], userPos[1])
//             ],
//             lineOptions: { styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] },
//             createMarker: () => null, // We use our own markers
//             addWaypoints: false,
//             routeWhileDragging: false,
//             show: false // Hide the text instructions panel
//         }).addTo(map);

//         return () => map.removeControl(routingControl);
//     }, [map, userPos, responderPos]);

//     return null;
// };

// // --- Helper: Marker with Username Label ---
// const createVictimIcon = (username) => {
//     return new L.DivIcon({
//         html: `
//             <div style="display: flex; flex-direction: column; align-items: center;">
//                 <div style="background: white; color: #ef4444; padding: 2px 8px; border-radius: 12px; 
//                     font-size: 11px; font-weight: bold; border: 2px solid #ef4444; white-space: nowrap;
//                     box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
//                     ${username}
//                 </div>
//                 <img src="https://cdn-icons-png.flaticon.com/512/564/564619.png" style="width: 30px; height: 30px;" />
//             </div>`,
//         className: 'custom-label-icon',
//         iconSize: [30, 42],
//         iconAnchor: [15, 42],
//     });
// };

// const RescueDashboard = ({ responderType }) => {
//     const [alerts, setAlerts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
//     const [myLocation, setMyLocation] = useState(null);





//     // Get Rescuer's current location for routing
//     useEffect(() => {
//         navigator.geolocation.getCurrentPosition(
//             (pos) => setMyLocation([pos.coords.latitude, pos.coords.longitude]),
//             (err) => console.error("Location access denied", err)
//         );
//     }, []);



//     // 1. Wrap fetchAlerts in useCallback so it doesn't change on every render
//     const fetchAlerts = useCallback(async () => {
//         try {
//             // const response = await axios.get('http://localhost:8000/alerts');
//             const response = await axios.get('https://sos-alert-app-backend.onrender.com/alerts');
//             setAlerts(response.data);
//         } catch (err) {
//             // console.error("Error fetching alerts:", err.response?.status === 404 ? "Route not found on backend!" : err.message);
//             console.error("Error fetching alerts:", err);
//         } finally {
//             setLoading(false);
//         }
//     }, []); // Empty dependency array means this function is stable







//     // Fixed WebSocket implementation
//     useEffect(() => {
//         // 1. Initial fetch when component mounts
//         fetchAlerts();
        
//         // 2. Setup WebSocket with error handling and reconnection
//         let ws = null;
//         let reconnectTimer = null;
        
//         const connectWebSocket = () => {
//             try {
//                 // ws = new WebSocket('ws://localhost:8000/ws/alerts');
//                 ws = new WebSocket('ws://sos-alert-app-backend.onrender.com/ws/alerts');

//                 ws.onopen = () => {
//                     console.log("WebSocket Connected ✅");
//                     // Clear any reconnect timer on successful connection
//                     if (reconnectTimer) clearTimeout(reconnectTimer);
//                 };
                
//                 ws.onmessage = (event) => {
//                     try {
//                         const data = JSON.parse(event.data);
//                         const validEvents = ["NEW_SOS", "ALERT_CLAIMED", "USER_CONFIRMED_ARRIVAL", "INCIDENT_RESOLVED"];
                        
//                         if (validEvents.includes(data.event)) {
//                             fetchAlerts();
                            
//                             if (data.event === "NEW_SOS" && data.alert) {
//                                 setMapCenter([data.alert.lat, data.alert.lon]);
//                                 new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
//                                     .play()
//                                     .catch(() => console.log("Audio play blocked"));
//                             }
//                         }
//                     } catch (err) {
//                         console.error("WebSocket message parse error:", err);
//                     }
//                 };
                
//                 ws.onerror = (err) => {
//                     console.error("WebSocket Error:", err);
//                     // Don't close immediately on error, let it try to recover
//                 };
                
//                 ws.onclose = (event) => {
//                     console.log("WebSocket Disconnected, attempting reconnect in 3 seconds...:"+ event, event.reason);
//                     // Attempt to reconnect after 3 seconds
//                     reconnectTimer = setTimeout(() => {
//                         if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
//                             connectWebSocket();
//                         }
//                     }, 3000);
//                 };
//             } catch (err) {
//                 console.error("WebSocket connection error:", err);
//             }
//         };
        
//         // Start WebSocket connection
//         connectWebSocket();
        
//         // 4. Cleanup function
//         return () => {
//             if (reconnectTimer) clearTimeout(reconnectTimer);
//             if (ws && ws.readyState === WebSocket.OPEN) {
//                 console.log("Closing WebSocket 🛑");
//                 ws.close();
//             }
//         };
//     }, [fetchAlerts]);

   

//     const handleClaim = async (e, alertId) => {
//         if (e) {
//             e.preventDefault();
//             e.stopPropagation();
//         }

//         // Check if we have location
//         if (!myLocation) {
//             console.error("Location not available");
//             alert("Please enable location services");
//             return;
//         }

//         try {
//             const payload = {
//                 responder_type: responderType, // Make sure this matches the expected string
//                 responder_lat: myLocation[0],
//                 responder_lon: myLocation[1]
//             };

//             console.log("Sending Payload to backend:", payload);
//             console.log("Alert ID:", alertId);
//             console.log("Location:", myLocation);

//             const response = await axios.patch(
//                 // `http://localhost:8000/alerts/${alertId}/respond`,
//                 `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/respond`,
//                 payload,
//                 {
//                     headers: {
//                         'Content-Type': 'application/json'
//                     }
//                 }
//             );

//             console.log("Claim Successful:", response.data);
//             // Refresh alerts after successful claim
//             fetchAlerts();
            
//         } catch (err) {
//             if (err.response) {
//                 console.error("Backend Error Response:", err.response.data);
//                 console.error("Status Code:", err.response.status);
                
//                 // Show specific error message to user
//                 if (err.response.status === 422) {
//                     const errorDetails = err.response.data.detail;
//                     if (Array.isArray(errorDetails)) {
//                         errorDetails.forEach(detail => {
//                             console.error(`Validation error for ${detail.loc.join('.')}: ${detail.msg}`);
//                         });
//                         alert(`Validation error: ${errorDetails.map(d => d.msg).join(', ')}`);
//                     } else {
//                         alert(`Error: ${JSON.stringify(errorDetails)}`);
//                     }
//                 } else if (err.response.status === 404) {
//                     alert("Alert not found");
//                 } else {
//                     alert(`Error: ${err.response.data.detail || "Something went wrong"}`);
//                 }
//             } else {
//                 console.error("Error claiming alert:", err.message);
//                 alert("Network error. Please check if the backend server is running.");
//             }
//         }
//     };



//     const handleResolve = async (alertId) => {
//         try {
//             // await axios.patch(`http://localhost:8000/alerts/${alertId}/resolve`);
//             await axios.patch(`https://sos-alert-app-backend.onrender.com/alerts/${alertId}/resolve`);
//             fetchAlerts();
//         } catch (err) {
//             console.error("Resolve error:", err);
//         }
//     };

//     if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Initializing Secure Terminal...</div>;
//     //<div className="flex h-screen w-screen bg-slate-900 overflow-hidden font-sans">
//     //<aside className="w-96 bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl z-50">

//     return (
//         <div className="dashboard-wrapper bg-slate-900 font-sans">
//             {/* --- SIDEBAR --- */}
//             <aside className="sidebar-container bg-slate-800 border-r border-slate-700 shadow-2xl">
//                 <div className="p-6 bg-slate-900 flex items-center gap-4 border-b border-slate-700">
//                     <Shield size={40} className="text-red-500" />
//                     <div>
//                         <h1 className="text-xl font-black text-white leading-tight">{responderType}</h1>
//                         <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">Emergency Control</p>
//                     </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                     <h2 className="text-xs font-bold text-slate-500 uppercase px-2">Active Emergencies ({alerts.length})</h2>
                    
//                     {alerts.length === 0 ? (
//                         <div className="py-20 text-center opacity-30 text-white">
//                             <CheckCircle size={48} className="mx-auto mb-2" />
//                             <p>Area Secured</p>
//                         </div>
//                     ) : (
//                         alerts.map(alert => (
//                             <div key={alert.id} className={`p-4 rounded-xl border-l-4 transition-all ${
//                                 alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-700 border-red-500 animate-pulse'
//                             }`}>
//                                 <div className="flex justify-between items-start mb-3">
//                                     <span className="text-[10px] font-mono text-slate-400">#{alert.incident_number}</span>
//                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
//                                         alert.status === 'HELP_ON_THE_WAY' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
//                                     }`}>{alert.status}</span>
//                                 </div>
//                                 <h3 className="text-white font-bold flex items-center gap-2 mb-2">
//                                     <User size={16} className="text-slate-400"/> {alert.username}
//                                 </h3>
                                
//                                 <div className="grid grid-cols-2 gap-2 mt-4">
//                                     <button 
//                                         disabled={alert.status === 'HELP_ON_THE_WAY'}
//                                         onClick={(e) => handleClaim(e, alert.id)}
//                                         className={`py-2 rounded font-bold text-xs uppercase ${
//                                             alert.status === 'HELP_ON_THE_WAY' ? 'bg-slate-600 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
//                                         }`}>
//                                         {alert.status === 'HELP_ON_THE_WAY' ? 'En Route' : 'Attend'}
//                                     </button>
                                    
//                                     <button 
//                                         disabled={!alert.user_confirmed_arrival}
//                                         onClick={() => handleResolve(alert.id)}
//                                         className={`py-2 rounded font-bold text-xs uppercase border ${
//                                             alert.user_confirmed_arrival 
//                                             ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white' 
//                                             : 'border-slate-600 text-slate-600 opacity-50 cursor-not-allowed'
//                                         }`}>
//                                         Resolve
//                                     </button>
//                                 </div>
//                                 {!alert.user_confirmed_arrival && alert.status === 'HELP_ON_THE_WAY' && (
//                                     <p className="text-[10px] text-yellow-500 mt-2 text-center">Waiting for user arrival confirmation...</p>
//                                 )}
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </aside>

//             {/* --- MAP AREA --- */}
//             {/*<main className="flex-1 relative">*/}
//             <main className="map-main-area">
//                 <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
//                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
//                     {alerts.map(alert => (
//                         <React.Fragment key={alert.id}>
//                             <Marker position={[alert.lat, alert.lon]} icon={createVictimIcon(alert.username)}>
//                                 <Popup>
//                                     <div className="p-2 text-slate-900">
//                                         <p className="font-bold border-b pb-1 mb-2 text-red-600">{alert.username}</p>
//                                         <button onClick={(e) => handleClaim(e, alert.id)} className="w-full bg-blue-600 text-white text-xs py-1 rounded">Dispatch Unit</button>
//                                     </div>
//                                 </Popup>
//                             </Marker>

//                             {/* Show Route Line if claimed */}
//                             {alert.status === 'HELP_ON_THE_WAY' && alert.responder_lat && (
//                                 <RoutingMachine 
//                                     userPos={[alert.lat, alert.lon]} 
//                                     responderPos={[alert.responder_lat, alert.responder_lon]} 
//                                 />
//                             )}
//                         </React.Fragment>
//                     ))}
//                 </MapContainer>
//             </main>
//         </div>
//     );
// };

// export default RescueDashboard;