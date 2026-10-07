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

  const categories = ["Baking", "Budget", "Recipes", "Inspiration", "Health"];

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

  const goTo = (path) => {
    closeMenus();
    navigate(path);
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <button type="button" className="brand-logo" onClick={() => goTo("/")}>
          <span className="brand-icon">🍽️</span>
          <span>Savorly</span>
        </button>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileOpen((previous) => !previous)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <nav
          className={`main-navigation ${
            mobileOpen ? "mobile-navigation-open" : ""
          }`}
        >
          <button type="button" className="nav-link" onClick={() => goTo("/")}>
            Home
          </button>

          <div className="nav-dropdown">
            <button
              type="button"
              className={`nav-link ${recipesOpen ? "nav-link-active" : ""}`}
              onClick={() => setRecipesOpen((previous) => !previous)}
            >
              Recipes
              <span className="dropdown-arrow">↓</span>
            </button>

            {recipesOpen && (
              <div className="recipes-dropdown">
                <div className="dropdown-header">
                  <span>EXPLORE</span>
                  <strong>Recipe Collections</strong>
                </div>

                <button type="button" onClick={() => handleCategory("")}>
                  <span>✨</span>
                  All Recipes
                </button>

                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => handleCategory(category)}
                  >
                    <span>
                      {category === "Baking"
                        ? "🥐"
                        : category === "Budget"
                          ? "💰"
                          : category === "Recipes"
                            ? "🍽️"
                            : category === "Inspiration"
                              ? "💡"
                              : "🥗"}
                    </span>

                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="nav-link"
            onClick={() => goTo("/community")}
          >
            Community
          </button>
        </nav>

        <div className="header-actions">
          {isLoggedIn && (
            <button
              type="button"
              className="header-icon-button"
              onClick={() => goTo("/favorites")}
              aria-label="Favorites"
            >
              ♡
            </button>
          )}

          {isLoggedIn ? (
            <div className="profile-dropdown">
              <button
                type="button"
                className="profile-button"
                onClick={() => setProfileOpen((previous) => !previous)}
              >
                <span className="profile-avatar">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>

                <span className="profile-name">
                  {currentUser?.name || "User"}
                </span>

                <span className="dropdown-arrow">↓</span>
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-user">
                    <span className="profile-avatar large">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>

                    <div>
                      <strong>{currentUser?.name || "User"}</strong>

                      <small>{currentUser?.email || ""}</small>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  <button type="button" onClick={() => goTo("/profile")}>
                    👤 Profile
                  </button>

                  <button type="button" onClick={() => goTo("/community")}>
                    👨‍🍳 My Recipes
                  </button>

                  <button type="button" onClick={() => goTo("/create-recipe")}>
                    ＋ Create Recipe
                  </button>

                  <div className="profile-menu-divider" />

                  <button
                    type="button"
                    className="logout-menu-button"
                    onClick={handleLogout}
                  >
                    ↪ Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
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
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
