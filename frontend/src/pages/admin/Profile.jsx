import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import API_BASE_URL from '../../config';

const Profile = ({ user: propUser }) => {
  const localUser = JSON.parse(localStorage.getItem('user'));
  const user = propUser || localUser;

  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [otpDialog, setOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

useEffect(() => {
  if (!user?.email) {
    console.warn("No logged-in user email found.");
    return;
  }

  // Prevent multiple fetches
  if (profileData) return;

  fetch(`${API_BASE_URL}/beans/fetch_users.php`)
    .then(res => res.json())
    .then(users => {
      const current = users.find(
        u => u.email?.toLowerCase() === user.email.toLowerCase()
      );

      if (!current) {
        console.error("No matching user found for:", user.email);
        alert("Profile not found in database.");
        return;
      }

      setProfileData(current);
      setFormData({
        name: current.full_name || '',
        email: current.email || '',
        minTemp: current.min_temp || '',
        maxTemp: current.max_temp || '',
        minHumidity: current.min_humidity || '',
        maxHumidity: current.max_humidity || ''
      });
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      alert("Error loading profile. Please try again.");
    });

  }, [user, profileData]); // <=== Add profileData to dependency array


  // Cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleEdit = () => setEditMode(true);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleOtpSend = () => {
    fetch(`${API_BASE_URL}/beans/send_otp.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        id: profileData.id          // ✅ pass user ID for secure OTP tracking
      })
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {
          setOtpDialog(true);
          setResendCooldown(60);
        } else {
          alert(resp.message || 'Failed to send OTP.');
        }
      });
  };

  const handleOtpVerify = () => {
    fetch(`${API_BASE_URL}/beans/verify_otp.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: profileData.id,   // ✅ match OTP to ID, not email
        otp: otp
      })
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {
          fetch(`${API_BASE_URL}/beans/redit_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: profileData.id,
              full_name: formData.name,
              email: formData.email
            })
          })
            .then(() => {
              alert('Email updated successfully!');
              setOtpDialog(false);
              setEditMode(false);
              window.location.reload();
            });
        } else {
          alert(resp.message || 'Invalid OTP');
        }
      });
  };




  const handleThresholdUpdate = () => {
    fetch(`${API_BASE_URL}/beans/update_threshold.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: profileData.id,
        min_temp: formData.minTemp,
        max_temp: formData.maxTemp,
        min_humidity: formData.minHumidity,
        max_humidity: formData.maxHumidity
      })
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {
          alert('Thresholds updated!');
        } else {
          alert('Threshold update failed.');
        }
      });
  };

  if (!profileData) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>My Profile</Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1"><strong>User ID:</strong> {profileData.id}</Typography>
        <Typography variant="subtitle1"><strong>Name:</strong> {profileData.full_name}</Typography>
        <Typography variant="subtitle1"><strong>Email:</strong> {profileData.email}</Typography>
        <Typography variant="subtitle1"><strong>Role:</strong> {profileData.role}</Typography>
        <Button variant="outlined" onClick={handleEdit} sx={{ mt: 2 }}>
          Edit Name & Email
        </Button>
      </Paper>

      {editMode && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">Edit Profile</Typography>
          <TextField
            fullWidth label="Full Name" value={formData.name}
            onChange={handleChange('name')} sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Email" value={formData.email}
            onChange={handleChange('email')} sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleOtpSend} disabled={resendCooldown > 0}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send OTP'}
          </Button>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Environment Thresholds</Typography>
        <TextField
          label="Min Temp (°C)" fullWidth sx={{ mb: 2 }}
          value={formData.minTemp} onChange={handleChange('minTemp')}
        />
        <TextField
          label="Max Temp (°C)" fullWidth sx={{ mb: 2 }}
          value={formData.maxTemp} onChange={handleChange('maxTemp')}
        />
        <TextField
          label="Min Humidity (%)" fullWidth sx={{ mb: 2 }}
          value={formData.minHumidity} onChange={handleChange('minHumidity')}
        />
        <TextField
          label="Max Humidity (%)" fullWidth sx={{ mb: 2 }}
          value={formData.maxHumidity} onChange={handleChange('maxHumidity')}
        />
        <Button variant="contained" onClick={handleThresholdUpdate}>
          Update Thresholds
        </Button>
      </Paper>

      <Dialog open={otpDialog} onClose={() => setOtpDialog(false)}>
        <DialogTitle>Enter OTP</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="OTP" value={otp}
            onChange={(e) => setOtp(e.target.value)} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOtpVerify}>Verify & Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
