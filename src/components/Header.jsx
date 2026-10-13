
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { logoutUser } from "../services/authApi";
import {
  getMyProfile,
  clearMyProfileCache,
} from "../services/socialApi";

import { logout } from "../redux/authSlice";
import { clearFavorites } from "../redux/favoriteSlice";

const SESSION_CACHE_DURATION = 15000;

let sessionCache = {
  status: "unknown",
  profile: null,
  checkedAt: 0,
};

let sessionPromise = null;

function cacheSession(status, profile = null) {
  sessionCache = {
    status,
    profile,
    checkedAt: Date.now(),
  };

  return sessionCache;
}

function isSessionCacheFresh() {
  return (
    sessionCache.status !== "unknown" &&
    Date.now() - sessionCache.checkedAt < SESSION_CACHE_DURATION
  );
}

function clearHeaderSession() {
  cacheSession("anonymous");
  sessionPromise = null;
}

function extractProfile(result) {
  return (
    result?.profile ||
    result?.data?.profile ||
    result?.user ||
    result?.data ||
    null
  );
}

function checkSession(force = false) {
  if (!force && isSessionCacheFresh()) {
    return Promise.resolve(sessionCache);
  }

  if (!force && sessionPromise) {
    return sessionPromise;
  }

  if (force) {
    sessionPromise = null;
  }

  const promise = getMyProfile()
    .then((result) => {
      const profile = extractProfile(result);

      if (
        !profile ||
        typeof profile !== "object" ||
        !(
          profile._id ||
          profile.id ||
          profile.email ||
          profile.chef ||
          profile.chefName
        )
      ) {
        throw new Error("Invalid profile response.");
      }

      return cacheSession("authenticated", profile);
    })
    .catch((error) => {
      if (error?.status === 401) {
        return cacheSession("anonymous");
      }

      throw error;
    })
    .finally(() => {
      if (sessionPromise === promise) {
        sessionPromise = null;
      }
    });

  sessionPromise = promise;
  return promise;
}

