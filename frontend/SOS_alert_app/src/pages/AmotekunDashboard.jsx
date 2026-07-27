import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { ShieldCheck, Navigation, User, Phone, CheckCircle } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';

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

// ✅ Create Amotekun Station Icon
const createStationIcon = (stationName) => {
    return new L.DivIcon({
        html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="background: white; color: #16a34a; padding: 2px 8px; border-radius: 12px; 
                    font-size: 10px; font-weight: bold; border: 2px solid #16a34a; white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
                    ${stationName}
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/2991/2991399.png" style="width: 30px; height: 30px;" />
            </div>`,
        className: 'custom-label-icon',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
    });
};

const AmotekunDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [amotekunStations, setAmotekunStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  const [mapCenter] = useState([7.3775, 3.9470]); // Ibadan HQ
  const token = localStorage.getItem('token');

  // ✅ Fetch Amotekun Stations (you'll need to add these to your database)
  const fetchAmotekunStations = useCallback(async () => {
    try {
      // If you have a separate Amotekun stations endpoint
      // For now, we'll use police posts and filter or use a different endpoint
      const response = await api.get('/police-posts');
      // You can filter or add a separate Amotekun stations table
      setAmotekunStations(response.data);
    } catch (err) {
      console.error("Error fetching Amotekun stations:", err);
    }
  }, []);

  // ✅ Fetch Active Alerts (Amotekun only)
  const fetchActiveAlerts = useCallback(async () => {
    try {
      const response = await api.get('/admin/alerts/active');
      // Filter for AMOTEKUN only
      const amotekunAlerts = response.data.filter(a => 
        !a.assigned_to || a.assigned_to === 'AMOTEKUN' || a.assigned_to_role === 'AMOTEKUN'
      );
      // Filter out resolved and pending
      const activeAlerts = amotekunAlerts.filter(a => a.status !== 'RESOLVED');
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
        responder_type: 'AMOTEKUN'
      });
      
      // ✅ Optimistic update
      setAlerts(prev => 
        prev.map(a => 
          a.id === alertId 
            ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: 'AMOTEKUN' }
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
    
    // ✅ Only AMOTEKUN can resolve AMOTEKUN-assigned alerts
    if (alert?.assigned_to !== 'AMOTEKUN' && alert?.assigned_to_role !== 'AMOTEKUN') {
      alert('❌ This alert is not assigned to AMOTEKUN');
      return;
    }
    
    if (!alert?.user_confirmed_arrival) {
      alert('⚠️ Waiting for user to confirm arrival');
      return;
    }
    
    setLoadingActions(prev => ({ ...prev, [`resolve_${alertId}`]: true }));
    
    try {
      await api.patch(`/alerts/${alertId}/resolve`, {
        responder_type: 'AMOTEKUN'
      });
      
      // ✅ Optimistic update
      setAlerts(prev => 
        prev.map(a => 
          a.id === alertId 
            ? { ...a, status: 'RESOLVED', resolved_by: 'AMOTEKUN' }
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
            console.log("🔌 AmotekunDashboard WebSocket Connected");
            setWsConnected(true);
            
            // ✅ Authenticate
            if (token) {
              ws.send(JSON.stringify({
                type: 'auth',
                token: token,
                role: 'AMOTEKUN'
              }));
            }
          }
          if (reconnectTimer) clearTimeout(reconnectTimer);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 AmotekunDashboard WebSocket:", data);
            
            // ✅ Handle all event types
            switch(data.type || data.event) {
              case 'new_alert':
              case 'NEW_SOS':
                // Only add AMOTEKUN alerts
                if (!data.alert?.assigned_to || data.alert?.assigned_to === 'AMOTEKUN') {
                  setAlerts(prev => [data.alert || data.payload, ...prev]);
                  new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3')
                    .play()
                    .catch(() => console.log("Audio play blocked"));
                }
                break;

              case 'alert_assigned':
              case 'ALERT_CLAIMED':
                const assignedId = data.alert_id || data.payload?.id;
                // Only update if assigned to AMOTEKUN
                if (data.responder_type === 'AMOTEKUN' || data.payload?.assigned_to === 'AMOTEKUN') {
                  setAlerts(prev => 
                    prev.map(a => 
                      a.id === assignedId
                        ? { ...a, status: 'HELP_ON_THE_WAY', assigned_to: 'AMOTEKUN' }
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
    fetchAmotekunStations();
    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounting");
      }
    };
  }, [fetchActiveAlerts, fetchAmotekunStations, token]);

  if (loading) {
    return (
      <div className="flex h-screen bg-emerald-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Amotekun Dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">
            WebSocket: {wsConnected ? "🟢 Connected" : "⏳ Connecting..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white p-4 flex justify-between shadow-lg items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck /> Amotekun Corps Command
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {wsConnected ? "🟢 Live" : "🔴 Offline"}
          </span>
          <span className="text-sm bg-emerald-600 px-3 py-1 rounded-full">
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
                const isAssignedToAmotekun = alert.assigned_to === 'AMOTEKUN' || alert.assigned_to_role === 'AMOTEKUN';
                const isAssigned = alert.assigned_to && alert.assigned_to !== 'AMOTEKUN';
                
                return (
                  <Motion.div 
                    key={alert.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`mb-4 p-4 border-l-4 shadow rounded bg-white ${
                      alert.status === 'HELP_ON_THE_WAY' 
                        ? 'border-emerald-500' 
                        : 'border-red-600'
                    }`}
                  >
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>#{alert.id}</span>
                      <span className={`font-bold ${
                        alert.status === 'HELP_ON_THE_WAY' ? 'text-emerald-500' : 'text-red-500'
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
                              ? 'bg-emerald-100 text-emerald-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
                        disabled={!isAssignedToAmotekun || !alert.user_confirmed_arrival || loadingActions[`resolve_${alert.id}`]}
                        className={`py-2 rounded text-sm font-bold border ${
                          isAssignedToAmotekun && alert.user_confirmed_arrival
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
          <MapContainer center={mapCenter} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* ✅ Amotekun Stations */}
            {amotekunStations.map(station => (
              station.latitude && station.longitude && (
                <Marker 
                  key={station.id} 
                  position={[station.latitude, station.longitude]} 
                  icon={createStationIcon(station.name)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-emerald-600">{station.name}</h3>
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
                        <span className="text-emerald-600">Assigned to: {alert.assigned_to}</span>
                      )}
                      {alert.user_confirmed_arrival && (
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle size={14} /> User arrived
                        </span>
                      )}
                      <button 
                        onClick={() => handleClaim(alert.id)}
                        disabled={alert.status === 'HELP_ON_THE_WAY' || alert.assigned_to}
                        className="w-full bg-emerald-600 text-white text-xs py-1 rounded mt-2 disabled:bg-gray-400"
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

export default AmotekunDashboard;




















































































// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
// import { ShieldCheck, Navigation } from 'lucide-react';
// import api from '../api';
// import 'leaflet/dist/leaflet.css';

// const AmotekunDashboard = () => {
//   const [alerts, setAlerts] = useState([]);

//   useEffect(() => {
//     const fetchAlerts = async () => {
//       const res = await api.get('/admin/alerts/active');
//       // Filter for PENDING alerts only
//       setAlerts(res.data.filter(a => a.status === 'PENDING' && a.latitude));
//     };
//     fetchAlerts();

//     // let socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');
//     let socket = new WebSocket('ws://sos-alert-app-backend.onrender.com/ws/alerts');
//     socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.event === "ALERT_CLAIMED" && data.claimed_by === "POLICE") {
//         setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
//       }
//     };
//     return () => socket.close();
//   }, []);

//   return (
//     <div className="flex flex-col h-screen bg-emerald-50">
//       <header className="bg-emerald-800 text-white p-4 flex justify-between">
//         <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck /> Amotekun Corps</h1>
//       </header>
//       <div className="flex flex-1 overflow-hidden">
//         <div className="w-1/4 p-4 overflow-y-auto border-r bg-white">
//           {alerts.map(alert => (
//             <div key={alert.id} className="mb-4 p-4 border-l-4 border-emerald-600 shadow bg-white rounded">
//               <h3 className="font-bold">{alert.username}</h3>
//               <p className="text-xs text-gray-500 mb-2">{alert.incident_number}</p>
//               <button className="w-full bg-emerald-600 text-white py-2 rounded text-sm font-bold">Deploy Unit</button>
//             </div>
//           ))}
//         </div>
//         <div className="flex-1">
//           {/* Default to Ibadan for Amotekun HQ */}
//           <MapContainer center={[7.3775, 3.9470]} zoom={9} style={{ height: '100%', width: '100%' }}>
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//             {alerts.map(alert => (
//                <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
//                  <Tooltip permanent direction="top">{alert.username}</Tooltip>
//                </Marker>
//             ))}
//           </MapContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AmotekunDashboard;


























// import React, { useState, useEffect } from 'react';
// import { ShieldCheck, MapPin, Navigation } from 'lucide-react';
// import { motion as Motion, AnimatePresence } from 'framer-motion';
// import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
// import api from '../api';
// import 'leaflet/dist/leaflet.css';






// const AmotekunDashboard = () => {
//   const [alerts, setAlerts] = useState([]);

//   useEffect(() => {
//     const fetchAlerts = async () => {
//       const response = await api.get('/admin/alerts/active');
//       // Show PENDING or those claimed specifically by AMOTEKUN
//       setAlerts(response.data.filter(a => a.status === 'PENDING' || a.claimed_by_type === 'AMOTEKUN'));
//     };
//     fetchAlerts();

//     const socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');
//     socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.event === "ALERT_CLAIMED" && data.claimed_by === "POLICE") {
//         setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
//       } else if (data.event === "NEW_SOS") {
//         setAlerts(prev => [...prev, data.alert]);
//       }
//     };
//     return () => socket.close();
//   }, []);

//   const handleClaim = async (id) => {
//     try {
//       await api.patch(`/alerts/${id}/claim`, { responder_type: 'AMOTEKUN' });
//       setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'HELP_ON_THE_WAY' } : a));
//     } catch { alert("Police already claimed this."); }
//   };

//   console.log("Amotekun Dashboard - Active Alerts:", alerts);
//   return (
//     <div className="dashboard-container bg-emerald-50 min-h-screen">
//       <header className="bg-emerald-800 text-white p-6 shadow-xl flex justify-between items-center">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <ShieldCheck size={32} /> Amotekun Corps Command
//         </h1>
//         <div className="px-4 py-1 bg-emerald-600 rounded-full text-sm">Western Nigeria Security Network</div>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-80px)]">
//         <main className="p-6 overflow-y-auto lg:col-span-1 border-r border-emerald-200">
//           <h2 className="text-emerald-700 font-bold mb-4 uppercase text-sm">Pending Field Operations</h2>
//           <AnimatePresence>
//             {alerts.map((alert) => (
//               <Motion.div key={alert.id} layout className="mb-4 p-4 rounded-xl shadow-md border-l-8 bg-white border-emerald-600">
//                 <div className="flex justify-between mb-2">
//                   <span className="text-xs font-mono text-gray-400">{alert.incident_number}</span>
//                 </div>
//                 <h3 className="font-bold text-lg">{alert.username}</h3>
//                 <p className="text-sm text-gray-500 mb-4 flex items-center gap-1"><MapPin size={14}/> {alert.location_name}</p>
//                 <button 
//                   disabled={alert.status !== 'PENDING'}
//                   onClick={() => handleClaim(alert.id)} 
//                   className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${alert.status === 'PENDING' ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'}`}
//                 >
//                   <Navigation size={18} /> {alert.status === 'PENDING' ? 'Deploy Amotekun' : 'In Progress'}
//                 </button>
//               </Motion.div>
//             ))}
//           </AnimatePresence>
//         </main>

//         <div className="lg:col-span-2">
//           {/* <MapContainer center={[7.3775, 3.9470]} zoom={10} style={{ height: '100%', width: '100%' }}>
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//             {alerts.map(alert => (
//               <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
//                 <Tooltip permanent direction="top">{alert.username} | {alert.incident_number}</Tooltip>
//               </Marker>
//             ))}
//           </MapContainer> */}
//           <MapContainer center={[6.5244, 3.3792]} zoom={11} style={{ height: '100%', width: '100%' }}>
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
//           {alerts
//             .filter(alert => alert.latitude !== undefined && alert.longitude !== undefined)
//             .map((alert) => (
//               <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
//                 <Tooltip permanent direction="top" offset={[0, -20]}>
//                   <b>{alert.username}</b>
//                 </Tooltip>
//                 <Popup>
//                   <p>ID: {alert.incident_number}</p>
//                   <p>Status: {alert.status}</p>
//                 </Popup>
//               </Marker>
//           ))}
//         </MapContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AmotekunDashboard;