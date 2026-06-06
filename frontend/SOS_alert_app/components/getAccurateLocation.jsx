export const getAccurateLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported by your browser.");
    }

    const options = {
      enableHighAccuracy: true, // Forces use of GPS hardware rather than Wi-Fi
      timeout: 10000,           // 10 seconds timeout
      maximumAge: 0             // Do not use cached location
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        if (err.code === 1) {
          alert("PLEASE ENABLE GPS: This app requires location to send help.");
        }
        reject(err);
      },
      options
    );
  });
};