function Header({ onCategoryChange }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth || {});

  const user =
    auth.user ||
    auth.currentUser ||
    auth.profile ||
    null;

  const reduxIsLoggedIn = Boolean(
    auth.isAuthenticated ||
      auth.isLoggedIn ||
      auth.token ||
      user
  );

  const [recipesOpen, setRecipesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const recipesDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const [chefNameOverride, setChefNameOverride] = useState(
    sessionCache.profile?.chef ||
      sessionCache.profile?.chefName ||
      ""
  );

  const [sessionStatus, setSessionStatus] = useState(() => {
    if (reduxIsLoggedIn) return "authenticated";

    return isSessionCacheFresh()
      ? sessionCache.status
      : "checking";
  });

  const isLoggedIn =
    reduxIsLoggedIn ||
    sessionStatus === "authenticated";

  const categories = [
    "Baking",
    "Budget",
    "Recipes",
    "Inspiration",
    "Health",
  ];

  const displayName =
    chefNameOverride ||
    user?.chef ||
    user?.chefName ||
    user?.name ||
    user?.username ||
    "Chef";

  // Close dropdowns when clicking or touching outside.
  useEffect(() => {
    const handleOutsideInteraction = (event) => {
      const target = event.target;

      if (
        recipesDropdownRef.current &&
        !recipesDropdownRef.current.contains(target)
      ) {
        setRecipesOpen(false);
      }

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setRecipesOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideInteraction
    );

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideInteraction
      );

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const handleUserUpdated = (event) => {
      const updated =
        event.detail?.profile ||
        event.detail?.user ||
        event.detail?.data?.profile ||
        event.detail?.data ||
        event.detail;

      if (!updated || typeof updated !== "object") return;

      const updatedProfile = {
        ...(sessionCache.profile || {}),
        ...updated,
      };

      cacheSession("authenticated", updatedProfile);

      setChefNameOverride(
        updatedProfile.chef ||
          updatedProfile.chefName ||
          ""
      );

      setSessionStatus("authenticated");
    };

    const loadSession = async () => {
      if (reduxIsLoggedIn) {
        setSessionStatus("authenticated");

        if (
          isSessionCacheFresh() &&
          sessionCache.status === "authenticated"
        ) {
          setChefNameOverride(
            sessionCache.profile?.chef ||
              sessionCache.profile?.chefName ||
              ""
          );

          return;
        }

        clearMyProfileCache();
      } else if (!isSessionCacheFresh()) {
        setSessionStatus("checking");
      } else {
        setSessionStatus(sessionCache.status);
      }

      try {
        const result = await checkSession(reduxIsLoggedIn);

        if (!active) return;

        if (result.status === "authenticated") {
          setChefNameOverride(
            result.profile?.chef ||
              result.profile?.chefName ||
              ""
          );

          setSessionStatus("authenticated");
        } else {
          setChefNameOverride("");
          setSessionStatus("anonymous");

          if (reduxIsLoggedIn) {
            clearMyProfileCache();
            clearHeaderSession();

            dispatch(logout());
            dispatch(clearFavorites());

            window.dispatchEvent(
              new Event("savorly:logout")
            );
          }
        }
      } catch (error) {
        if (!active) return;

        console.error("Header session check failed:", error);

        if (reduxIsLoggedIn) {
          setSessionStatus("authenticated");
        } else {
          cacheSession("anonymous");
          setSessionStatus("anonymous");
          setChefNameOverride("");
        }
      }
    };

    loadSession();

    window.addEventListener(
      "savorly:user-updated",
      handleUserUpdated
    );

    return () => {
      active = false;

      window.removeEventListener(
        "savorly:user-updated",
        handleUserUpdated
      );
    };
  }, [reduxIsLoggedIn, dispatch]);

  const closeMenus = () => {
    setRecipesOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const handleCategorySelect = (category) => {
    closeMenus();

    if (onCategoryChange) {
      onCategoryChange(category);
      return;
    }

    navigate("/", {
      state: {
        selectedCategory: category,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearMyProfileCache();
      clearHeaderSession();

      dispatch(logout());
      dispatch(clearFavorites());

      window.dispatchEvent(
        new Event("savorly:logout")
      );

      setChefNameOverride("");
      setSessionStatus("anonymous");

      closeMenus();

      navigate("/login", { replace: true });
    }
  };

  const navLinkClass = ({ isActive }) =>
    `savorly-nav-link${isActive ? " active" : ""}`;

  return (
    <header
      className={`savorly-header${
        sessionStatus === "checking" && !reduxIsLoggedIn
          ? " savorly-header-checking"
          : ""
      }`}
    >
      <div className="savorly-header-inner">
        {/* Brand */}
        <button
          type="button"
          className="savorly-brand"
          onClick={() => {
            closeMenus();
            navigate("/");
          }}
          aria-label="Savorly home"
        >
          <span
            className="savorly-brand-icon"
            aria-hidden="true"
          >
            ✦
          </span>

          <span>Savorly</span>
        </button>

        {/* Navigation */}
        <nav
          className={`savorly-nav${
            mobileOpen ? " mobile-open" : ""
          }`}
          aria-label="Main navigation"
        >
          <NavLink
            to="/"
            end
            className={navLinkClass}
            onClick={closeMenus}
          >
            Home
          </NavLink>

          {/* Recipes dropdown */}
          <div
            className="savorly-dropdown"
            ref={recipesDropdownRef}
          >
            <button
              type="button"
              className={`savorly-nav-link savorly-dropdown-trigger${
                recipesOpen ? " active" : ""
              }`}
              onClick={() => {
                setRecipesOpen((open) => !open);
                setProfileOpen(false);
              }}
              aria-expanded={recipesOpen}
              aria-haspopup="true"
            >
              Recipes

              <span
                className="savorly-chevron"
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {recipesOpen && (
              <div className="savorly-dropdown-menu">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className="savorly-dropdown-item"
                    onClick={() =>
                      handleCategorySelect(category)
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <NavLink
            to="/community"
            className={navLinkClass}
            onClick={closeMenus}
          >
            Community
          </NavLink>

          {isLoggedIn && (
            <NavLink
              to="/my-recipes"
              className={navLinkClass}
              onClick={closeMenus}
            >
              My Kitchen
            </NavLink>
          )}
        </nav>

        {/* Header actions */}
        <div className="savorly-header-actions">
          {isLoggedIn ? (
            <div
              className="savorly-dropdown savorly-profile-dropdown"
              ref={profileDropdownRef}
            >
              <button
                type="button"
                className="savorly-profile-trigger"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setRecipesOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span
                  className="savorly-avatar"
                  aria-hidden="true"
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>

                <span className="savorly-profile-name">
                  {displayName}
                </span>

                <span
                  className="savorly-chevron"
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {profileOpen && (
                <div className="savorly-dropdown-menu savorly-profile-menu">
                  <div className="savorly-profile-menu-heading">
                    <span className="savorly-profile-menu-label">
                      Signed in as
                    </span>

                    <strong>{displayName}</strong>
                  </div>

                  <button
                    type="button"
                    className="savorly-dropdown-item"
                    onClick={() => {
                      closeMenus();
                      navigate("/profile");
                    }}
                  >
                    👤 My Profile
                  </button>

                  <button
                    type="button"
                    className="savorly-dropdown-item"
                    onClick={() => {
                      closeMenus();
                      navigate("/liked-recipes");
                    }}
                  >
                    ❤️ Liked Recipes
                  </button>

                  <button
                    type="button"
                    className="savorly-dropdown-item"
                    onClick={() => {
                      closeMenus();
                      navigate("/favorites");
                    }}
                  >
                    🔖 Favorites
                  </button>

                  <button
                    type="button"
                    className="savorly-dropdown-item savorly-logout-item"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="savorly-auth-actions">
              <button
                type="button"
                className="savorly-login-button"
                onClick={() => {
                  closeMenus();
                  navigate("/login");
                }}
              >
                Log In
              </button>

              <button
                type="button"
                className="savorly-signup-button"
                onClick={() => {
                  closeMenus();
                  navigate("/signup");
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="savorly-mobile-toggle"
            onClick={() =>
              setMobileOpen((open) => !open)
            }
            aria-label={
              mobileOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
