import React, { useState, useEffect } from 'react';
import { AlertTriangle, History, MapPin, Loader } from 'lucide-react';
import { getAccurateLocation } from '../components/getAccurateLocation';


const VictimDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Function to handle resolving an alert
  const handleResolve = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Alert resolved!');
        // Optionally update history state here
      }
    } catch {
      alert('Failed to resolve alert.');
    }
  };



      useEffect(() => {
        // This "watches" the position. If GPS is off, it will keep triggering the 
        // browser's "Allow Location" prompt until the user accepts.
        const watchId = navigator.geolocation.watchPosition(
          (pos) => console.log("High accuracy fix acquired", pos),
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              alert("CRITICAL: Uncle Mayor App requires GPS to protect you. Please enable location in your browser settings.");
            }
          },
          { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
      }, []);





  const TriggerSOS = async () => {
    setLoading(true);
    try {
      // 1. Force Location Fetch
      const coords = await getAccurateLocation();
      
      // 2. Send to Backend
      const response = await fetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ ...coords, user_id: 1 })
      });

      if(response.ok) alert("SOS Sent Successfully!");
    } catch (error) {
      // Fallback if Internet or GPS fails
      console.log(error)
      window.location.href = "tel:112"; 
        
    } finally {
      setLoading(false);
    }
  };






  //saving history
  if (history) {setHistory(...history.push())}

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-2xl text-center mb-6">
        <button 
          onDoubleClick={TriggerSOS} // Double tap to prevent accidental triggers
          className={`w-48 h-48 rounded-full mx-auto flex flex-col items-center justify-center transition-all 
            ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700 active:scale-90 shadow-red-200'}`}
        >
          {loading ? <Loader className="animate-spin text-white" size={48} /> : 
          <AlertTriangle size={64} color="white" />}
          <span className="text-white font-black mt-2">DOUBLE TAP SOS</span>
        </button>
        <p className="mt-4 text-gray-500 text-sm italic">Immediate connection to nearest NPF Division</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="font-bold flex items-center gap-2 mb-4"><History size={18}/> Recent Reports</h3>
        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="text-sm font-bold">{item.date}</p>
                <p className="text-xs text-gray-500 flex items-center"><MapPin size={10}/> {item.post_name}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {item.status}
                {alert.status === "ATTENDING" && (
                  <button onClick={() => handleResolve(alert.id)}>
                                          Police are here (Resolve)
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default VictimDashboard












































































// views/Victim/VictimDashboard.jsx
// import axios from 'axios';
// import { AlertCircle, Clock, Phone } from 'lucide-react';
// import { getAccurateLocation } from '../components/getAccurateLocation';
// import './ui_index.css'




// const VictimDashboard = () => {
//   const [history, setHistory] = useState([]);

//   // Trigger SOS with SMS Fallback
//   const handleSOS = async () => {
//     try {
//       const pos = await getAccurateLocation();
//       const response = await axios.post('/alerts', { lat: pos.lat, lon: pos.lon });
//       alert("Police Notified! Help is on the way.");
//     } catch (err) {
//       // INTERNET FALLBACK: Trigger direct call/SMS
//       window.location.href = "tel:767"; 
//       console.log("No internet. Redirecting to emergency hotline.");
//     }
//   };

//   return (
//     <div className="victim-container">
//       <div className="sos-section">
//         <button onLongPress={handleSOS} className="sos-button">
//           <AlertCircle size={48} />
//           <span>HOLD TO SOS</span>
//         </button>
//         <p>Internet down? App will auto-call 767</p>
//       </div>

//       <div className="history-section">
//         <h3><Clock size={20} /> Your Report History</h3>
//         {history.map(item => (
//           <div className={`history-card ${item.status}`}>
//             <div>
//               <p className="date">{new Date(item.timestamp).toLocaleString()}</p>
//               <p className="status">{item.status}</p>
//             </div>
//             <button className="re-call"><Phone size={14}/></button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default VictimDashboard






















// import React, { useState, useEffect } from 'react';
// import { AlertCircle, History, MapPin, Phone } from 'lucide-react';
// import triggerSMSFallback from '../components/triggerSMSFallback';

// const VictimApp = () => {
//     const [loading, setLoading] = useState(false);
//     const [history, setHistory] = useState([]);

//     const handleSOS = () => {
//         setLoading(true);
//         navigator.geolocation.getCurrentPosition(
//             async (pos) => {
//                 try {
//                     const res = await fetch('/api/trigger-sos', {
//                         method: 'POST',
//                         body: JSON.stringify({ user_id: 1, lat: pos.coords.latitude, lon: pos.coords.longitude })
//                     });
//                     const data = await res.json();
//                     alert("Help is coming from: " + data.police_phone);
//                 } catch (err) {
//                     window.location.href = "sms:112?body=SOS! My location: " + pos.coords.latitude + "," + pos.coords.longitude;
//                     // <triggerSMSFallback lat={pos.coords.latitude} lon={pos.coords.longitude} />
//                 }
//                 setLoading(false);
//             },
//             (err) => {
//                 alert("Please enable GPS!");
//                 window.location.href = "tel:767";
//                 setLoading(false);
//             },
//             { enableHighAccuracy: true, timeout: 5000 }
//         );
//     };

//     return (
//         <div className="flex flex-col items-center p-6 bg-slate-50 min-h-screen">
//             <div className="bg-white p-10 rounded-full shadow-2xl mb-10 animate-pulse border-8 border-red-100">
//                 <button 
//                     onDoubleClick={handleSOS}
//                     className="w-40 h-40 bg-red-600 rounded-full text-white font-bold text-xl shadow-lg active:scale-95"
//                 >
//                     {loading ? "SENDING..." : "SOS"}
//                 </button>
//             </div>
            
//             <div className="w-full bg-white rounded-xl p-4 shadow-sm">
//                 <h3 className="flex items-center gap-2 font-bold mb-4 text-gray-700"><History size={18}/> Alert History</h3>
//                 {history.map(h => (
//                     <div key={h.id} className="flex justify-between border-b py-2 text-sm">
//                         <span>{new Date(h.created_at).toLocaleDateString()}</span>
//                         <span className="font-bold text-red-500">{h.status}</span>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };