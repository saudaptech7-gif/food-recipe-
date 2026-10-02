import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../services/authApi";
import { logout } from "../redux/authSlice";
import { setFavorites } from "../redux/favoriteSlice";

function Header({ onCategoryChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoggedIn } = useSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(error.message);
    } finally {
      dispatch(logout());
      dispatch(setFavorites([]));
      navigate("/login");
    }
  };

  const handleCategory = (category) => {
    onCategoryChange(category);
    setMenuOpen(false);
  };

  const handleProfile = () => {
    setMenuOpen(false);
    navigate("/profile");
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* LOGO */}
        <button className="logo" onClick={() => navigate("/")}>
          FoodRecipe
        </button>

        {/* NAVIGATION */}
        <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
          <button onClick={() => handleCategory("")}>Home</button>

          <button onClick={() => navigate("/favorites")}>♥ Favorites</button>

          <button onClick={() => handleCategory("baking")}>Baking</button>

          <button onClick={() => handleCategory("budget")}>Budget</button>

          <button onClick={() => handleCategory("recipes")}>Recipes</button>

          <button onClick={() => handleCategory("inspiration")}>
            Inspiration
          </button>

          <button onClick={() => handleCategory("health")}>Health</button>
        </nav>

        {/* HEADER ACTIONS */}
        <div className="header-actions">
          {isLoggedIn && user ? (
            <>
              {/* PROFILE */}
              <button className="profile-button" onClick={handleProfile}>
                <span className="profile-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </span>

                <span className="profile-name">{user.name}</span>
              </button>

              {/* LOGOUT */}
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              {/* LOGIN */}
              <button
                className="login-button"
                onClick={() => navigate("/login")}
              >
                Login
              </button>

              {/* SIGN UP */}
              <button
                className="signup-button"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* MOBILE MENU */}
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>
    </header>
  );
}

export default Header;
