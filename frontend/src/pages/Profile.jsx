import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function Profile({ user, token, onUserUpdate }) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    password: "",
    role: user.role,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const updateData = {};
    if (profileData.email !== user.email) updateData.email = profileData.email;
    if (profileData.first_name !== user.first_name)
      updateData.first_name = profileData.first_name;
    if (profileData.last_name !== user.last_name)
      updateData.last_name = profileData.last_name;
    if (profileData.password) updateData.password = profileData.password;
    if (profileData.role !== user.role) updateData.role = profileData.role;

    if (Object.keys(updateData).length === 0) {
      setError("No changes to save");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        onUserUpdate(data);
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setError(data.detail || "An error occurred");
      }
    } catch (err) {
      setError("Connection error");
    }
  };

  return (
    <div className="content">
      <div className="profile-section">
        <h1>Edit Profile</h1>
        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={profileData.first_name}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={profileData.last_name}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password (leave blank to keep current)</label>
            <input
              type="password"
              name="password"
              placeholder="Enter new password"
              value={profileData.password}
              onChange={handleProfileChange}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              name="role"
              value={profileData.role}
              onChange={handleProfileChange}
              disabled={user.role !== "admin"}
              className={user.role !== "admin" ? "disabled-select" : ""}
            >
              <option value="undefined">Undefined</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
            {user.role !== "admin" && (
              <small className="help-text">Only admins can change roles</small>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <div className="button-group">
            <button type="submit">Save Changes</button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="secondary-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
