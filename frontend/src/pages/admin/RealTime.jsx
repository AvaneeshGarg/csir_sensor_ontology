import React, { useState, useEffect } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar
} from 'recharts';
import API_BASE_URL from '../../config';

const RealTime = () => {
  const [sensors, setSensors] = useState([]);
  const [activeSensor, setActiveSensor] = useState(null);
  const [tempChartType, setTempChartType] = useState('line');
  const [humidityChartType, setHumidityChartType] = useState('area');
  const [tempData, setTempData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);
  const [currentTemp, setCurrentTemp] = useState('--');
  const [currentHumidity, setCurrentHumidity] = useState('--');
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/beans/getSensors.php`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSensors(data);
          if (data.length > 0) {
            setActiveSensor(prev => prev ?? data[0].id); // ✅ Only set if not already set
          }
        } else {
          setSensors([]);
        }
      } catch {
        setSensors([]);
      }
    };
    fetchSensors();
  }, []);


  useEffect(() => {
    if (!activeSensor) return;

    let interval;
    let isMounted = true;

    setLoading(true); 
    setTempData([]);
    setHumidityData([]);

    const fetchLiveData = async () => {
      const selectedSensor = sensors.find(s => s.id === Number(activeSensor));
      if (!selectedSensor || !selectedSensor.type) return;
      const sensorType = selectedSensor.type;

      try {
        const res = await fetch(`${API_BASE_URL}/beans/rtdbms.php?type=${sensorType}&sensor_id=${selectedSensor.id}`);


        const data = await res.json();

        if (data && data.success && isMounted) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          const tempC = typeof data.temperature_C === 'number' ? data.temperature_C : null;
          const humidity = typeof data.humidity === 'number' ? data.humidity : null;

          setTempData(prev => [...prev, { time: timeStr, value: tempC }].slice(-10));
          setHumidityData(prev => [...prev, { time: timeStr, value: humidity }].slice(-10));
          setCurrentTemp(tempC !== null ? tempC : '--');
          setCurrentHumidity(humidity !== null ? humidity : '--');
          setLoading(false);
        } else {
          setCurrentTemp('--');
          setCurrentHumidity('--');
          setLoading(false);
        }
      } catch {
        setCurrentTemp('--');
        setCurrentHumidity('--');
        setLoading(false);
      }
    };

    fetchLiveData();
    interval = setInterval(fetchLiveData, 2000);

    return () => {
      clearInterval(interval);
      isMounted = false;
    };
  }, [activeSensor, sensors]);

  const renderChart = (data, chartType, color) => {
    const commonProps = {
      data,
      children: [
        <CartesianGrid key="grid" strokeDasharray="3 3" />,
        <XAxis key="x" dataKey="time" />,
        <YAxis key="y" />,
        <Tooltip key="tooltip" />
      ]
    };
    switch (chartType) {
      case 'bar':
        return <BarChart {...commonProps}><Bar dataKey="value" fill={color} />{commonProps.children}</BarChart>;
      case 'area':
        return <AreaChart {...commonProps}><Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />{commonProps.children}</AreaChart>;
      default:
        return <LineChart {...commonProps}><Line type="monotone" dataKey="value" stroke={color} dot={{ r: 4 }} />{commonProps.children}</LineChart>;
    }
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#dae2f7',
      minHeight: '100vh',
      opacity: fadeIn ? 1 : 0,
      transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.8s ease, transform 0.8s ease'
    },
    header: { backgroundColor: '#1e3a8a', padding: '20px', textAlign: 'center' },
    headerTitle: { color: 'white', margin: '0', fontSize: '24px', fontWeight: 'bold' },
    sensorNavigation: {
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', margin: '20px'
    },
    sensorDropdown: {
      width: '250px', padding: '10px', fontSize: '14px', borderRadius: '6px',
      border: '1px solid #ccc', backgroundColor: '#fff', color: '#1f2937'
    },
    chartsContainer: { display: 'flex', gap: '20px', margin: '20px', flexWrap: 'wrap' },
    chartCard: {
      flex: '1', backgroundColor: 'white', borderRadius: '8px', padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', minWidth: '400px'
    },
    chartHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    chartControls: { display: 'flex', gap: '8px' },
    controlButton: {
      backgroundColor: 'transparent', border: '1px solid #ccc', color: '#6b7280',
      padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
    },
    controlButtonActive: {
      backgroundColor: '#3b82f6', border: '1px solid #3b82f6', color: 'white',
      padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
    },
    currentValuesContainer: {
      display: 'flex', gap: '20px', margin: '20px', flexWrap: 'wrap'
    },
    currentValueCard: {
      flex: '1', backgroundColor: '#ffffff', borderRadius: '8px',
      padding: '30px 20px', minWidth: '300px', textAlign: 'center'
    },
    currentValueTitle: { color: '#6b7280', fontSize: '14px', marginBottom: '15px' },
    currentValueNumber: { color: 'darkblue', fontSize: '20px', fontWeight: 'bold', margin: '0' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Real Time</h1>
      </div>

      <div style={styles.sensorNavigation}>
        <label htmlFor="sensor-select">Select Sensor:</label>
        <select
          id="sensor-select"
          value={activeSensor || ''}
          onChange={e => setActiveSensor(Number(e.target.value))}
          style={styles.sensorDropdown}
        >
          {Array.isArray(sensors) && sensors.map(sensor => (
            <option key={sensor.id} value={sensor.id}>{sensor.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.chartsContainer}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3>Temperature</h3>
            <div style={styles.chartControls}>
              {['line', 'bar', 'area'].map(type => (
                <button key={type}
                  style={tempChartType === type ? styles.controlButtonActive : styles.controlButton}
                  onClick={() => setTempChartType(type)}>{type}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {renderChart(tempData, tempChartType, '#3b82f6')}
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3>Humidity</h3>
            <div style={styles.chartControls}>
              {['line', 'bar', 'area'].map(type => (
                <button key={type}
                  style={humidityChartType === type ? styles.controlButtonActive : styles.controlButton}
                  onClick={() => setHumidityChartType(type)}>{type}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {renderChart(humidityData, humidityChartType, '#10b981')}
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.currentValuesContainer}>
        <div style={styles.currentValueCard}>
          <h3 style={styles.currentValueTitle}>Current Temperature</h3>
          <div style={styles.currentValueNumber}>
            {loading ? 'Loading...' : currentTemp !== '--' ? `${currentTemp}°C` : '--'}
          </div>
        </div>
        <div style={styles.currentValueCard}>
          <h3 style={styles.currentValueTitle}>Current Humidity</h3>
          <div style={styles.currentValueNumber}>
            {loading ? 'Loading...' : currentHumidity !== '--' ? `${currentHumidity}%` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTime;