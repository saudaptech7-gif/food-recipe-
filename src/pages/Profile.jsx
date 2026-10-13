import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Header from "../components/Header";
import { getMyProfile, updateMyProfile } from "../services/socialApi";

function extractProfile(result) {
  return result?.profile || result?.data?.profile || result?.user || null;
}

function Profile() {
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth || {});

  const reduxUser = auth.user || auth.currentUser || auth.profile || null;

  const [profile, setProfile] = useState(reduxUser);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: reduxUser?.name || "",
    chef: reduxUser?.chef || reduxUser?.chefName || "Home Chef",
    bio: reduxUser?.bio || "",
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const result = await getMyProfile();
        const currentProfile = extractProfile(result);

        if (!currentProfile) {
          throw new Error("Profile information was not returned.");
        }

        if (!active) return;

        setProfile(currentProfile);

        setForm({
          name: currentProfile.name || "",
          chef: currentProfile.chef || currentProfile.chefName || "Home Chef",
          bio: currentProfile.bio || "",
        });
      } catch (err) {
        if (!active) return;

        if (err?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(err.message || "Could not load your profile.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  const displayName =
    profile?.name || profile?.username || reduxUser?.name || "Savorly User";

  const email = profile?.email || reduxUser?.email || "Email not available";

  const chefName =
    profile?.chef ||
    profile?.chefName ||
    reduxUser?.chef ||
    reduxUser?.chefName ||
    "Home Chef";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await updateMyProfile({
        name: form.name.trim(),
        chef: form.chef.trim(),
        bio: form.bio.trim(),
      });

      const updatedProfile = extractProfile(result) || {
        ...profile,
        name: form.name.trim(),
        chef: form.chef.trim(),
        bio: form.bio.trim(),
      };

      setProfile(updatedProfile);

      setForm({
        name: updatedProfile.name || form.name,
        chef: updatedProfile.chef || updatedProfile.chefName || form.chef,
        bio: updatedProfile.bio || form.bio,
      });

      setEditing(false);
      setMessage("Profile updated successfully.");

      window.dispatchEvent(
        new CustomEvent("savorly:user-updated", {
          detail: {
            profile: updatedProfile,
          },
        }),
      );
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

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

        <header className="profile-heading">
          <span>YOUR ACCOUNT</span>
          <h1>My Profile</h1>
          <p>
            Manage your account and explore your personal recipe collections.
          </p>
        </header>

        {loading ? (
          <div className="profile-loading">
            <div className="loading-spinner" />
            <p>Loading your profile...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="profile-alert profile-alert-error">{error}</div>
            )}

            {message && (
              <div className="profile-alert profile-alert-success">
                {message}
              </div>
            )}

            <section className="profile-card">
              <div className="profile-user-header">
                <div className="profile-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="profile-user-copy">
                  <span className="profile-welcome-label">WELCOME BACK</span>

                  <h2>{displayName}</h2>
                  <p>{email}</p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    className="profile-secondary-button"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setEditing(true);
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-info-icon">👤</span>
                    <div>
                      <small>Full Name</small>
                      <strong>{displayName}</strong>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <span className="profile-info-icon">✉️</span>
                    <div>
                      <small>Email Address</small>
                      <strong>{email}</strong>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <span className="profile-info-icon">👨‍🍳</span>
                    <div>
                      <small>Chef Name</small>
                      <strong>{chefName}</strong>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <span className="profile-info-icon">📝</span>
                    <div>
                      <small>About Me</small>
                      <strong>{profile?.bio || "No bio added yet"}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="profile-edit-form" onSubmit={handleSave}>
                  <div className="profile-form-field">
                    <label htmlFor="profile-name">Full Name</label>
                    <input
                      id="profile-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      maxLength={80}
                      required
                    />
                  </div>

                  <div className="profile-form-field">
                    <label htmlFor="profile-chef">Chef Name</label>
                    <input
                      id="profile-chef"
                      name="chef"
                      value={form.chef}
                      onChange={handleChange}
                      maxLength={40}
                      required
                    />
                  </div>

                  <div className="profile-form-field">
                    <label htmlFor="profile-bio">About Me</label>
                    <textarea
                      id="profile-bio"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      rows={4}
                      maxLength={280}
                      placeholder="Tell the community about yourself..."
                    />
                  </div>

                  <div className="profile-form-actions">
                    <button
                      type="submit"
                      className="profile-primary-button"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      className="profile-secondary-button"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false);
                        setError("");

                        setForm({
                          name: profile?.name || "",
                          chef:
                            profile?.chef || profile?.chefName || "Home Chef",
                          bio: profile?.bio || "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="profile-collections">
              <div className="profile-section-heading">
                <span>YOUR COLLECTIONS</span>
                <h2>Your Recipe Activity</h2>
                <p>Liked recipes and saved favorites are separate.</p>
              </div>

              <div className="profile-collection-grid">
                <button
                  type="button"
                  className="profile-collection-card"
                  onClick={() => navigate("/liked-recipes")}
                >
                  <span className="profile-collection-icon">❤️</span>
                  <span className="profile-collection-copy">
                    <strong>Liked Recipes</strong>
                    <small>Community recipes you have liked.</small>
                  </span>
                  <span className="profile-collection-arrow">→</span>
                </button>

                <button
                  type="button"
                  className="profile-collection-card"
                  onClick={() => navigate("/favorites")}
                >
                  <span className="profile-collection-icon">🔖</span>
                  <span className="profile-collection-copy">
                    <strong>Favorites</strong>
                    <small>Recipes saved using Add to Favorites.</small>
                  </span>
                  <span className="profile-collection-arrow">→</span>
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
