import API_BASE_URL from '../../config';
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';

const HistoryReport = () => {
  const [sensors, setSensors] = useState([]);
  const [activeSensor, setActiveSensor] = useState(null);
  const [tempChartType, setTempChartType] = useState('line');
  const [humidityChartType, setHumidityChartType] = useState('area');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [fadeIn, setFadeIn] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState({ data: [], page: 1, limit: 100, count: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 100;

  // Set default dates (today) on component mount
  useEffect(() => {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    setStartDate(formattedToday);
    setEndDate(formattedToday);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/beans/getSensors.php`)
      .then(res => res.json())
      .then(data => {
        setSensors(data);
        if (data.length > 0) setActiveSensor(data[0].id);
      });
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  useEffect(() => {
    if (activeSensor && startDate && endDate) {
      setIsLoading(true);
      setLoadingProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      fetch(`${API_BASE_URL}/beans/fetch_history_all.php?sensor_id=${activeSensor}&start=${startDate}&end=${endDate}`)
        .then(res => res.json())
        .then(fullData => {
          clearInterval(progressInterval);
          setLoadingProgress(100);
          
          const raw = Array.isArray(fullData.parsed)
            ? fullData.parsed
            : (Array.isArray(fullData) ? fullData : []);
          const cleaned = raw.filter(d => d.time && !isNaN(d.temperature) && !isNaN(d.humidity));
          setChartData(cleaned);
          setPage(1); // reset pagination
          
          setTimeout(() => setIsLoading(false), 500);
        })
        .catch(err => {
          clearInterval(progressInterval);
          console.error("Full chart data fetch failed:", err);
          setIsLoading(false);
        });
    }
  }, [activeSensor, startDate, endDate]);

  useEffect(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const paginated = chartData.slice(start, end).map(row => {
      const [date, time] = row.time.split(' ');
      return {
        date,
        time,
        temperature: row.temperature,
        humidity: row.humidity,
        status: 'Active'
      };
    });

    setTableData({
      data: paginated,
      page,
      limit: itemsPerPage,
      count: chartData.length
    });
  }, [chartData, page]);

  const sortedChartData = [...chartData].sort((a, b) => a.time.localeCompare(b.time));
  const tempData = sortedChartData.map(d => ({ time: d.time, value: parseFloat(d.temperature) }));
  const humidityData = sortedChartData.map(d => ({ time: d.time, value: parseFloat(d.humidity) }));

  const downloadReport = async () => {
    const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (diffDays > 60) {
      alert("Only up to 60 days of data can be downloaded.");
      return;
    }

    const formattedData = chartData.map(row => {
      const [date, time] = row.time.split(' ');
      return {
        date,
        time,
        temperature: row.temperature,
        humidity: row.humidity,
        status: 'Active'
      };
    });

    try {
      setIsLoading(true);
      setLoadingProgress(0);
      
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      const res = await fetch(`${API_BASE_URL}/hashing/generate_secure_download.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_id: activeSensor,
          start: startDate,
          end: endDate,
          data: formattedData
        })
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (!res.ok) throw new Error("Server error");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sensor_${activeSensor}_report.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Download failed: " + err.message);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const renderChart = (type, data, color) => {
    const chartProps = {
      data,
      children: [
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e0e0e0" />,
        <XAxis key="x" dataKey="time" tick={{ fontSize: 12, fill: '#666' }} />,
        <YAxis key="y" tick={{ fontSize: 12, fill: '#666' }} />,
        <Tooltip key="tooltip" contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
      ]
    };
    if (type === 'bar') return <BarChart {...chartProps}>{chartProps.children}<Bar dataKey="value" fill={color} /></BarChart>;
    if (type === 'area') return <AreaChart {...chartProps}>{chartProps.children}<Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} /></AreaChart>;
    return <LineChart {...chartProps}>{chartProps.children}<Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} /></LineChart>;
  };

  const styles = {
    container: {
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#dae2f7', 
      minHeight: '100vh',
      opacity: fadeIn ? 1 : 0,
      transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.8s ease, transform 0.8s ease',
      position: 'relative'
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
    dateRangeContainer: {
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      gap: '20px', 
      margin: '20px', 
      flexWrap: 'wrap'
    },
    dateInputGroup: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px',
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    dateInput: {
      padding: '10px 12px', 
      border: '1px solid #d1d5db', 
      borderRadius: '6px',
      fontSize: '14px', 
      backgroundColor: 'white', 
      outline: 'none',
      transition: 'border-color 0.2s ease',
      minWidth: '160px',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
    },
    dateRangeTo: { 
      color: '#6b7280', 
      fontSize: '14px', 
      fontWeight: '500',
      padding: '0 5px'
    },
    downloadButton: {
      backgroundColor: '#3b82f6', 
      color: 'white', 
      border: 'none',
      padding: '10px 20px', 
      borderRadius: '6px', 
      fontSize: '14px',
      fontWeight: '500', 
      cursor: 'pointer', 
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      ':hover': {
        backgroundColor: '#2563eb'
      }
    },
    dataTableContainer: {
      margin: '20px', 
      backgroundColor: 'white', 
      borderRadius: '8px',
      padding: '20px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    tableScrollContainer: { 
      overflowX: 'auto', 
      maxHeight: '300px', 
      overflowY: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '6px'
    },
    table: { 
      width: '100%', 
      borderCollapse: 'collapse', 
      fontSize: '14px'
    },
    tableHeaderRow: { 
      backgroundColor: '#f9fafb' 
    },
    tableHeader: {
      padding: '12px 16px', 
      textAlign: 'left', 
      fontWeight: '600',
      color: '#374151', 
      borderBottom: '2px solid #e5e7eb',
      position: 'sticky', 
      top: 0, 
      backgroundColor: '#f9fafb'
    },
    tableRowEven: { 
      backgroundColor: '#ffffff' 
    },
    tableRowOdd: { 
      backgroundColor: '#f9fafb' 
    },
    tableCell: {
      padding: '12px 16px', 
      borderBottom: '1px solid #e5e7eb', 
      color: '#374151'
    },
    statusBadge: { 
      padding: '4px 8px', 
      borderRadius: '12px', 
      fontSize: '12px', 
      fontWeight: '500' 
    },
    statusActive: { 
      backgroundColor: '#d1fae5', 
      color: '#065f46' 
    },
    statusOffline: { 
      backgroundColor: '#fee2e2', 
      color: '#991b1b' 
    },
    chartsContainer: { 
      display: 'flex', 
      gap: '20px', 
      margin: '20px', 
      flexWrap: 'wrap' 
    },
    chartCard: {
      flex: '1', 
      backgroundColor: 'white', 
      borderRadius: '8px',
      padding: '20px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
      minWidth: '400px'
    },
    chartHeader: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '20px'
    },
    chartTitle: { 
      margin: '0', 
      fontSize: '18px', 
      color: '#1f2937', 
      fontWeight: '600' 
    },
    chartControls: { 
      display: 'flex', 
      gap: '8px' 
    },
    controlButton: {
      backgroundColor: 'transparent', 
      border: '1px solid #d1d5db', 
      color: '#6b7280',
      padding: '6px 12px', 
      borderRadius: '4px', 
      fontSize: '12px', 
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    controlButtonActive: {
      backgroundColor: '#3b82f6', 
      border: '1px solid #3b82f6', 
      color: 'white',
      padding: '6px 12px', 
      borderRadius: '4px', 
      fontSize: '12px', 
      cursor: 'pointer'
    },
    chartWrapper: { 
      width: '100%', 
      height: '200px' 
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      flexDirection: 'column',
      color: 'white'
    },
    loadingContainer: {
      width: '300px',
      backgroundColor: '#2d3748',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      textAlign: 'center'
    },
    progressBarContainer: {
      width: '100%',
      height: '20px',
      backgroundColor: '#4a5568',
      borderRadius: '10px',
      margin: '15px 0',
      overflow: 'hidden'
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#4299e1',
      borderRadius: '10px',
      transition: 'width 0.3s ease',
      width: `${loadingProgress}%`
    },
    loadingText: {
      marginBottom: '10px',
      fontSize: '16px',
      fontWeight: '500'
    },
    loadingPercentage: {
      fontSize: '14px',
      color: '#cbd5e0'
    },
    paginationButton: {
      padding: '8px 16px',
      margin: '0 5px',
      backgroundColor: '#e2e8f0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#cbd5e0'
      },
      ':disabled': {
        backgroundColor: '#edf2f7',
        color: '#a0aec0',
        cursor: 'not-allowed'
      }
    }
  };

  return (
    <div style={styles.container}>
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>Loading Sensor Data...</div>
            <div style={styles.progressBarContainer}>
              <div style={styles.progressBar}></div>
            </div>
            <div style={styles.loadingPercentage}>{Math.round(loadingProgress)}%</div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>History and Report</h1>
      </div>

      <div style={styles.sensorNavigation}>
        <label htmlFor="sensor-select" style={styles.sensorLabel}>Select Sensor:</label>
        <select
          id="sensor-select"
          value={activeSensor}
          onChange={(e) => setActiveSensor(Number(e.target.value))}
          style={styles.sensorDropdown}
          disabled={isLoading}
        >
          {sensors.map(sensor => (
            <option key={sensor.id} value={sensor.id}>{sensor.name}</option>
          ))}
        </select>
      </div>

      <div style={styles.dateRangeContainer}>
        <div style={styles.dateInputGroup}>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={styles.dateInput} 
            max={endDate}
            disabled={isLoading}
          />
          <span style={styles.dateRangeTo}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            style={styles.dateInput}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
        </div>
        <button 
          onClick={downloadReport} 
          style={styles.downloadButton}
          disabled={isLoading}
        >
          Download Report
        </button>
      </div>

      <div style={styles.dataTableContainer}>
        <div style={styles.tableScrollContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Time</th>
                <th style={styles.tableHeader}>Temperature (°C)</th>
                <th style={styles.tableHeader}>Humidity (%)</th>
                <th style={styles.tableHeader}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableData.data.map((row, index) => (
                <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                  <td style={styles.tableCell}>{row.date}</td>
                  <td style={styles.tableCell}>{row.time}</td>
                  <td style={styles.tableCell}>{row.temperature}</td>
                  <td style={styles.tableCell}>{row.humidity}</td>
                  <td style={styles.tableCell}>
                    <span style={{ ...styles.statusBadge, ...(row.status === 'Offline' ? styles.statusOffline : styles.statusActive) }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            style={styles.paginationButton}
            disabled={page === 1 || isLoading}
          >
            Previous
          </button>
          <span style={{ margin: '0 10px' }}>Page {page}</span>
          <button 
            onClick={() => setPage(p => p + 1)} 
            style={styles.paginationButton}
            disabled={(page * tableData.limit) >= tableData.count || isLoading}
          >
            Next
          </button>
        </div>
      </div>

      <div style={styles.chartsContainer}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Temperature Graph (°C)</h3>
            <div style={styles.chartControls}>
              {['line', 'bar', 'area'].map(type => (
                <button
                  key={type}
                  style={tempChartType === type ? styles.controlButtonActive : styles.controlButton}
                  onClick={() => setTempChartType(type)}
                  disabled={isLoading}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={200}>
              {renderChart(tempChartType, tempData, "#3b82f6")}
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Humidity Graph (%)</h3>
            <div style={styles.chartControls}>
              {['line', 'bar', 'area'].map(type => (
                <button
                  key={type}
                  style={humidityChartType === type ? styles.controlButtonActive : styles.controlButton}
                  onClick={() => setHumidityChartType(type)}
                  disabled={isLoading}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={200}>
              {renderChart(humidityChartType, humidityData, "#10b981")}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryReport;
