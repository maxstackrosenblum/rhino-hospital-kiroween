function Dashboard({ user }) {
  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'role-badge role-admin';
      case 'doctor': return 'role-badge role-doctor';
      case 'receptionist': return 'role-badge role-receptionist';
      case 'undefined': return 'role-badge role-undefined';
      default: return 'role-badge';
    }
  };

  return (
    <div className="content">
      <h1>Welcome, {user.first_name} {user.last_name}!</h1>
      <div className="user-info">
        <p>Username: {user.username}</p>
        <p>Email: {user.email}</p>
        <p>
          Role: <span className={getRoleBadgeClass(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
        </p>
        <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default Dashboard;
