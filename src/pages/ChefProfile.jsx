import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import RecipeSocial from "../components/RecipeSocial";

import { getPublicProfile, toggleFollow } from "../services/socialApi";

function ChefProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const result = await getPublicProfile(userId);

        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(err.message || "can't load chef profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      setError("");

      const result = await toggleFollow(userId);

      setData((current) => ({
        ...current,
        isFollowing: result.following,
        stats: {
          ...current.stats,
          followers: result.followersCount,
          following: result.followingCount,
        },
      }));
    } catch (err) {
      setError(err.message || "can't update follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="chef-profile-loading">
          <span className="chef-profile-spinner" />
          <p>Loading Chef profile...</p>
        </main>
        <Footer />
      </>
    );
  }

  const profile = data?.profile;
  const recipes = data?.recipes || [];
  const stats = data?.stats || {};

  if (!profile) {
    return (
      <>
        <Header />
        <main className="chef-profile-loading">
          <h2>Chef profile unavailable</h2>
          <p>{error || "This profile could not be found."}</p>
          <button
            type="button"
            className="chef-profile-save-button"
            onClick={() => navigate("/community")}
          >
            Back to Community
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const chefName = profile.chef || profile.name || "Savorly Chef";
  const initial = chefName.trim().charAt(0).toUpperCase() || "C";

  return (
    <>
      <Header />

      <main className="chef-profile-page">
        <button
          type="button"
          className="chef-profile-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <section className="chef-profile-hero">
          <div className="chef-profile-cover-shape" />

          <div className="chef-profile-identity">
            <div className="chef-profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={chefName} />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <div className="chef-profile-identity-copy">
              <span className="chef-profile-eyebrow">
                SAVORLY COMMUNITY CHEF
              </span>
              <h1>{chefName}</h1>
              <p>
                {profile.bio || "Sharing delicious recipes with the community."}
              </p>
            </div>
          </div>

          {data.isOwnProfile ? (
            <button
              type="button"
              className="chef-profile-view-button"
              onClick={() => navigate("/profile")}
            >
              Edit Profile
            </button>
          ) : (
            <button
              type="button"
              className={`chef-profile-follow-button ${
                data.isFollowing ? "is-following" : ""
              }`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading
                ? "Updating..."
                : data.isFollowing
                  ? "✓ Following"
                  : "+ Follow Chef"}
            </button>
          )}

          <div className="chef-profile-stats">
            <div>
              <strong>{stats.recipes ?? recipes.length}</strong>
              <span>Recipes</span>
            </div>
            <div>
              <strong>{stats.followers ?? 0}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{stats.following ?? 0}</strong>
              <span>Following</span>
            </div>
          </div>
        </section>

        {error && (
          <p className="chef-profile-message is-error" role="alert">
            {error}
          </p>
        )}

        <section className="chef-profile-panel chef-public-recipes">
          <div className="chef-profile-panel-heading">
            <span className="chef-profile-section-icon">♨</span>
            <div>
              <p>MADE WITH PASSION</p>
              <h2>{chefName}'s Recipes</h2>
            </div>
          </div>

          {recipes.length > 0 ? (
            <div className="chef-profile-recipe-grid">
              {recipes.map((recipe) => (
                <article
                  className="community-social-item"
                  key={recipe._id || recipe.id}
                >
                  <RecipeCard recipe={recipe} />
                  <RecipeSocial recipe={recipe} isLoggedIn />
                </article>
              ))}
            </div>
          ) : (
            <div className="chef-profile-empty">
              <span>🍲</span>
              <h3>No published recipes yet</h3>
              <p>Check back later to discover this chef's creations.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ChefProfile;
