import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="savorly-footer">
      <div className="savorly-footer-main">
        {/* BRAND */}
        <div className="savorly-footer-brand">
          <Link to="/" className="savorly-footer-logo">
            <span className="savorly-footer-logo-icon">S</span>
            <span>Savorly</span>
          </Link>

          <p>
            Discover delicious recipes, try something new, and bring a little
            more joy to your kitchen.
          </p>

          <span className="savorly-footer-tagline">
            Made for people who love good food. 🍊
          </span>
        </div>

        {/* QUICK LINKS */}
        <div className="savorly-footer-column">
          <h3>Explore</h3>

          <Link to="/">Our Recipes</Link>
          <Link to="/community?tab=users">User Recipes</Link>
          <Link to="/community?tab=my">My Recipes</Link>
          <Link to="/create-recipe">Create Recipe</Link>
        </div>

        {/* YOUR ACCOUNT */}
        <div className="savorly-footer-column">
          <h3>Your Savorly</h3>

          <Link to="/favorites">My Favorites</Link>
          <Link to="/profile">My Profile</Link>
          <Link to="/community">Community</Link>
        </div>

        {/* FOOTER CTA */}
        <div className="savorly-footer-note">
          <span className="savorly-footer-note-icon">🥗</span>

          <h3>Something delicious awaits.</h3>

          <p>Find your next favorite meal and make it your own.</p>

          <Link to="/" className="savorly-footer-button">
            Explore Recipes <span>→</span>
          </Link>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="savorly-footer-bottom">
        <p>© {currentYear} Savorly. All rights reserved.</p>

        <span>
          Cook with love <span aria-label="love">♥</span>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
