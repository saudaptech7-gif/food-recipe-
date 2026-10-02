import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getRecipes } from "../services/recipeApi";
import { getFavorites } from "../services/favoriteApi";
import { logoutUser } from "../services/authApi";

import { logout } from "../redux/authSlice";
import { setFavorites } from "../redux/favoriteSlice";

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [totalRecipes, setTotalRecipes] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  const userName = user?.name || "User";
  const userEmail = user?.email || "No email available";

  const firstLetter = userName.charAt(0).toUpperCase();

  // Fetch total recipes and favorites
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [recipesData, favoritesData] = await Promise.all([
          getRecipes({
            page: 1,
            limit: 1,
          }),
          getFavorites(),
        ]);

        setTotalRecipes(recipesData.totalRecipes || 0);

        setFavoriteCount(favoritesData.favorites?.length || 0);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      }
    };

    loadProfileData();
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logoutUser();

      // Clear Redux auth
      dispatch(logout());

      // Clear Redux favorites
      dispatch(setFavorites([]));

      // Go to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="profile-page">
      <section className="profile-container">
        {/* PROFILE HEADER */}
        <div className="profile-header">
          <div className="profile-avatar">{firstLetter}</div>

          <div className="profile-heading">
            <p>YOUR ACCOUNT</p>

            <h1>My Profile</h1>

            <span>Manage your personal information</span>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="profile-card">
          <div className="profile-card-title">
            <div>
              <p>ACCOUNT INFORMATION</p>

              <h2>Personal Details</h2>
            </div>
          </div>

          <div className="profile-info-grid">
            {/* NAME */}
            <div className="profile-info-item">
              <span className="profile-info-icon">👤</span>

              <div>
                <small>Name</small>

                <strong>{userName}</strong>
              </div>
            </div>

            {/* EMAIL */}
            <div className="profile-info-item">
              <span className="profile-info-icon">✉️</span>

              <div>
                <small>Email</small>

                <strong>{userEmail}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="profile-card profile-stats-card">
          <div className="profile-card-title">
            <div>
              <p>QUICK ACTIONS</p>

              <h2>Explore Your Account</h2>
            </div>
          </div>

          <div className="profile-stats">
            {/* FAVORITES */}
            <button
              type="button"
              className="profile-stat"
              onClick={() => navigate("/favorites")}
            >
              <span className="profile-stat-icon">❤️</span>

              <strong>Favorites</strong>

              <small>{favoriteCount} saved recipes</small>
            </button>

            {/* RECIPES */}
            <button
              type="button"
              className="profile-stat"
              onClick={() => navigate("/")}
            >
              <span className="profile-stat-icon">🍳</span>

              <strong>Recipes</strong>

              <small>{totalRecipes} recipes available</small>
            </button>

            {/* ACCOUNT */}
            <button
              type="button"
              className="profile-stat"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              <span className="profile-stat-icon">👤</span>

              <strong>Account</strong>

              <small>View your personal details</small>
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          className="profile-logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <span>↪</span>

          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </section>
    </main>
  );
}

export default Profile;
