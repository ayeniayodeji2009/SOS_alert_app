import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, PhoneCall, CheckCircle, Navigation } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api'; // Your axios instance
import './ui_index.css';

const PoliceDashboard = () => {
  const [alerts, setAlerts] = useState([]);

  // 1. Load Initial Pending Alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/admin/alerts/active');
        // Filter to show only PENDING alerts or those claimed by POLICE
        setAlerts(response.data.filter(a => a.status === 'PENDING' || a.claimed_by_type === 'POLICE'));
      } catch (err) {
        console.error("Error fetching alerts", err);
      }
    };
    fetchAlerts();

    // 2. WebSocket for Real-time Updates
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === "ALERT_CLAIMED" && data.claimed_by === "AMOTEKUN") {
        // REMOVE from list if Amotekun claimed it
        setAlerts(prev => prev.filter(a => a.id !== data.alert_id));
      } else if (data.event === "NEW_SOS") {
        // ADD to list if it's a new report
        setAlerts(prev => [...prev, data.alert]);
      }
    };
    return () => socket.close();
  }, []);

  const handleClaim = async (id) => {
    try {
      await api.patch(`/alerts/${id}/claim`, { responder_type: 'POLICE' });
      // Update local status
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'HELP_ON_THE_WAY' } : a));
    } catch { alert("Action failed: Alert might have been claimed already."); }
  };

  return (
    <div className="dashboard-container bg-gray-100 min-h-screen">
      <header className="bg-red-800 text-white p-6 shadow-xl flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert size={32} /> NPF Command Center (Lagos)
        </h1>
        <div className="px-4 py-1 bg-red-600 animate-pulse rounded-full text-sm">Live Monitoring</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[calc(100vh-80px)]">
        {/* Left Side: Alert Cards */}
        <main className="p-6 overflow-y-auto lg:col-span-1 border-r border-gray-300">
          <h2 className="text-gray-500 font-bold mb-4 uppercase tracking-widest text-sm">Active Emergency Queue</h2>
          <AnimatePresence>
            {alerts.length === 0 ? <p className="text-gray-400">No pending emergencies.</p> : 
              alerts.map((alert) => (
                <Motion.div 
                  key={alert.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className={`mb-4 p-4 rounded-xl shadow-md border-l-8 bg-white ${alert.status === 'PENDING' ? 'border-red-600' : 'border-blue-500'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-gray-400">{alert.incident_number}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${alert.status === 'PENDING' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {alert.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{alert.username}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-4"><MapPin size={14}/> {alert.location_name || "Unknown Location"}</p>
                  
                  <div className="flex gap-2">
                    {alert.status === "PENDING" ? (
                      <button onClick={() => handleClaim(alert.id)} className="bg-red-600 hover:bg-red-700 text-white flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition">
                        <Navigation size={18} /> Accept SOS
                      </button>
                    ) : (
                      <button className="bg-blue-600 text-white flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                        En Route...
                      </button>
                    )}
                  </div>
                </Motion.div>
              ))
            }
          </AnimatePresence>
        </main>

        {/* Right Side: Live Map */}
        <div className="lg:col-span-2 relative h-full">
          <MapContainer center={[6.5244, 3.3792]} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {alerts.map((alert) => (
              <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
                <Tooltip permanent direction="top" offset={[0, -20]} opacity={1}>
                  <div className="p-1 text-center">
                    <div className="font-bold text-red-600">{alert.username}</div>
                    <div className="text-[10px] font-mono">{alert.incident_number}</div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-2">
                    <p className="font-bold">Status: {alert.status}</p>
                    <button onClick={() => handleClaim(alert.id)} className="bg-blue-600 text-white px-2 py-1 rounded mt-2">Attend</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;