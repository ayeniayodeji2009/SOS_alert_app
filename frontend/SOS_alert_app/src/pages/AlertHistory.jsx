import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const AlertHistory = ({ userId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Adjust the URL to your FastAPI endpoint
                //const response = await axios.get(`http://localhost:8000/alerts/history/${userId}`);
                const response = await axios.get(`https://sos-alert-app-backend.onrender.com/alerts/history/${userId}`);
                setHistory(response.data);
            } catch (error) {
                console.error("Error fetching alert history:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchHistory();
    }, [userId]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            case 'HELP_ON_THE_WAY': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-4 text-center">Loading history...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6" /> Your SOS History
            </h2>

            {history.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center border-2 border-dashed">
                    <p className="text-gray-500">No emergency alerts recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((alert) => (
                        <div key={alert.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-mono text-gray-400 uppercase">Incident #{alert.incident_number}</span>
                                    <h3 className="font-semibold text-lg">{new Date(alert.created_at).toLocaleString()}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(alert.status)}`}>
                                    {alert.status.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                    {alert.lat.toFixed(4)}, {alert.lon.toFixed(4)}
                                </div>
                                {alert.claimed_by_type && (
                                    <div className="flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4 text-blue-500" />
                                        Responded by: {alert.claimed_by_type}
                                    </div>
                                )}
                            </div>

                            {alert.status === 'RESOLVED' && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-green-600 text-sm font-medium">
                                    <CheckCircle className="w-4 h-4" />
                                    Resolved at {new Date(alert.resolved_at).toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertHistory;