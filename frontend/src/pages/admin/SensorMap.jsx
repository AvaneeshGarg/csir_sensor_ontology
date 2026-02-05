import API_BASE_URL from '../../config';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';

// Disable default icon loading
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

const getCustomIcon = (status) => {
  let bgColor = '#22c55e';
  let pulse = true;

  if (status === 'inactive') {
    bgColor = '#ef4444';
    pulse = false;
  } else if (status === 'warning') {
    bgColor = '#facc15';
    pulse = false;
  }

  return L.divIcon({
    className: 'sensor-icon',
    html: `
      <div class="${pulse ? 'pulse' : ''}" style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: ${bgColor};
        border: 2px solid white;
      "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

const FitBounds = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  return null;
};

const SensorMap = () => {
  const mapRef = useRef();
  const [sensors, setSensors] = useState([]);
  const [sensorNames, setSensorNames] = useState({});

  const handlePrint = () => window.print();

  const handleScreenshot = () => {
    const target = document.getElementById('printable-map');
    html2canvas(target, { useCORS: true }).then((canvas) => {
      const link = document.createElement('a');
      link.download = 'sensor-map.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/beans/getSensors.php`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(item => {
          map[item.id] = item.name;
        });
        setSensorNames(map);
      })
      .catch(err => console.error('Error fetching sensor names:', err));
  }, []);

  useEffect(() => {
    if (Object.keys(sensorNames).length === 0) return;

    fetch(`${API_BASE_URL}/beans/langdalat.php`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error("Invalid sensor data format.");
          setSensors([]);
          return;
        }

        const locationCounts = {};
        const mapped = data
          .filter(d => d.sensor_latitude && d.sensor_longitude)
          .map(d => {
            const latRaw = parseFloat(d.sensor_latitude);
            const lngRaw = parseFloat(d.sensor_longitude);
            if (isNaN(latRaw) || isNaN(lngRaw)) return null;

            const key = `${latRaw},${lngRaw}`;
            locationCounts[key] = (locationCounts[key] || 0) + 1;
            const offset = 0.00005 * locationCounts[key];

            const lat = latRaw + offset;
            const lng = lngRaw + offset;

            const id = d.id;
            const name = sensorNames[id] || `Sensor ${id}`;
            const status = d.status || 'active';
            const lastUpdated = d.receiving_date
              ? new Date(d.receiving_date).toLocaleString()
              : "N/A";

            return { id, name, lat, lng, status, lastUpdated };
          })
          .filter(Boolean);

        setSensors(mapped);
      })
      .catch(err => console.error('Sensor data fetch error:', err));
  }, [sensorNames]);

  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background-color: #dae2f7;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          background-color: #dae2f7;
          min-height: 100vh;
          animation: fadeInUp 0.5s ease-out forwards;
        }

        .header {
          background-color: #1e3a8a;
          padding: 20px;
          text-align: center;
        }

        .header h2 {
          color: white;
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }

        .map-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          margin-top: 20px;
        }

        .map-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
          gap: 10px;
        }

        .print-button {
          background-color: #2563eb;
          color: white;
          padding: 8px 14px;
          font-weight: 600;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(34,197,94,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }

        @media print {
          body * { visibility: hidden; }
          #printable-map, #printable-map * {
            visibility: visible;
          }
          #printable-map {
            position: absolute;
            top: 0; left: 0;
            height: 100vh;
            width: 100vw;
            z-index: 9999;
          }
          .no-print { display: none; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="container">
        <div className="header no-print">
          <h2>Sensor Map</h2>
        </div>

        <div className="map-card">
          <div className="map-actions no-print">
            <button className="print-button" onClick={handleScreenshot}>🖼️ Save as Image</button>
            <button className="print-button" onClick={handlePrint}>🖨️ Print Map</button>
          </div>

          <div id="printable-map" style={{ height: '80vh', width: '100%' }}>
            <MapContainer
              center={[28.6372, 77.1701]}
              zoom={17}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer name="Street View">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer checked name="Satellite View">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </LayersControl.BaseLayer>
              </LayersControl>

              {sensors.map(sensor => (
                <Marker
                  key={`${sensor.id}-${sensor.lat}-${sensor.lng}`}
                  position={[sensor.lat, sensor.lng]}
                  icon={getCustomIcon(sensor.status)}
                >
                  <Popup>
                    <strong>{sensor.name}</strong><br />
                    ID: {sensor.id}<br />
                    Status: {sensor.status}<br />
                    Last Updated: {sensor.lastUpdated}
                  </Popup>
                </Marker>
              ))}

              <FitBounds locations={sensors} />
            </MapContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default SensorMap;
