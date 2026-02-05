import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Table, TableHead,
  TableRow, TableCell, TableBody, Paper
} from '@mui/material';

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
  sectionContainer: {
    backgroundColor: '#ffffff',
    margin: '20px',
    padding: '30px 20px',
    borderRadius: '8px'
  },
  sectionTitle: {
    color: '#374151',
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  tableHeader: {
    backgroundColor: '#e0e7ff',
    '& .MuiTableCell-head': {
      fontWeight: 'bold',
      color: '#1e3a8a',
      fontSize: '14px'
    }
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: '#f9fafb'
    },
    '& .MuiTableCell-body': {
      fontSize: '13px',
      padding: '10px 16px'
    }
  },
  actionButton: {
    minWidth: '80px',
    marginRight: '8px',
    fontSize: '12px',
    padding: '6px 12px'
  }
};

const API = 'https://lostdevs.io/ctrl2/beans/sensor_metadata.php';

const SensorActivity = () => {
  const [sensors, setSensors] = useState([]);
  const [form, setForm] = useState({
    sensor_name: '', sensor_type: '', manufacturer: '',
    sampling_rate: '', accuracy: '', resolution: '',
    interface_type: '', power: '', voltage: ''
  });
  const [editId, setEditId] = useState(null);

  const fetchSensors = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setSensors(data);
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    const required = Object.entries(form).every(([_, val]) => val.trim() !== '');
    if (!required) return alert("All fields are mandatory.");

    const type = editId ? 'edit' : 'add';
    const payload = {
      type,
      ...form,
      ...(editId ? { id: editId } : {})
    };

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    alert(result.message);

    setForm({
      sensor_name: '', sensor_type: '', manufacturer: '',
      sampling_rate: '', accuracy: '', resolution: '',
      interface_type: '', power: '', voltage: ''
    });
    setEditId(null);
    fetchSensors();
  };

  const handleEdit = (sensor) => {
    setForm(sensor);
    setEditId(sensor.id);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Delete this sensor?");
    if (!confirm) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'delete', id })
    });
    const result = await res.json();
    alert(result.message);
    fetchSensors();
  };

  return (
    <Box sx={styles.container}>
      <style>
        {`
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
        `}
      </style>

      <Box sx={styles.header}>
        <Typography sx={styles.headerTitle}>Sensor Metadata Manager</Typography>
      </Box>

      <Paper sx={styles.sectionContainer}>
        <Typography sx={styles.sectionTitle}>
          {editId ? 'Edit Sensor' : 'Add Sensor'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <TextField 
            label="Sensor Name" 
            value={form.sensor_name} 
            onChange={handleChange('sensor_name')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Sensor Type" 
            value={form.sensor_type} 
            onChange={handleChange('sensor_type')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Manufacturer" 
            value={form.manufacturer} 
            onChange={handleChange('manufacturer')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Sampling Rate" 
            value={form.sampling_rate} 
            onChange={handleChange('sampling_rate')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Accuracy" 
            value={form.accuracy} 
            onChange={handleChange('accuracy')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Resolution" 
            value={form.resolution} 
            onChange={handleChange('resolution')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Interface Type" 
            value={form.interface_type} 
            onChange={handleChange('interface_type')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Power" 
            value={form.power} 
            onChange={handleChange('power')} 
            required 
            sx={styles.textField}
          />
          <TextField 
            label="Voltage" 
            value={form.voltage} 
            onChange={handleChange('voltage')} 
            required 
            sx={styles.textField}
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={styles.buttonPrimary}
          >
            {editId ? 'Update Sensor' : 'Add Sensor'}
          </Button>
          {editId && (
            <Button 
              variant="contained" 
              onClick={() => {
                setForm({
                  sensor_name: '', sensor_type: '', manufacturer: '',
                  sampling_rate: '', accuracy: '', resolution: '',
                  interface_type: '', power: '', voltage: ''
                });
                setEditId(null);
              }}
              sx={styles.buttonSecondary}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={styles.sectionContainer}>
        <Typography sx={styles.sectionTitle}>Existing Sensors</Typography>
        <Table>
          <TableHead sx={styles.tableHeader}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Sampling Rate</TableCell>
              <TableCell>Accuracy</TableCell>
              <TableCell>Resolution</TableCell>
              <TableCell>Interface</TableCell>
              <TableCell>Power</TableCell>
              <TableCell>Voltage</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sensors.map(sensor => (
              <TableRow key={sensor.id} sx={styles.tableRow}>
                <TableCell>{sensor.sensor_name}</TableCell>
                <TableCell>{sensor.sensor_type}</TableCell>
                <TableCell>{sensor.manufacturer}</TableCell>
                <TableCell>{sensor.sampling_rate}</TableCell>
                <TableCell>{sensor.accuracy}</TableCell>
                <TableCell>{sensor.resolution}</TableCell>
                <TableCell>{sensor.interface_type}</TableCell>
                <TableCell>{sensor.power}</TableCell>
                <TableCell>{sensor.voltage}</TableCell>
                <TableCell>
                  <Button 
                    onClick={() => handleEdit(sensor)} 
                    size="small"
                    sx={{...styles.buttonPrimary, ...styles.actionButton}}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(sensor.id)} 
                    size="small" 
                    sx={{...styles.buttonSecondary, ...styles.actionButton}}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default SensorActivity;
