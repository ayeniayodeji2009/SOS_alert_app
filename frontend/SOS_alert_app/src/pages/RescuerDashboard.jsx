import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Shield, MapPin, User, CheckCircle, Navigation, Phone, Target } from 'lucide-react';
import '../App.css';








const responderTypeIdentity = {
    POLICE: {
        name: 'POLICE',
        color: '#3b82f6',
    },
    AMOTEKUN: {
        name: 'AMOTEKUN',
        color: '#22c55e',
    }
};





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






// ✅ Create Rescuer/Station Icon with Name
// const createRescuerIcon = (name, isPolice = true) => {
//     const color = isPolice ? '#3b82f6' : '#22c55e';
//     const iconUrl = isPolice 
//         ? 'https://cdn-icons-png.flaticon.com/512/2991/2991400.png' // Police badge
//         : 'https://cdn-icons-png.flaticon.com/512/2991/2991399.png'; // Amotekun shield
    
//     return new L.DivIcon({
//         html: `
//             <div style="display: flex; flex-direction: column; align-items: center;">
//                 <div style="background: white; color: ${color}; padding: 2px 8px; border-radius: 12px; 
//                     font-size: 10px; font-weight: bold; border: 2px solid ${color}; white-space: nowrap;
//                     box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
//                     🚓 ${name}
//                 </div>
//                 <img src="${iconUrl}" style="width: 30px; height: 30px;" />
//             </div>`,
//         className: 'custom-label-icon',
//         iconSize: [30, 42],
//         iconAnchor: [15, 42],
//     });
// };

// // ✅ Live Tracking Component
// const LiveTracking = ({ userPos, responderPos, color = '#3b82f6' }) => {
//     const map = useMap();
//     const [currentPos, setCurrentPos] = useState(responderPos);
    
//     useEffect(() => {
//         if (!map || !userPos) return;
        
//         // ✅ Simulate movement (in real app, this comes from WebSocket)
//         const interval = setInterval(() => {
//             setCurrentPos(prev => {
//                 if (!prev) return prev;
//                 // Move slightly towards user
//                 const lat = prev[0] + (userPos[0] - prev[0]) * 0.02;
//                 const lng = prev[1] + (userPos[1] - prev[1]) * 0.02;
//                 return [lat, lng];
//             });
//         }, 2000);
        
//         return () => clearInterval(interval);
//     }, [map, userPos]);
    
//     return (
//         <>
//             {/* ✅ Routing line with color */}
//             {currentPos && userPos && (
//                 <Polyline
//                     positions={[currentPos, userPos]}
//                     color={color}
//                     weight={6}
//                     opacity={0.8}
//                     dashArray="10, 10"
//                 />
//             )}
            
//             {/* ✅ Moving rescuer marker */}
//             {currentPos && (
//                 <Marker 
//                     position={currentPos} 
//                     icon={createRescuerIcon('En Route', color === '#3b82f6')}
//                 >
//                     <Popup>
//                         <div className="p-2">
//                             <p className="font-bold">🚓 En Route</p>
//                             <p className="text-sm">Moving to victim...</p>
//                         </div>
//                     </Popup>
//                 </Marker>
//             )}
//         </>
//     );
// };


// RescuerDashboard.jsx - Updated LiveTracking with rescuer name

