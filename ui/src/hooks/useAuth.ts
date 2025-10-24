import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('isAuthenticated');
      const user = sessionStorage.getItem('user');
      
      if (authStatus === 'true' && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate('/');
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const logout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/');
  };

  return { isAuthenticated, loading, logout };
};
