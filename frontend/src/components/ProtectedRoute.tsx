import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, user }: any) {
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user needs to change password (but not if already on change-password page)
  if (user.password_change_required === true && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  
  return children;
}

export default ProtectedRoute;
