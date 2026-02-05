import React, { useState, useEffect } from 'react';
import SensorSync from '../../assets/SensorSync Portal.png';

import API_BASE_URL from '../../config';

// Note: Ensure API_BASE_URL + '/beans/rtdbms.php?type=' matches your backend structure
const API_BASE = `${API_BASE_URL}/beans/rtdbms.php?type=`;

const Dashboard = () => {
  const [sensors, setSensors] = useState([]);
  const [activeSensor, setActiveSensor] = useState(null);
  const [currentTemp, setCurrentTemp] = useState('--');
  const [currentHumidity, setCurrentHumidity] = useState('--');
  const [lastUpdate, setLastUpdate] = useState('--');
  const [loading, setLoading] = useState(true);

  const activeSensorData = sensors.find(sensor => sensor.id === activeSensor);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch('https://localhost/ctrl2/beans/getSensors.php');
        const data = await res.json();
        if (Array.isArray(data)) {
          setSensors(data);
          if (data.length > 0) {
            setActiveSensor(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch sensors:", error);
      }
    };

    fetchSensors();
  }, []);

  useEffect(() => {
    if (!activeSensor) return;

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      const selectedSensor = sensors.find(s => s.id === activeSensor);
      const sensorType = selectedSensor?.type;

      try {
        const res = await fetch(`${API_BASE}${sensorType}&sensor_id=${selectedSensor?.id}`);
        const data = await res.json();

        if (data && data.success && isMounted) {
          setCurrentTemp(typeof data.temperature_C === 'number' ? data.temperature_C : '--');
          setCurrentHumidity(typeof data.humidity === 'number' ? data.humidity : '--');
          setLastUpdate(data.receiving_date || '--');
        } else if (isMounted) {
          setCurrentTemp('--');
          setCurrentHumidity('--');
          setLastUpdate('--');
        }
      } catch (e) {
        if (isMounted) {
          setCurrentTemp('--');
          setCurrentHumidity('--');
          setLastUpdate('--');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // auto-refresh every 3 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSensor, sensors]);

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#dae2f7',
      minHeight: '100vh',
      opacity: 0,
      transform: 'translateY(10px)',
      animation: 'fadeInUp 0.5s ease-out forwards'
    },
    header: {
      backgroundColor: '#1e3a8a',
      padding: '20px',
      textAlign: 'center'
    },
    headerTitle: {
      color: 'white',
      margin: '0',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    welcomeBanner: {
      backgroundColor: '#ffffff',
      margin: '20px',
      padding: '20px',
      textAlign: 'center',
      borderRadius: '8px'
    },
    welcomeImage: {
      maxWidth: '100%',
      height: 'auto',
      display: 'block',
      margin: '0 auto'
    },
    sensorNavigation: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '10px',
      margin: '20px'
    },
    sensorLabel: {
      fontWeight: 'normal',
      fontSize: '14px',
      color: '#374151',
      marginRight: '4px',
      whiteSpace: 'nowrap'
    },
    sensorDropdown: {
      width: '250px',
      padding: '10px',
      fontSize: '14px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      backgroundColor: '#fff',
      color: '#1f2937'
    },
    sensorInfo: {
      backgroundColor: '#ffffff',
      margin: '20px',
      padding: '30px 20px',
      textAlign: 'center',
      borderRadius: '8px'
    },
    sensorDescription: {
      color: '#374151',
      margin: '0',
      fontSize: '16px',
      lineHeight: '1.5'
    },
    highlight: {
      fontWeight: 'bold',
      color: '#1f2937'
    },
    metricsContainer: {
      display: 'flex',
      gap: '20px',
      margin: '20px',
      flexWrap: 'wrap'
    },
    metricCard: {
      flex: '1',
      backgroundColor: '#ffffff',
      padding: '30px 20px',
      borderRadius: '8px',
      textAlign: 'center',
      minWidth: '200px'
    },
    metricLabel: {
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '15px',
      fontWeight: '500'
    },
    metricValue: {
      color: 'darkblue',
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '0'
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Dashboard</h1>
      </div>

      <div style={styles.welcomeBanner}>
        <img src={SensorSync} alt="SensorSync" style={styles.welcomeImage} />
      </div>

      <div style={styles.sensorNavigation}>
        <label htmlFor="sensor-select" style={styles.sensorLabel}>Select Sensor:</label>
        <select
          id="sensor-select"
          value={activeSensor || ''}
          onChange={e => setActiveSensor(Number(e.target.value))}
          style={styles.sensorDropdown}
        >
          {sensors.map(sensor => (
            <option key={sensor.id} value={sensor.id}>
              {sensor.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.sensorInfo}>
        <p style={styles.sensorDescription}>
          Currently viewing: <span style={styles.highlight}>{activeSensorData?.name || '--'}</span>
        </p>
      </div>

      <div style={styles.metricsContainer}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Current Temp</div>
          <div style={styles.metricValue}>
            {loading ? "Loading..." : (currentTemp !== '--' ? `${currentTemp}°C` : '--')}
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Current Humidity</div>
          <div style={styles.metricValue}>
            {loading ? "Loading..." : (currentHumidity !== '--' ? `${currentHumidity}%` : '--')}
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Last Update</div>
          <div style={styles.metricValue}>
            {loading ? "Loading..." : lastUpdate}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
