function Dashboard({ user }) {
  return (
    <div className="content">
      <h1>Welcome, {user.first_name} {user.last_name}!</h1>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
    </div>
  );
}

export default Dashboard;
