import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";

function Profile() {
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  return (
    <div className="profile-page">
      <Header />

      <main className="profile-container">
        <button
          type="button"
          className="profile-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="profile-heading">
          <span>YOUR ACCOUNT</span>

          <h1>Profile</h1>

          <p>Manage your Savorly profile and personal information.</p>
        </div>

        <section className="profile-card">
          <div className="profile-card-title">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <h2>{user?.name || "User"}</h2>

              <p>{user?.email || ""}</p>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-icon">👤</span>

              <div>
                <small>Name</small>

                <strong>{user?.name || "Not available"}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">✉️</span>

              <div>
                <small>Email</small>

                <strong>{user?.email || "Not available"}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <span className="profile-info-icon">👨‍🍳</span>

              <div>
                <small>Chef Profile</small>

                <strong>{user?.chef || "Home Chef"}</strong>
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          className="profile-recipes-button"
          onClick={() => navigate("/community")}
        >
          👨‍🍳 View My Recipes
        </button>
      </main>
    </div>
  );
}

export default Profile;
