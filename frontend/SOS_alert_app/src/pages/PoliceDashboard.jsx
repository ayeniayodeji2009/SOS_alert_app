import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { ShieldAlert, MapPin, Navigation, CheckCircle, Phone, User } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ✅ Create Victim Icon with Username
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

// ✅ Create Station Icon
const createStationIcon = (stationName) => {
    return new L.DivIcon({
        html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="background: white; color: #2563eb; padding: 2px 8px; border-radius: 12px; 
                    font-size: 10px; font-weight: bold; border: 2px solid #2563eb; white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
                    ${stationName}
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/2991/2991400.png" style="width: 30px; height: 30px;" />
            </div>`,
        className: 'custom-label-icon',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
    });
};

const PoliceDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  const [mapCenter] = useState([6.5244, 3.3792]);
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const token = localStorage.getItem('token');

  // ✅ Fetch Police Stations
  const fetchPoliceStations = useCallback(async () => {
    try {
      const response = await api.get('/police-posts');
      setPoliceStations(response.data);
    } catch (err) {
      console.error("Error fetching police stations:", err);
    }
  }, []);

  // ✅ Fetch Active Alerts
  const fetchActiveAlerts = useCallback(async () => {
    try {
      const response = await api.get('/admin/alerts/active');
      // Filter for POLICE only
      const policeAlerts = response.data.filter(a => 
        !a.assigned_to || a.assigned_to === 'POLICE' || a.assigned_to_role === 'POLICE'
      );
      // Filter out resolved
      const activeAlerts = policeAlerts.filter(a => a.status !== 'RESOLVED');
      setAlerts(activeAlerts);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Handle Claim Alert
  const handleClaim = async (alertId) => {
    setLoadingActions(prev => ({ ...prev, [alertId]: true }));
    
    try {
      await api.patch(`/alerts/${alertId}/respond`, {
        responder_type: 'POLICE'
      });
      
      // ✅ Optimistic update
      setAlerts(prev => 
        prev.map(a => 
          a.id === alertId 
            ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: 'POLICE' }
            : a
        )
      );
      
      // ✅ Refresh from server
      await fetchActiveAlerts();
      
    } catch (err) {
      console.error("Claim failed:", err);
      alert(`❌ ${err.response?.data?.detail || 'Failed to claim alert'}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [alertId]: false }));
    }
  };

  // ✅ Handle Resolve Alert
  const handleResolve = async (alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    
    // ✅ Only POLICE can resolve POLICE-assigned alerts
    if (alert?.assigned_to !== 'POLICE' && alert?.assigned_to_role !== 'POLICE') {
      alert('❌ This alert is not assigned to POLICE');
      return;
    }
    
    if (!alert?.user_confirmed_arrival) {
      alert('⚠️ Waiting for user to confirm arrival');
      return;
    }
    
    setLoadingActions(prev => ({ ...prev, [`resolve_${alertId}`]: true }));
    
    try {
      await api.patch(`/alerts/${alertId}/resolve`, {
        responder_type: 'POLICE'
      });
      
      // ✅ Optimistic update
      setAlerts(prev => 
        prev.map(a => 
          a.id === alertId 
            ? { ...a, status: 'RESOLVED', resolved_by: 'POLICE' }
            : a
        )
      );
      
      await fetchActiveAlerts();
      
    } catch (err) {
      console.error("Resolve failed:", err);
      alert(`❌ ${err.response?.data?.detail || 'Failed to resolve alert'}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`resolve_${alertId}`]: false }));
    }
  };

  // ✅ WebSocket Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let isMounted = true;

    const connectWebSocket = () => {
      if (!isMounted) return;
      
      try {
        // ✅ Use wss:// for Render
        ws = new WebSocket('wss://sos-alert-app-backend.onrender.com/ws/alerts');

        ws.onopen = () => {
          if (isMounted) {
            console.log("🔌 PoliceDashboard WebSocket Connected");
            setWsConnected(true);
            
            // ✅ Authenticate
            if (token) {
              ws.send(JSON.stringify({
                type: 'auth',
                token: token,
                role: 'POLICE'
              }));
            }
          }
          if (reconnectTimer) clearTimeout(reconnectTimer);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 PoliceDashboard WebSocket:", data);
            
            // ✅ Handle all event types
            switch(data.type || data.event) {
              case 'new_alert':
              case 'NEW_SOS':
                // Only add POLICE alerts
                if (!data.alert?.assigned_to || data.alert?.assigned_to === 'POLICE') {
                  setAlerts(prev => [data.alert || data.payload, ...prev]);
                  new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
                    .play()
                    .catch(() => console.log("Audio play blocked"));
                }
                break;

              case 'alert_assigned':
              case 'ALERT_CLAIMED':
                const assignedId = data.alert_id || data.payload?.id;
                // Only update if assigned to POLICE
                if (data.responder_type === 'POLICE' || data.payload?.assigned_to === 'POLICE') {
                  setAlerts(prev => 
                    prev.map(a => 
                      a.id === assignedId
                        ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: 'POLICE' }
                        : a
                    )
                  );
                }
                break;

              case 'alert_resolved':
              case 'INCIDENT_RESOLVED':
                const resolvedId = data.alert_id || data.payload?.id;
                setAlerts(prev => 
                  prev.map(a => 
                    a.id === resolvedId
                      ? { ...a, status: 'RESOLVED', resolved_by: data.responder_type || data.payload?.resolved_by }
                      : a
                  )
                );
                break;

              case 'user_confirmed':
              case 'USER_CONFIRMED_ARRIVAL':
                const confirmedId = data.alert_id || data.payload?.id;
                setAlerts(prev => 
                  prev.map(a => 
                    a.id === confirmedId
                      ? { ...a, user_confirmed_arrival: true }
                      : a
                  )
                );
                break;

              default:
                // If full alert object, refresh
                if (data.id) {
                  fetchActiveAlerts();
                }
            }
          } catch (err) {
            console.error("WebSocket parse error:", err);
          }
        };

        ws.onerror = (err) => {
          console.error("WebSocket Error:", err);
          setWsConnected(false);
        };

        ws.onclose = (event) => {
          if (isMounted) {
            console.log(`⚠️ WebSocket Disconnected (${event.code})`);
            setWsConnected(false);
            if (event.code !== 1000) {
              reconnectTimer = setTimeout(connectWebSocket, 5000);
            }
          }
        };

      } catch (err) {
        console.error("WebSocket connection error:", err);
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      }
    };

    // Initial data fetch
    fetchActiveAlerts();
    fetchPoliceStations();
    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounting");
      }
    };
  }, [fetchActiveAlerts, fetchPoliceStations, token]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Police Dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">
            WebSocket: {wsConnected ? "🟢 Connected" : "⏳ Connecting..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-800 text-white p-4 flex justify-between shadow-lg items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert /> NPF Command Center
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {wsConnected ? "🟢 Live" : "🔴 Offline"}
          </span>
          <span className="text-sm bg-red-600 px-3 py-1 rounded-full">
            {alerts.filter(a => a.status !== 'RESOLVED').length} Active
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Alerts Sidebar */}
        <div className="w-1/3 p-4 overflow-y-auto border-r bg-white">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
            Active Emergencies ({alerts.filter(a => a.status !== 'RESOLVED').length})
          </h2>
          
          <AnimatePresence>
            {alerts.filter(a => a.status !== 'RESOLVED').length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>Area Secured</p>
              </div>
            ) : (
              alerts.filter(a => a.status !== 'RESOLVED').map(alert => {
                const isAssignedToPolice = alert.assigned_to === 'POLICE' || alert.assigned_to_role === 'POLICE';
                const isAssigned = alert.assigned_to && alert.assigned_to !== 'POLICE';
                
                return (
                  <Motion.div 
                    key={alert.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`mb-4 p-4 border-l-4 shadow rounded bg-white ${
                      alert.status === 'HELP_ON_THE_WAY' 
                        ? 'border-blue-500' 
                        : 'border-red-600'
                    }`}
                  >
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>#{alert.id}</span>
                      <span className={`font-bold ${
                        alert.status === 'HELP_ON_THE_WAY' ? 'text-blue-500' : 'text-red-500'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <h3 className="font-bold flex items-center gap-2">
                      <User size={14} /> {alert.username || 'Anonymous'}
                    </h3>
                    {alert.assigned_to && (
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned to: <span className="font-bold">{alert.assigned_to}</span>
                      </p>
                    )}
                    {alert.user_confirmed_arrival && (
                      <p className="text-xs text-green-500 mt-1">
                        ✅ User arrived
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button 
                        onClick={() => handleClaim(alert.id)}
                        disabled={isAssigned || alert.status === 'HELP_ON_THE_WAY' || loadingActions[alert.id]}
                        className={`py-2 rounded text-sm font-bold flex items-center justify-center gap-2 ${
                          isAssigned 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : alert.status === 'HELP_ON_THE_WAY'
                              ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {loadingActions[alert.id] ? (
                          '⏳...'
                        ) : isAssigned ? (
                          `Assigned to ${alert.assigned_to}`
                        ) : alert.status === 'HELP_ON_THE_WAY' ? (
                          '🚑 En Route'
                        ) : (
                          <><Navigation size={14} /> Attend</>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleResolve(alert.id)}
                        disabled={!isAssignedToPolice || !alert.user_confirmed_arrival || loadingActions[`resolve_${alert.id}`]}
                        className={`py-2 rounded text-sm font-bold border ${
                          isAssignedToPolice && alert.user_confirmed_arrival
                            ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white'
                            : 'border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {loadingActions[`resolve_${alert.id}`] ? '⏳...' : 'Resolve'}
                      </button>
                    </div>
                  </Motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* ✅ Police Stations */}
            {policeStations.map(station => (
              station.latitude && station.longitude && (
                <Marker 
                  key={station.id} 
                  position={[station.latitude, station.longitude]} 
                  icon={createStationIcon(station.name)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-blue-600">{station.name}</h3>
                      <p className="text-sm">{station.area_command}</p>
                      {station.phone_no && (
                        <p className="text-sm"><Phone size={12} /> {station.phone_no}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* ✅ Victim Alerts */}
            {alerts.map(alert => (
              alert.latitude && alert.longitude && (
                <Marker 
                  key={alert.id} 
                  position={[alert.latitude, alert.longitude]} 
                  icon={createVictimIcon(alert.username || 'Unknown')}
                >
                  <Tooltip permanent direction="top" offset={[0, -20]} opacity={1}>
                    <div className="font-bold text-red-700">{alert.username || 'Unknown'}</div>
                  </Tooltip>
                  <Popup>
                    <div className="p-2">
                      <strong>{alert.username || 'Unknown'}</strong><br/>
                      ID: #{alert.id}<br/>
                      Status: {alert.status}<br/>
                      {alert.assigned_to && (
                        <span className="text-blue-600">Assigned to: {alert.assigned_to}</span>
                      )}
                      {alert.user_confirmed_arrival && (
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle size={14} /> User arrived
                        </span>
                      )}
                      <button 
                        onClick={() => handleClaim(alert.id)}
                        disabled={alert.status === 'HELP_ON_THE_WAY' || alert.assigned_to}
                        className="w-full bg-red-600 text-white text-xs py-1 rounded mt-2 disabled:bg-gray-400"
                      >
                        {alert.assigned_to ? `Assigned to ${alert.assigned_to}` : 'Dispatch Unit'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;

















































































































// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
// import { ShieldAlert, MapPin, Navigation } from 'lucide-react';
// import { motion as Motion, AnimatePresence } from 'framer-motion';
// import 'leaflet/dist/leaflet.css';
// import api from '../api';

// const PoliceDashboard = () => {
//   const [alerts, setAlerts] = useState([]);

//   useEffect(() => {
//     // 1. Fetch initial data safely
//     const fetchInitialData = async () => {
//       try {
//         const response = await api.get('/admin/alerts/active');
//         // Critical: Only set alerts that have valid coordinates to prevent Leaflet crash
//         const validAlerts = response.data.filter(a => a.latitude && a.longitude);
//         setAlerts(validAlerts);
//       } catch (err) {
//         console.error("Initial fetch failed", err);
//       }
//     };
//     fetchInitialData();

//     // 2. WebSocket with safety check
//     let socket = new WebSocket('ws://sos-alert-app-backend.onrender.com/ws/alerts');
//     // let socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');
//     //https://sos-alert-app-backend.onrender.com

//     socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.event === "NEW_SOS" && data.alert.latitude) {
//         setAlerts(prev => [...prev, data.alert]);
//       } else if (data.event === "ALERT_CLAIMED" && data.claimed_by === "AMOTEKUN") {
//         // Remove from list if Amotekun takes it
//         setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
//       }
//     };

//     socket.onclose = () => console.log("WS Closed");

//     return () => {
//       if (socket.readyState === 1) socket.close();
//     };
//   }, []);

//   const handleClaim = async (id) => {
//     try {
//       await api.patch(`/alerts/${id}/claim`, { responder_type: 'POLICE' });
//       setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ATTENDING' } : a));
//     } catch (err) {
//       console.error("Claim failed", err);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-100">
//       <header className="bg-red-800 text-white p-4 flex justify-between shadow-lg">
//         <h1 className="text-xl font-bold flex items-center gap-2"><ShieldAlert /> NPF Command</h1>
//         <div className="text-sm bg-red-600 px-3 py-1 rounded-full">Live Connection</div>
//       </header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Alerts Sidebar */}
//         <div className="w-1/3 p-4 overflow-y-auto border-r bg-white">
//           <AnimatePresence>
//             {alerts.map(alert => (
//               <Motion.div 
//                 key={alert.id} 
//                 initial={{ opacity: 0, x: -20 }} 
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: 20 }}
//                 className="mb-4 p-4 border-l-4 border-red-600 shadow rounded bg-white"
//               >
//                 <div className="flex justify-between text-xs text-gray-400 mb-1">
//                   <span>{alert.incident_number}</span>
//                   <span className="font-bold text-red-500">{alert.status}</span>
//                 </div>
//                 <h3 className="font-bold">{alert.username}</h3>
//                 <button 
//                   onClick={() => handleClaim(alert.id)}
//                   className="mt-2 w-full bg-red-600 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2"
//                 >
//                   <Navigation size={16} /> Help on the way
//                 </button>
//               </Motion.div>
//             ))}
//           </AnimatePresence>
//         </div>

//         {/* The Map with Safety Checks */}
//         <div className="flex-1 relative">
//           <MapContainer center={[6.5244, 3.3792]} zoom={10} style={{ height: '100%', width: '100%' }}>
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//             {alerts.map(alert => (
//               // Ensure coordinates exist before rendering Marker
//               alert.latitude && alert.longitude && (
//                 <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
//                   <Tooltip permanent direction="top" offset={[0, -20]} opacity={1}>
//                     <div className="font-bold text-red-700">{alert.username}</div>
//                   </Tooltip>
//                   <Popup>
//                     <strong>{alert.username}</strong><br/>
//                     ID: {alert.incident_number}
//                   </Popup>
//                 </Marker>
//               )
//             ))}
//           </MapContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PoliceDashboard;







































































































// import React, { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import api from '../api';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';


// // Fix for Leaflet marker icons not showing in React
// import markerIcon from 'leaflet/dist/images/marker-icon.png';
// import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// import '../App.css';


// let DefaultIcon = L.icon({
//     iconUrl: markerIcon,
//     shadowUrl: markerShadow,
//     iconSize: [25, 41],
//     iconAnchor: [12, 41]
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// // Helper to auto-center map when a new alert comes in
// function ChangeView({ center }) {
//     const map = useMap();
//     map.setView(center, map.getZoom());
//     return null;
// }

// const PoliceDashboard = () => {
//     const [alerts, setAlerts] = useState([]);
//     const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]); // Default: Lagos

//     useEffect(() => {
//         // 1. Fetch current active alerts on load
//         api.get('/admin/alerts/active').then(res => setAlerts(res.data));

//         // 2. Setup WebSocket for real-time alerts
//         const ws = new WebSocket('ws://127.0.0.1:8000/ws/alerts');

//         ws.onmessage = (event) => {
//             const newAlert = JSON.parse(event.data);
//             setAlerts(prev => [newAlert, ...prev]);
//             setMapCenter([newAlert.lat, newAlert.lon]);
            
//             // Play Siren Notification
//             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
//             audio.play().catch(() => console.log("Click map to enable audio"));
//         };

//         return () => ws.close();
//     }, []);

//     const handleStatusUpdate = async (id, newStatus) => {
//         try {
//             await api.patch(`/admin/alerts/${id}`, { status: newStatus });
//             // Remove from list if resolved, otherwise update UI
//             if (newStatus === 'RESOLVED') {
//                 setAlerts(prev => prev.filter(a => a.id !== id));
//             } else {
//                 setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
//             }
//         } catch (err) {
//             alert("Failed to update status: " + err.message);
//         }
//     };

//     return (
//         <div style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
//             {/* Sidebar: Alert List */}
//             <div style={{ width: '350px', overflowY: 'auto', padding: '20px', background: '#fff' }}>
//                 <h2>Live Emergencies</h2>
//                 {alerts.length === 0 && <p>No active alerts in Lagos.</p>}
//                 {alerts.map(alert => (
//                     <div key={alert.id} className={`alert-card ${alert.status.toLowerCase()}`}>
//                         <h4>INCIDENT #{alert.id}</h4>
//                         <p>User ID: {alert.user_id}</p>
//                         <p>Status: <strong>{alert.status}</strong></p>
//                         <div className="btn-group">
//                             <button onClick={() => handleStatusUpdate(alert.id, 'DISPATCHED')} className="btn-dispatch">Dispatch</button>
//                             <button onClick={() => handleStatusUpdate(alert.id, 'RESOLVED')} className="btn-resolve">Resolve</button>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {/* Main: Map View */}
//             <div style={{ flex: 1, position: 'relative' }}>
//                 <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
//                     <ChangeView center={mapCenter} />
//                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                     {alerts.map(a => (
//                         <Marker key={a.id} position={[a.lat, a.lon]}>
//                             <Popup>
//                                 <strong>EMERGENCY</strong> <br />
//                                 Lat: {a.lat.toFixed(4)}, Lon: {a.lon.toFixed(4)}
//                             </Popup>
//                         </Marker>
//                     ))}
//                 </MapContainer>
//             </div>
//         </div>
//     );
// };

// export default PoliceDashboard;