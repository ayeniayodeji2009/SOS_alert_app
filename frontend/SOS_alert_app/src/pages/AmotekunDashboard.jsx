import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import { ShieldCheck, Navigation } from 'lucide-react';
import api from '../api';
import 'leaflet/dist/leaflet.css';

const AmotekunDashboard = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await api.get('/admin/alerts/active');
      // Filter for PENDING alerts only
      setAlerts(res.data.filter(a => a.status === 'PENDING' && a.latitude));
    };
    fetchAlerts();

    let socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "ALERT_CLAIMED" && data.claimed_by === "POLICE") {
        setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
      }
    };
    return () => socket.close();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-emerald-50">
      <header className="bg-emerald-800 text-white p-4 flex justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck /> Amotekun Corps</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 p-4 overflow-y-auto border-r bg-white">
          {alerts.map(alert => (
            <div key={alert.id} className="mb-4 p-4 border-l-4 border-emerald-600 shadow bg-white rounded">
              <h3 className="font-bold">{alert.username}</h3>
              <p className="text-xs text-gray-500 mb-2">{alert.incident_number}</p>
              <button className="w-full bg-emerald-600 text-white py-2 rounded text-sm font-bold">Deploy Unit</button>
            </div>
          ))}
        </div>
        <div className="flex-1">
          {/* Default to Ibadan for Amotekun HQ */}
          <MapContainer center={[7.3775, 3.9470]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {alerts.map(alert => (
               <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
                 <Tooltip permanent direction="top">{alert.username}</Tooltip>
               </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AmotekunDashboard;


























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