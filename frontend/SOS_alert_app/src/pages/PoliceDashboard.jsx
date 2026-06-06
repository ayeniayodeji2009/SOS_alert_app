import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { ShieldAlert, MapPin, Navigation } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import api from '../api';

const PoliceDashboard = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // 1. Fetch initial data safely
    const fetchInitialData = async () => {
      try {
        const response = await api.get('/admin/alerts/active');
        // Critical: Only set alerts that have valid coordinates to prevent Leaflet crash
        const validAlerts = response.data.filter(a => a.latitude && a.longitude);
        setAlerts(validAlerts);
      } catch (err) {
        console.error("Initial fetch failed", err);
      }
    };
    fetchInitialData();

    // 2. WebSocket with safety check
    let socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "NEW_SOS" && data.alert.latitude) {
        setAlerts(prev => [...prev, data.alert]);
      } else if (data.event === "ALERT_CLAIMED" && data.claimed_by === "AMOTEKUN") {
        // Remove from list if Amotekun takes it
        setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
      }
    };

    socket.onclose = () => console.log("WS Closed");

    return () => {
      if (socket.readyState === 1) socket.close();
    };
  }, []);

  const handleClaim = async (id) => {
    try {
      await api.patch(`/alerts/${id}/claim`, { responder_type: 'POLICE' });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ATTENDING' } : a));
    } catch (err) {
      console.error("Claim failed", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-red-800 text-white p-4 flex justify-between shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2"><ShieldAlert /> NPF Command</h1>
        <div className="text-sm bg-red-600 px-3 py-1 rounded-full">Live Connection</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Alerts Sidebar */}
        <div className="w-1/3 p-4 overflow-y-auto border-r bg-white">
          <AnimatePresence>
            {alerts.map(alert => (
              <Motion.div 
                key={alert.id} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mb-4 p-4 border-l-4 border-red-600 shadow rounded bg-white"
              >
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{alert.incident_number}</span>
                  <span className="font-bold text-red-500">{alert.status}</span>
                </div>
                <h3 className="font-bold">{alert.username}</h3>
                <button 
                  onClick={() => handleClaim(alert.id)}
                  className="mt-2 w-full bg-red-600 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Navigation size={16} /> Help on the way
                </button>
              </Motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* The Map with Safety Checks */}
        <div className="flex-1 relative">
          <MapContainer center={[6.5244, 3.3792]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {alerts.map(alert => (
              // Ensure coordinates exist before rendering Marker
              alert.latitude && alert.longitude && (
                <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
                  <Tooltip permanent direction="top" offset={[0, -20]} opacity={1}>
                    <div className="font-bold text-red-700">{alert.username}</div>
                  </Tooltip>
                  <Popup>
                    <strong>{alert.username}</strong><br/>
                    ID: {alert.incident_number}
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