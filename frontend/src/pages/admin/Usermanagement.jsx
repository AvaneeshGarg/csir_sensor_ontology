import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../config';

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#dae2f7',
    minHeight: '100vh',
    animation: 'fadeInUp 0.5s ease-out forwards'
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: '20px',
    textAlign: 'center',
  },
  headerTitle: {
    color: 'white',
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  button: {
    marginBottom: '16px',
    backgroundColor: '#1e3a8a',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginLeft: '20px',
    marginTop: '24px',
    transition: 'background-color 0.2s ease',
  },
  tableContainer: {
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    overflowX: 'auto',
    padding: '4px',
    marginRight: '16px',
    marginLeft: '16px',
    marginBottom: '20px',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    minWidth: '500px',
    borderCollapse: 'collapse',
  },
  tableHead: {
    backgroundColor: '#e0e7ff',
  },
  tableHeadCell: {
    fontWeight: 'bold',
    backgroundColor: '#e0e7ff',
    color: '#1e3a8a',
    padding: '16px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
  },
  tableRowOdd: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  actionButton: {
    marginRight: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
  },
  editButton: {
    color: '#1976d2',
    borderColor: '#1976d2',
  },
  deleteButton: {
    color: '#d32f2f',
    borderColor: '#d32f2f',
  },
  input: {
    padding: '8px',
    margin: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ full_name: '', email: '', role: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/beans/fetch_users.php`);
      const data = await res.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleAddUser = async () => {
    await fetch(`${API_BASE_URL}/beans/add_user.php`, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' },
    });
    setFormData({ full_name: '', email: '', role: '' });
    fetchUsers();
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setFormData({ full_name: user.full_name, email: user.email, role: user.role });
  };

  const handleUpdateUser = async () => {
    await fetch(`${API_BASE_URL}/beans/redit_user.php`, {
      method: 'POST',
      body: JSON.stringify({ id: editingId, ...formData }),
      headers: { 'Content-Type': 'application/json' },
    });
    setEditingId(null);
    setFormData({ full_name: '', email: '', role: '' });
    fetchUsers();
  };

  const handleDeleteUser = async (id) => {
    await fetch(`${API_BASE_URL}/beans/delete_user.php`, {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    });
    fetchUsers();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleButtonHover = (e, isHover, type) => {
    const bgColors = {
      main: ['#16326c', '#1e3a8a'],
      edit: ['#1976d2', 'transparent'],
      delete: ['#d32f2f', 'transparent']
    };

    e.target.style.backgroundColor = isHover ? bgColors[type][0] : bgColors[type][1];

    if (styles[`${type}Button`]) {
      e.target.style.color = isHover ? 'white' : styles[`${type}Button`].color;
    }
  };

  return (
    <div style={styles.container}>
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

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>User Management</h1>
      </div>

      <div style={{ marginLeft: '20px' }}>
        <input
          style={styles.input}
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleInputChange}
        />
        <input
          style={styles.input}
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          style={styles.input}
          name="role"
          placeholder="Role (Admin/User/Mod)"
          value={formData.role}
          onChange={handleInputChange}
        />
        <button
          style={styles.button}
          onClick={editingId ? handleUpdateUser : handleAddUser}
          onMouseEnter={(e) => handleButtonHover(e, true, 'main')}
          onMouseLeave={(e) => handleButtonHover(e, false, 'main')}
        >
          {editingId ? 'Update User' : 'Add User'}
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeadCell}>Name</th>
              <th style={styles.tableHeadCell}>Email</th>
              <th style={styles.tableHeadCell}>Access</th>
              <th style={styles.tableHeadCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td style={styles.tableCell} colSpan="4">No users found.</td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    ...styles.tableRow,
                    ...(index % 2 === 1 ? styles.tableRowOdd : {})
                  }}
                >
                  <td style={styles.tableCell}>{user.full_name}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>{user.role}</td>
                  <td style={styles.tableCell}>
                    <button
                      style={{ ...styles.actionButton, ...styles.editButton }}
                      onMouseEnter={(e) => handleButtonHover(e, true, 'edit')}
                      onMouseLeave={(e) => handleButtonHover(e, false, 'edit')}
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      onMouseEnter={(e) => handleButtonHover(e, true, 'delete')}
                      onMouseLeave={(e) => handleButtonHover(e, false, 'delete')}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
