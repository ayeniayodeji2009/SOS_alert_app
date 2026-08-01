// components/GoogleMapTracking.jsx
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// ✅ Map options for better UX
const mapOptions = {
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
};

const GoogleMapTracking = ({ userPos, responderPos, responderType, onPositionUpdate }) => {
    const [directions, setDirections] = useState(null);
    const [map, setMap] = useState(null);
    const [currentResponderPos, setCurrentResponderPos] = useState(responderPos);
    const [showInfo, setShowInfo] = useState(true);
    const intervalRef = useRef(null);

    const center = userPos ? { lat: userPos[0], lng: userPos[1] } : { lat: 6.5244, lng: 3.3792 };

    // ✅ Update position from GPS
    useEffect(() => {
        if (responderPos) {
            setCurrentResponderPos(responderPos);
        }
    }, [responderPos]);

    // ✅ Get real-time directions with auto-refresh
    useEffect(() => {
        if (!userPos || !currentResponderPos || !map) return;

        const directionsService = new window.google.maps.DirectionsService();

        const getDirections = () => {
            directionsService.route(
                {
                    origin: { lat: currentResponderPos[0], lng: currentResponderPos[1] },
                    destination: { lat: userPos[0], lng: userPos[1] },
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === 'OK') {
                        setDirections(result);
                    } else {
                        console.error('Directions request failed:', status);
                    }
                }
            );
        };

        getDirections();

        // ✅ Refresh directions every 10 seconds
        intervalRef.current = setInterval(getDirections, 10000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [userPos, currentResponderPos, map]);

    // ✅ Calculate distance and ETA
    const calculateDistance = () => {
        if (!directions) return null;
        const route = directions.routes[0];
        if (!route) return null;
        
        const leg = route.legs[0];
        return {
            distance: leg.distance.text,
            duration: leg.duration.text
        };
    };

    const routeInfo = calculateDistance();

    return (
        <LoadScript 
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            loadingElement={<div className="h-full flex items-center justify-center text-white">Loading Maps...</div>}
        >
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                options={mapOptions}
                onLoad={(map) => setMap(map)}
            >
                {/* ✅ Victim Marker with Info */}
                {userPos && (
                    <Marker 
                        position={{ lat: userPos[0], lng: userPos[1] }}
                        icon={{
                            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            scaledSize: new window.google.maps.Size(40, 40)
                        }}
                        onClick={() => setShowInfo(!showInfo)}
                    >
                        {showInfo && (
                            <InfoWindow position={{ lat: userPos[0], lng: userPos[1] }}>
                                <div className="p-2">
                                    <h3 className="font-bold text-red-600">📍 Victim</h3>
                                    <p className="text-sm">Waiting for help</p>
                                </div>
                            </InfoWindow>
                        )}
                    </Marker>
                )}
                
                {/* ✅ Responder Marker with Name */}
                {currentResponderPos && (
                    <Marker 
                        position={{ lat: currentResponderPos[0], lng: currentResponderPos[1] }}
                        icon={{
                            url: responderType === 'POLICE' 
                                ? 'https://maps.google.com/mapfiles/ms/icons/police.png'
                                : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            scaledSize: new window.google.maps.Size(40, 40)
                        }}
                        label={{
                            text: responderType === 'POLICE' ? '🚓 POLICE' : '🛡️ AMOTEKUN',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '12px'
                        }}
                    >
                        <InfoWindow position={{ lat: currentResponderPos[0], lng: currentResponderPos[1] }}>
                            <div className="p-2">
                                <h3 className="font-bold text-blue-600">🚓 {responderType}</h3>
                                <p className="text-sm">En Route to victim</p>
                                {routeInfo && (
                                    <>
                                        <p className="text-sm">Distance: {routeInfo.distance}</p>
                                        <p className="text-sm">ETA: {routeInfo.duration}</p>
                                    </>
                                )}
                            </div>
                        </InfoWindow>
                    </Marker>
                )}
                
                {/* ✅ Real Route (not flying) - Shows actual road path */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            polylineOptions: {
                                strokeColor: responderType === 'POLICE' ? '#22c55e' : '#3b82f6',
                                strokeWeight: 6,
                                strokeOpacity: 0.8
                            },
                            suppressMarkers: true, // ✅ Use our custom markers
                            preserveViewport: true
                        }}
                    />
                )}
                
                {/* ✅ Show route info on map */}
                {routeInfo && (
                    <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg">
                        <p className="text-sm font-bold">🚗 Route Info</p>
                        <p className="text-sm">Distance: {routeInfo.distance}</p>
                        <p className="text-sm">ETA: {routeInfo.duration}</p>
                    </div>
                )}
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapTracking;