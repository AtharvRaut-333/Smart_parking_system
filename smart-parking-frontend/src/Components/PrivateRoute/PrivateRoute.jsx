import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../../api/axios"; // Axios instance with `withCredentials: true`
import { LogIn } from "lucide-react";

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); 

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    const localUser = localStorage.getItem("user");

    if (localToken && localUser) {
      // Both token and user data found in localStorage
      setIsAuthenticated(true);
    } else {
      // Check cookie auth as fallback
      const checkCookieAuth = async () => {
        try {
          const response = await api.get("/user/success"); 
          if (response.data) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          setIsAuthenticated(false);
        }
      };
      checkCookieAuth();
    }
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
