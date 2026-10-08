import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../services/authApi";
import { logout } from "../redux/authSlice";
import { clearFavorites } from "../redux/favoriteSlice";

function Header({ onCategoryChange }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [recipesOpen, setRecipesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const currentUser = useSelector((state) => state.auth.user);

  const categories = [
    { name: "Baking", icon: "🥐" },
    { name: "Budget", icon: "💰" },
    { name: "Recipes", icon: "🍝" },
    { name: "Inspiration", icon: "✨" },
    { name: "Health", icon: "🥗" },
  ];

  const closeMenus = () => {
    setRecipesOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const handleCategory = (category) => {
    closeMenus();

    if (onCategoryChange) {
      onCategoryChange(category);
      return;
    }

    navigate("/", {
      state: {
        category,
      },
    });
  };

  const goTo = (path) => {
    closeMenus();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      dispatch(clearFavorites());

      closeMenus();
      navigate("/");
    }
  };

  const userInitial = currentUser?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="main-header">
      <div className="header-container">
        {/* ================= LOGO ================= */}
        <button type="button" className="brand-logo" onClick={() => goTo("/")}>
          <span className="brand-icon-wrapper">
            <span className="brand-icon">🍴</span>
          </span>

          <span className="brand-text">
            <span className="brand-name">Savorly</span>
            <span className="brand-tagline">Taste. Create. Share.</span>
          </span>
        </button>

        {/* ================= MOBILE MENU ================= */}
        <button
          type="button"
          className={`mobile-menu-button ${
            mobileOpen ? "mobile-menu-active" : ""
          }`}
          onClick={() => {
            setMobileOpen((previous) => !previous);
            setRecipesOpen(false);
            setProfileOpen(false);
          }}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* ================= NAVIGATION ================= */}
        <nav
          className={`main-navigation ${
            mobileOpen ? "mobile-navigation-open" : ""
          }`}
        >
          <button type="button" className="nav-link" onClick={() => goTo("/")}>
            <span className="nav-icon">⌂</span>
            Home
          </button>

          {/* Recipes Dropdown */}
          <div className="nav-dropdown">
            <button
              type="button"
              className={`nav-link ${recipesOpen ? "nav-link-active" : ""}`}
              onClick={() => {
                setRecipesOpen((previous) => !previous);
                setProfileOpen(false);
              }}
            >
              <span className="nav-icon">🍳</span>
              Recipes
              <span
                className={`dropdown-arrow ${recipesOpen ? "arrow-open" : ""}`}
              >
                ⌄
              </span>
            </button>

            {recipesOpen && (
              <div className="recipes-dropdown">
                <div className="dropdown-top">
                  <div>
                    <span className="dropdown-eyebrow">EXPLORE</span>

                    <strong>Find your next favorite</strong>
                  </div>

                  <span className="dropdown-sparkle">✨</span>
                </div>

                <button
                  type="button"
                  className="dropdown-all"
                  onClick={() => handleCategory("")}
                >
                  <span className="dropdown-item-icon all-icon">🍽️</span>

                  <span>
                    <strong>All Recipes</strong>
                    <small>Explore everything</small>
                  </span>

                  <span className="dropdown-item-arrow">→</span>
                </button>

                <div className="dropdown-items">
                  {categories.map((category) => (
                    <button
                      type="button"
                      className="dropdown-item"
                      key={category.name}
                      onClick={() => handleCategory(category.name)}
                    >
                      <span className="dropdown-item-icon">
                        {category.icon}
                      </span>

                      <span>{category.name}</span>

                      <span className="dropdown-item-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="nav-link"
            onClick={() => goTo("/community")}
          >
            <span className="nav-icon">👨‍🍳</span>
            Community
          </button>
        </nav>

        {/* ================= RIGHT ACTIONS ================= */}
        <div className="header-actions">
          {isLoggedIn && (
            <button
              type="button"
              className="header-icon-button"
              onClick={() => goTo("/favorites")}
              aria-label="Saved recipes"
            >
              <span>♡</span>
            </button>
          )}

          {/* ================= LOGGED IN ================= */}
          {isLoggedIn ? (
            <div className="profile-dropdown">
              <button
                type="button"
                className={`profile-button ${
                  profileOpen ? "profile-button-active" : ""
                }`}
                onClick={() => {
                  setProfileOpen((previous) => !previous);
                  setRecipesOpen(false);
                }}
              >
                <span className="profile-avatar">{userInitial}</span>

                <span className="profile-name">
                  {currentUser?.name || "User"}
                </span>

                <span
                  className={`profile-arrow ${
                    profileOpen ? "profile-arrow-open" : ""
                  }`}
                >
                  ⌄
                </span>
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-user">
                    <span className="profile-avatar profile-avatar-large">
                      {userInitial}
                    </span>

                    <div className="profile-menu-user-info">
                      <strong>{currentUser?.name || "User"}</strong>

                      <small>{currentUser?.email || ""}</small>
                    </div>
                  </div>

                  <div className="profile-menu-divider"></div>

                  <button type="button" onClick={() => goTo("/profile")}>
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>

                  <button type="button" onClick={() => goTo("/favorites")}>
                    <span>♡</span>
                    <span>Saved Recipes</span>
                  </button>

                  <button type="button" onClick={() => goTo("/community")}>
                    <span>👨‍🍳</span>
                    <span>My Recipes</span>
                  </button>

                  <button type="button" onClick={() => goTo("/create-recipe")}>
                    <span className="create-menu-icon">＋</span>
                    <span>Create Recipe</span>
                  </button>

                  <div className="profile-menu-divider"></div>

                  <button
                    type="button"
                    className="logout-menu-button"
                    onClick={handleLogout}
                  >
                    <span>↪</span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ================= GUEST ================= */
            <div className="guest-actions">
              <button
                type="button"
                className="login-button"
                onClick={() => goTo("/login")}
              >
                Login
              </button>

              <button
                type="button"
                className="signup-button"
                onClick={() => goTo("/signup")}
              >
                <span>Get Started</span>
                <span className="signup-arrow">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
