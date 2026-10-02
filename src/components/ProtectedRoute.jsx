import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useSelector(
    (state) => state.auth
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Loading...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

