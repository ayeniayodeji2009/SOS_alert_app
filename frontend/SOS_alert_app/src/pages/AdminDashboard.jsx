import React, { useEffect, useState } from 'react';
import api from '../api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ total_users: 0, total_alerts: 0 });
    const [users, setUsers] = useState([]);

  
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                console.log("Stats received:", response.data);
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };
        fetchStats();
    }, []);



    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch both users and alerts
                const [usersRes, alertsRes] = await Promise.all([
                    api.get('/admin/users'),   // Adjust endpoint as needed
                    api.get('/admin/alerts/active')
                ]);

                setStats({
                    totalUsers: usersRes.data.length,
                    totalAlerts: alertsRes.data.length
                });
                
                // Also set your user list state here
                setUsers(usersRes.data); 
            } catch (err) {
                console.error("Dashboard fetch failed:", err);
            }
        };
        fetchDashboardData();
    }, []);


    useEffect(() => {
        const socket = new WebSocket('ws://127.0.0.1:8000/ws/alerts');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === "NEW_ALERT") {
                setStats(prev => ({ ...prev, totalAlerts: prev.total_alerts + 1 }));
                // Refresh alert list
            }
        };

        return () => socket.close();
    }, []);

   

    return (
        <div className="admin-container">
            <h1>System Administration</h1>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                     <table className="admin-table">
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td> 
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="stat-card">
                    <h3>Total Alerts Sent</h3>
                    <p>{stats.pending}</p>
                </div>
            </div>

            <h2>User Management</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{u.is_admin ? 'Police/Admin' : 'Citizen'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;