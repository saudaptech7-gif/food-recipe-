import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { getCurrentUser } from "../services/authApi";
import { setUser, logout } from "../redux/authSlice";
import { setFavorites } from "../redux/favoriteSlice";

function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();

        dispatch(setUser(data.user));

        dispatch(setFavorites(data.user.favorites || []));
      } catch (error) {
        error
        dispatch(logout());
        dispatch(setFavorites([]));
      }
    };

    checkAuth();
  }, [dispatch]);

  return children;
}

export default AuthInitializer;
