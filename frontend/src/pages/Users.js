import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Users({ user, token }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: ''
  });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Only admins can access this page
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u.id);
    setEditForm({
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role
    });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({ email: '', first_name: '', last_name: '', role: '' });
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (userId) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        setSuccess('User updated successfully!');
        setEditingUser(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update user');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'role-badge role-admin';
      case 'doctor': return 'role-badge role-doctor';
      case 'receptionist': return 'role-badge role-receptionist';
      case 'undefined': return 'role-badge role-undefined';
      default: return 'role-badge';
    }
  };

  if (loading) {
    return <div className="content">Loading...</div>;
  }

  return (
    <div className="content">
      <div className="users-section">
        <h1>User Management</h1>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  {editingUser === u.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          name="first_name"
                          value={editForm.first_name}
                          onChange={handleChange}
                          className="table-input"
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={editForm.last_name}
                          onChange={handleChange}
                          className="table-input"
                        />
                      </td>
                      <td>{u.username}</td>
                      <td>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleChange}
                          className="table-input"
                        />
                      </td>
                      <td>
                        <select
                          name="role"
                          value={editForm.role}
                          onChange={handleChange}
                          className="table-select"
                        >
                          <option value="undefined">Undefined</option>
                          <option value="admin">Admin</option>
                          <option value="doctor">Doctor</option>
                          <option value="receptionist">Receptionist</option>
                        </select>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleSave(u.id)} className="btn-save">
                          Save
                        </button>
                        <button onClick={handleCancel} className="btn-cancel">
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={getRoleBadgeClass(u.role)}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleEdit(u)} className="btn-edit">
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;