// ✅ Create Rescuer Icon with Name
const createRescuerIcon = (name, responderType) => {
    const isPolice = responderType === 'POLICE';
    // const color = isPolice ? '#3b82f6' : '#22c55e';
    const color = isPolice ? responderTypeIdentity.POLICE.color : responderTypeIdentity.AMOTEKUN.color;
    const iconUrl = isPolice 
        ? 'https://cdn-icons-png.flaticon.com/512/2991/2991400.png'
        : 'https://cdn-icons-png.flaticon.com/512/2991/2991399.png';
    
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

// ✅ Updated LiveTracking Component
const LiveTracking = ({ userPos, responderPos, responderName, responderType, color = '#3b82f6' }) => {
    const map = useMap();
    const [currentPos, setCurrentPos] = useState(responderPos);
    
    useEffect(() => {
        if (!map || !userPos) return;
        
        // ✅ Update position when responderPos changes
        if (responderPos) {
            setCurrentPos(responderPos);
        }
        
        // ✅ Animate movement if we have both positions
        const interval = setInterval(() => {
            setCurrentPos(prev => {
                if (!prev) return prev;
                // Move slightly towards user (simulate movement)
                const lat = prev[0] + (userPos[0] - prev[0]) * 0.01;
                const lng = prev[1] + (userPos[1] - prev[1]) * 0.01;
                return [lat, lng];
            });
        }, 2000);
        
        return () => clearInterval(interval);
    }, [map, userPos, responderPos]);
    
    return (
        <>
            {/* ✅ Routing line */}
            {currentPos && userPos && (
                <Polyline
                    positions={[currentPos, userPos]}
                    color={color}
                    weight={6}
                    opacity={0.8}
                    dashArray="10, 10"
                />
            )}
            
            {/* ✅ Moving rescuer marker with name */}
            {currentPos && (
                <Marker 
                    position={currentPos} 
                    icon={createRescuerIcon(responderName || 'En Route', responderType)}
                >
                    <Popup>
                        <div className="p-2">
                            <p className="font-bold">🚓 {responderName || 'Responder'}</p>
                            <p className="text-sm">Moving to victim...</p>
                            <p className="text-xs text-gray-500">Type: {responderType}</p>
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




     // ✅ Fetch Police Stations
    const fetchPoliceStations = useCallback(async () => {
        try {
            console.log("📡 Fetching police stations...");
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'https://sos-alert-app-backend.onrender.com/police-posts',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            setWsConnected(true); // ✅ Set WebSocket connected after fetching stations
            console.log("✅ Police stations fetched:", response.data.length);
            setPoliceStations(response.data);
        } catch (err) {
            console.error("Error fetching police stations:", err);
        }
    }, []);

    // ✅ Fetch Active Alerts
    const fetchActiveAlerts = useCallback(async () => {
        try {
            console.log("📡 Fetching active alerts...");
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'https://sos-alert-app-backend.onrender.com/admin/alerts/active',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log("✅ Active alerts fetched:", response.data.length);
            
            // ✅ Filter for this responder type
            // const filteredAlerts = response.data.filter(a => 
            //     !a.claimed_by_type || a.claimed_by_type === responderType
            // );

            // ✅ Show ALL alerts - no filtering except RESOLVED
            const allAlerts = response.data.filter(a => a.status !== 'RESOLVED');
            setAlerts(allAlerts);
        } catch (err) {
            console.error("Error fetching alerts:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Initial data fetch
    useEffect(() => {
        fetchActiveAlerts();
        fetchPoliceStations();
    }, []);






    // // ✅ Get Rescuer's real-time location
    // useEffect(() => {
    //     if (navigator.geolocation) {
    //         watchIdRef.current = navigator.geolocation.watchPosition(
    //             (pos) => {
    //                 setMyLocation([pos.coords.latitude, pos.coords.longitude]);
    //                 // ✅ Update backend with current location
    //                 updateRescuerLocation(pos.coords.latitude, pos.coords.longitude);
    //             },
    //             (err) => console.error("Location error:", err),
    //             { enableHighAccuracy: true, interval: 3000 }
    //         );
    //     }
        
    //     return () => {
    //         if (watchIdRef.current) {
    //             navigator.geolocation.clearWatch(watchIdRef.current);
    //         }
    //     };
    // }, []);

  

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



    // Add to RescuerDashboard.jsx - right after fetching
    console.log("📊 RescuerDashboard - Alerts:", alerts);
    console.log("📊 RescuerDashboard - Stations:", policeStations);




    // RescuerDashboard.jsx - Real GPS tracking
    useEffect(() => {
        if (navigator.geolocation) {
            // ✅ Watch position with high accuracy
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    setMyLocation([lat, lon]);
                    
                    // ✅ Send real location to backend
                    updateRescuerLocation(lat, lon);
                },
                (err) => {
                    console.error("Location error:", err.message);
                    if (err.code === 1) {
                        alert('Please enable location services');
                    }
                },
                { 
                    enableHighAccuracy: true,  // ✅ Use GPS for accuracy
                    timeout: 5000,
                    maximumAge: 2000  // ✅ Update every 2 seconds
                }
            );
        }
        
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);



    // RescuerDashboard.jsx - Add this function
    const handleClaim = async (alertId) => {
        try {
            console.log(`📞 Claiming alert: ${alertId}`);
            const token = localStorage.getItem('token');
            
            const response = await axios.patch(
                `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/respond`,
                {
                    responder_type: responderType,
                    responder_lat: myLocation ? myLocation[0] : null,
                    responder_lon: myLocation ? myLocation[1] : null
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log("✅ Claim successful:", response.data);
            
            // ✅ Update local state to reflect the claim
            setAlerts(prevAlerts => 
                prevAlerts.map(alert => 
                    alert.id === alertId 
                        ? { ...alert, claimed_by_type: responderType, status: 'HELP_ON_THE_WAY' }
                        : alert
                )
            );
            
            // ✅ Refresh alerts from server
            fetchActiveAlerts();
            
            alert(`✅ Alert claimed by ${responderType}!`);
            
        } catch (err) {
            console.error("❌ Error claiming alert:", err);
            alert(`❌ Error: ${err.response?.data?.detail || err.message}`);
        }
    };






    // RescuerDashboard.jsx - Add this function
    const handleResolve = async (alertId) => {
        try {
            console.log(`✅ Resolving alert: ${alertId}`);
            const token = localStorage.getItem('token');
            
            const response = await axios.patch(
                `https://sos-alert-app-backend.onrender.com/alerts/${alertId}/resolve`,
                {
                    responder_type: responderType
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log("✅ Resolve successful:", response.data);
            
            // ✅ Update local state
            setAlerts(prevAlerts => 
                prevAlerts.map(alert => 
                    alert.id === alertId 
                        ? { ...alert, status: 'RESOLVED' }
                        : alert
                )
            );
            
            // ✅ Refresh alerts from server
            fetchActiveAlerts();
            
            alert('✅ Alert resolved successfully!');
            
        } catch (err) {
            console.error("❌ Error resolving alert:", err);
            alert(`❌ Error: ${err.response?.data?.detail || err.message}`);
        }
    };







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




                {/*RescuerDashboard.jsx - Sidebar rendering*/}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase px-2">
                        Active Emergencies ({alerts.filter(a => a.status !== 'RESOLVED').length})
                    </h2>
                    
                    {alerts.filter(a => a.status !== 'RESOLVED').length === 0 ? (
                        <div className="py-20 text-center opacity-30 text-white">
                            <CheckCircle size={48} className="mx-auto mb-2" />
                            <p>No active alerts</p>
                        </div>
                    ) : (
                        alerts.filter(a => a.status !== 'RESOLVED').map(alert => {
                            // ✅ Debug: Log each alert being rendered
                            console.log("🔴 Rendering alert:", alert.id, alert.status, alert.username);
                            
                            return (
                                <div key={alert.id} className="p-4 rounded-xl border-l-4 transition-all bg-slate-700 border-red-500 animate-pulse">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-mono text-slate-400">#{alert.incident_number || alert.id}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500 text-white">
                                            {alert.status}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                                        <User size={16} className="text-slate-400"/> {alert.username || 'Anonymous'}
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-2">
                                        📍 {alert.lat}, {alert.lon}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button 
                                            onClick={() => handleClaim(alert.id)}
                                            disabled={alert.claimed_by_type === responderType || alert.claimed_by_type !== null}
                                            className={`py-2 rounded font-bold text-xs uppercase transition-all ${
                                                alert.claimed_by_type === responderType ? 'bg-blue-600 text-white cursor-not-allowed' :
                                                alert.claimed_by_type !== null ? 'bg-slate-600 text-slate-400 cursor-not-allowed' :
                                                'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                                            }`}
                                        >
                                            {alert.claimed_by_type === responderType ? '✅ En Route' :
                                            alert.claimed_by_type !== null ? `Assigned to ${alert.claimed_by_type}` :
                                            'Attend'}
                                        </button>
                                        
                                        <button 
                                            disabled={alert.claimed_by_type !== responderType || !alert.user_confirmed_arrival}
                                            className={`py-2 rounded font-bold text-xs uppercase transition-all ${
                                                alert.claimed_by_type === responderType && alert.user_confirmed_arrival
                                                    ? 'border border-green-500 text-green-500 hover:bg-green-500 hover:text-white' 
                                                    : 'border-slate-600 text-slate-600 opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                    
                                    {alert.claimed_by_type && alert.claimed_by_type !== responderType && (
                                        <p className="text-[10px] text-yellow-500 mt-2 text-center">
                                            ⏳ Attended to by {alert.claimed_by_type}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>






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
                                    responderName={alert.claimed_by_name || 'Responder'}
                                    responderType={alert.claimed_by_type || responderType}
                                    color={responderType === 'POLICE' ? responderTypeIdentity.POLICE.color : responderTypeIdentity.AMOTEKUN.color}
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