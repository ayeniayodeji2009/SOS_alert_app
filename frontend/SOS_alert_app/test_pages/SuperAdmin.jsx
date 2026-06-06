const SuperAdminDashboard = () => {
  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 p-6 space-y-6">
        <h2 className="text-2xl font-black text-red-500">UNCLE MAYOR</h2>
        <nav className="space-y-4">
          <div className="text-slate-400 hover:text-white cursor-pointer">Live Map</div>
          <div className="text-slate-400 hover:text-white cursor-pointer">Police Stations</div>
          <div className="text-slate-400 hover:text-white cursor-pointer">System Logs</div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Alerts Today" value="1,204" color="bg-red-500" />
          <StatCard title="Active Responders" value="850" color="bg-blue-500" />
          <StatCard title="Avg. Response Time" value="4.2 mins" color="bg-green-500" />
          <StatCard title="System Health" value="99.9%" color="bg-purple-500" />
        </div>

        <div className="bg-slate-800 rounded-xl p-6 h-96 mb-8">
          <h3 className="mb-4 text-xl">National Real-Time Heatmap</h3>
          <div className="w-full h-full bg-slate-700 rounded flex items-center justify-center">
            {/* Map implementation here */}
            [Live Leaflet/Google Map Loading...]
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({title, value, color}) => (
  <div className={`${color} p-6 rounded-xl shadow-lg`}>
    <p className="text-sm opacity-80">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);



export default SuperAdminDashboard



































































// // views/Admin/SuperAdmin.jsx
// import { Activity, ShieldCheck, Users } from 'lucide-react';
// import './ui_index.css'






// const SuperAdmin = () => {
//   return (
//     <div className="admin-shell">
//       <div className="stats-grid">
//         <div className="stat-card">
//           <Activity className="text-red-500" />
//           <div><h4>Active Alerts</h4><p>12</p></div>
//         </div>
//         <div className="stat-card">
//           <ShieldCheck className="text-blue-500" />
//           <div><h4>Verified Posts</h4><p>142</p></div>
//         </div>
//       </div>

//       <div className="main-monitor">
//         <div className="map-view">
//           {/* Integrate Leaflet Map here to show pins for all active alerts */}
//           <p>Live Geographic Monitor (All Nigeria)</p>
//         </div>
//         <div className="system-logs">
//           <h4>Audit Logs</h4>
//           <p>14:02 - Alert #402 resolved by Area F (Ikeja)</p>
//           <p>13:55 - New Police Operator verified: Officer John</p>
//         </div>
//       </div>
//     </div>
//   );
// };




// export default SuperAdmin