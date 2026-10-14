/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getRecipeSocial,
  toggleRecipeLike,
  toggleFollow,
  addRecipeComment,
  deleteRecipeComment,
} from "../services/socialApi";


function RecipeSocial({ recipe, isLoggedIn = false }) {
  const navigate = useNavigate();

  const recipeId = recipe?._id;
  const isCommunityRecipe = recipe?.recipeType === "community";

  const [isOpen, setIsOpen] = useState(false);
  const [social, setSocial] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Load social data only when the comments panel is opened.
  useEffect(() => {
    if (!isCommunityRecipe || !recipeId || !isOpen || !isLoggedIn) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadSocial = async () => {
      setLoading(true);
      setMessage("");
      setSocial(null);

      try {
        const result = await getRecipeSocial(recipeId);

        if (cancelled) return;

        const data =
          result?.social || result?.data?.social || result?.data || result;

        setSocial(data);
      } catch (error) {
        if (!cancelled) {
          setMessage(error?.message || "Could not load recipe interactions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSocial();

    return () => {
      cancelled = true;
    };
  }, [recipeId, isCommunityRecipe, isLoggedIn, isOpen, retryCount]);

  if (!isCommunityRecipe || !recipeId) {
    return null;
  }

  const comments = Array.isArray(social?.comments) ? social.comments : [];

  const owner = social?.owner;

  const loginFirst = () => {
    navigate("/login");
  };

  const handleTogglePanel = () => {
    setIsOpen((current) => !current);
  };

  // Like / unlike a recipe.
  const handleLike = async () => {
    if (!isLoggedIn) {
      loginFirst();
      return;
    }

    if (social?.isOwnRecipe || working) {
      return;
    }

    try {
      setWorking(true);
      setMessage("");

      const result = await toggleRecipeLike(recipeId);

      setSocial((current) => {
        if (!current) return current;

        return {
          ...current,
          likedByMe: result.liked,
          likesCount: result.likesCount,
        };
      });
    } catch (error) {
      setMessage(error?.message || "Could not update like.");
    } finally {
      setWorking(false);
    }
  };

  // Follow / unfollow the recipe owner.
  const handleFollow = async () => {
    if (!isLoggedIn) {
      loginFirst();
      return;
    }

    if (!owner?._id || social?.isOwnRecipe || working) {
      return;
    }

    try {
      setWorking(true);
      setMessage("");

      const result = await toggleFollow(owner._id);

      setSocial((current) => {
        if (!current) return current;

        return {
          ...current,
          isFollowingOwner: result.following,
          owner: current.owner
            ? {
                ...current.owner,
                followersCount:
                  result.followersCount ?? current.owner.followersCount,
              }
            : current.owner,
        };
      });
    } catch (error) {
      setMessage(error?.message || "Could not update follow status.");
    } finally {
      setWorking(false);
    }
  };

  // Add a comment.
  const handleComment = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      loginFirst();
      return;
    }

    const cleanText = commentText.trim();

    if (!cleanText || working) {
      return;
    }

    try {
      setWorking(true);
      setMessage("");

      const result = await addRecipeComment(recipeId, cleanText);

      const payload = result?.data?.comment || result?.comment || null;

      if (!payload?._id) {
        throw new Error("The server did not return the saved comment.");
      }

      setSocial((current) => {
        if (!current) return current;

        const existingComments = current.comments || [];

        if (existingComments.some((comment) => comment._id === payload._id)) {
          return current;
        }

        return {
          ...current,
          comments: [...existingComments, payload],
        };
      });

      setCommentText("");
      setMessage("Comment added successfully.");
    } catch (error) {
      setMessage(error?.message || "Could not add comment.");
    } finally {
      setWorking(false);
    }
  };

  // Delete a comment.
  const handleDeleteComment = async (commentId) => {
    if (working) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) return;

    try {
      setWorking(true);
      setMessage("");

      await deleteRecipeComment(recipeId, commentId);

      setSocial((current) => {
        if (!current) return current;

        return {
          ...current,
          comments: (current.comments || []).filter(
            (comment) => comment._id !== commentId,
          ),
        };
      });

      setMessage("Comment deleted successfully.");
    } catch (error) {
      setMessage(error?.message || "Could not delete comment.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className={`recipe-social-shell ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        className="recipe-social-toggle"
        aria-expanded={isOpen}
        aria-controls={`recipe-social-content-${recipeId}`}
        onClick={handleTogglePanel}
      >
        <span className="recipe-social-toggle-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" width="23" height="23">
            <path
              d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3A7.5 7.5 0 1 1 20 11.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 11.5h7M8.5 14.5h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <span className="recipe-social-toggle-copy">
          <strong>
            {isOpen ? "Recipe discussion" : "Comments & Discussion"}
          </strong>

          <small>
            {isOpen
              ? "Join the conversation about this recipe"
              : "Share thoughts, like the recipe and follow the chef"}
          </small>
        </span>

        {social && (
          <span className="recipe-social-toggle-count">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        )}

        <span
          className={`recipe-social-toggle-action ${isOpen ? "is-open" : ""}`}
        >
          {isOpen ? "Hide" : "View comments"}
          <span className="recipe-social-chevron" aria-hidden="true">
            ↓
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          className="recipe-social-panel"
          id={`recipe-social-content-${recipeId}`}
        >
          {!isLoggedIn ? (
            <div className="recipe-social-login">
              <span className="recipe-social-section-label">
                JOIN THE COMMUNITY
              </span>

              <h3>Good food brings people together.</h3>

              <p>
                Log in to like recipes, follow chefs and share your thoughts in
                the comments.
              </p>

              <button
                type="button"
                className="recipe-social-primary"
                onClick={loginFirst}
              >
                Log in to interact
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : loading ? (
            <div
              className="recipe-social-loading"
              role="status"
              aria-live="polite"
            >
              <span className="recipe-social-loader" />
              <p>Preparing the conversation...</p>
            </div>
          ) : !social ? (
            <div className="recipe-social-load-error">
              <span className="recipe-social-error-icon" aria-hidden="true">
                !
              </span>

              <h3>Conversation unavailable</h3>

              <p>{message || "We couldn't load this recipe's interactions."}</p>

              <button
                type="button"
                className="recipe-social-primary"
                onClick={() => {
                  setMessage("");
                  setRetryCount((count) => count + 1);
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="recipe-social-content">
              {owner && (
                <div className="recipe-social-chef">
                  <button
                    type="button"
                    className="recipe-social-chef-name"
                    onClick={() => navigate(`/chefs/${owner._id}`)}
                  >
                    <span className="recipe-social-avatar">
                      {(owner.chef || owner.name || "C")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span className="recipe-social-chef-copy">
                      <small>CREATED BY</small>
                      <strong>
                        {owner.chef || owner.name || "Savorly Chef"}
                      </strong>

                      {owner.followersCount != null && (
                        <span>{owner.followersCount} followers</span>
                      )}
                    </span>
                  </button>

                  {!social.isOwnRecipe && (
                    <button
                      type="button"
                      className={`recipe-social-follow ${
                        social.isFollowingOwner ? "is-following" : ""
                      }`}
                      onClick={handleFollow}
                      disabled={working}
                    >
                      {social.isFollowingOwner
                        ? "✓ Following"
                        : "+ Follow chef"}
                    </button>
                  )}
                </div>
              )}

              <div className="recipe-social-heading">
                <span className="recipe-social-section-label">
                  COOK · CONNECT · SHARE
                </span>

                <h2>Join the conversation</h2>

                <p>
                  Tried this recipe or have a tip to share? We'd love to hear
                  from you.
                </p>
              </div>

              <div className="recipe-social-actions">
                <button
                  type="button"
                  className={`recipe-social-like ${
                    social.likedByMe ? "is-liked" : ""
                  }`}
                  onClick={handleLike}
                  disabled={working || social.isOwnRecipe}
                  title={
                    social.isOwnRecipe
                      ? "You cannot like your own recipe"
                      : "Like this recipe"
                  }
                >
                  <span className="recipe-social-heart" aria-hidden="true">
                    {social.likedByMe ? "♥" : "♡"}
                  </span>

                  <span>{social.likedByMe ? "Liked" : "Like recipe"}</span>

                  <strong>{social.likesCount || 0}</strong>
                </button>

                <span className="recipe-social-comment-count">
                  <span aria-hidden="true">✳</span>
                  {comments.length}{" "}
                  {comments.length === 1 ? "comment" : "comments"}
                </span>
              </div>

              <div className="recipe-social-comments">
                <div className="recipe-social-comments-title">
                  <h3>Kitchen conversations</h3>
                  <span>{comments.length}</span>
                </div>

                {comments.length === 0 ? (
                  <div className="recipe-social-empty">
                    <span aria-hidden="true">💬</span>
                    <strong>Be the first to share</strong>
                    <p>
                      No comments yet. Start a conversation about this recipe.
                    </p>
                  </div>
                ) : (
                  <div className="recipe-social-comment-list">
                    {comments.map((comment) => {
                      const author = comment.user;

                      const authorName =
                        author?.chef || author?.name || "Savorly User";

                      return (
                        <article
                          className="recipe-social-comment"
                          key={comment._id}
                        >
                          <span className="recipe-social-comment-avatar">
                            {authorName.trim().charAt(0).toUpperCase()}
                          </span>

                          <div className="recipe-social-comment-body">
                            <div className="recipe-social-comment-top">
                              <button
                                type="button"
                                onClick={() => {
                                  if (author?._id) {
                                    navigate(`/chefs/${author._id}`);
                                  }
                                }}
                              >
                                {authorName}
                              </button>

                              <time>
                                {comment.createdAt
                                  ? new Date(
                                      comment.createdAt,
                                    ).toLocaleDateString(undefined, {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : ""}
                              </time>
                            </div>

                            <p>{comment.text}</p>

                            {comment.canDelete && (
                              <button
                                type="button"
                                className="recipe-social-delete-comment"
                                disabled={working}
                                onClick={() => handleDeleteComment(comment._id)}
                              >
                                Delete comment
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                <form
                  className="recipe-social-comment-form"
                  onSubmit={handleComment}
                >
                  <label htmlFor={`comment-${recipeId}`}>
                    Add to the conversation
                  </label>

                  <textarea
                    id={`comment-${recipeId}`}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Share a tip, ask a question or tell us how it went..."
                    disabled={working}
                  />

                  <div className="recipe-social-comment-footer">
                    <small>{commentText.length}/500 characters</small>

                    <button
                      type="submit"
                      className="recipe-social-primary"
                      disabled={working || !commentText.trim()}
                    >
                      {working ? "Please wait..." : "Post comment"}
                      {!working && <span aria-hidden="true">→</span>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {message && social && (
            <p className="recipe-social-status" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default RecipeSocial;
