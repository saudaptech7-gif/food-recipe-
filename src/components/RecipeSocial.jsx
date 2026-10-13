/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getRecipeSocial,
  toggleRecipeLike,
  toggleFollow,
  addRecipeComment,
  deleteRecipeComment,
} from "../services/socialApi";

function RecipeSocial({ recipe, isLoggedIn }) {
  const navigate = useNavigate();

  const recipeId = recipe?._id;
  const isCommunityRecipe = recipe?.recipeType === "community";

  const panelRef = useRef(null);

  const [shouldLoadSocial, setShouldLoadSocial] = useState(false);
  const [social, setSocial] = useState(null);

  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // =====================================
  // LOAD INTERACTIONS NEAR THE VIEWPORT
  // =====================================

  useEffect(() => {
    if (!isCommunityRecipe || !recipeId) {
      return undefined;
    }

    if (!isLoggedIn) {
      setShouldLoadSocial(false);
      setSocial(null);
      setLoading(false);
      setMessage("");

      return undefined;
    }

    // Already triggered for this mounted recipe component.
    if (shouldLoadSocial) {
      return undefined;
    }

    const panel = panelRef.current;

    if (!panel || !("IntersectionObserver" in window)) {
      setShouldLoadSocial(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);

        if (visible) {
          setShouldLoadSocial(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(panel);

    return () => {
      observer.disconnect();
    };
  }, [recipeId, isCommunityRecipe, isLoggedIn, shouldLoadSocial]);

  // =====================================
  // FETCH SOCIAL DATA ONCE WHEN NEEDED
  // =====================================

  useEffect(() => {
    let cancelled = false;

    const loadSocial = async () => {
      if (!isCommunityRecipe || !recipeId || !isLoggedIn || !shouldLoadSocial) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");
      setSocial(null);

      try {
        const result = await getRecipeSocial(recipeId);

        if (!cancelled) {
          const data =
            result?.social || result?.data?.social || result?.data || result;

          setSocial(data);
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(err?.message || "Could not load recipe interactions.");
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
  }, [recipeId, isCommunityRecipe, isLoggedIn, shouldLoadSocial, retryCount]);

  // Not a community recipe? No social panel or social API calls.
  if (!isCommunityRecipe || !recipeId) {
    return null;
  }

  const comments = social?.comments || [];
  const owner = social?.owner;

  const loginFirst = () => {
    navigate("/login");
  };

  // =====================================
  // LIKE / UNLIKE
  // =====================================

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
    } catch (err) {
      setMessage(err?.message || "Could not update like.");
    } finally {
      setWorking(false);
    }
  };

  // =====================================
  // FOLLOW / UNFOLLOW
  // =====================================

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
    } catch (err) {
      setMessage(err?.message || "Could not update follow status.");
    } finally {
      setWorking(false);
    }
  };

  // =====================================
  // ADD COMMENT
  // No additional GET request required.
  // =====================================

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
        // The backend should return the new comment.
        // Don't perform another GET just to refresh it.
        throw new Error("Comment response did not include the saved comment.");
      }

      setSocial((current) => {
        if (!current) return current;

        const existingComments = current.comments || [];

        // Avoid adding the same comment twice.
        if (existingComments.some((comment) => comment._id === payload._id)) {
          return current;
        }

        return {
          ...current,
          comments: [...existingComments, payload],
        };
      });

      setCommentText("");
      setMessage("Comment added.");
    } catch (err) {
      setMessage(err?.message || "Could not add comment.");
    } finally {
      setWorking(false);
    }
  };

  // =====================================
  // DELETE COMMENT
  // Update local state after successful deletion.
  // =====================================

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) {
      return;
    }

    if (working) {
      return;
    }

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

      setMessage("Comment deleted.");
    } catch (err) {
      setMessage(err?.message || "Could not delete comment.");
    } finally {
      setWorking(false);
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <section className="recipe-social-panel" ref={panelRef}>
      {!isLoggedIn ? (
        <div className="recipe-social-login">
          <p>Log in to like recipes, follow chefs and leave comments.</p>

          <button
            type="button"
            className="recipe-social-primary"
            onClick={loginFirst}
          >
            Log in to interact
          </button>
        </div>
      ) : loading ? (
        <p className="recipe-social-status" aria-live="polite">
          Loading recipe interactions...
        </p>
      ) : !social ? (
        <div className="recipe-social-load-error">
          <p className="recipe-social-status" role="status">
            {message || "Recipe interactions are unavailable."}
          </p>

          <button
            type="button"
            className="recipe-social-primary"
            onClick={() => {
              setMessage("");
              setRetryCount((count) => count + 1);
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Recipe owner */}

          {owner && (
            <div className="recipe-social-chef">
              <button
                type="button"
                className="recipe-social-chef-name"
                onClick={() => {
                  navigate(`/chefs/${owner._id}`);
                }}
              >
                <span className="recipe-social-avatar">
                  {(owner.chef || owner.name || "C")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="recipe-social-chef-copy">
                  <small>RECIPE BY</small>

                  <strong>{owner.chef || owner.name || "Savorly Chef"}</strong>
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
                  {social.isFollowingOwner ? "✓ Following" : "+ Follow"}
                </button>
              )}
            </div>
          )}

          {/* Conversation heading */}

          <div className="recipe-social-heading">
            <div>
              <span className="recipe-social-eyebrow">
                COOK • CONNECT • SHARE
              </span>

              <h2>Join the conversation</h2>

              <p>Share your thoughts about this recipe.</p>
            </div>
          </div>

          {/* Likes */}

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
              <span>{social.likedByMe ? "♥" : "♡"}</span>

              {social.likedByMe ? "Liked" : "Like"}

              <strong>{social.likesCount || 0}</strong>
            </button>

            <span className="recipe-social-comment-count">
              ▤ {comments.length} comments
            </span>
          </div>

          {/* Comments */}

          <div className="recipe-social-comments">
            <h3>Comments</h3>

            {comments.length === 0 ? (
              <p className="recipe-social-empty">
                No comments yet. Start the conversation!
              </p>
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
                              ? new Date(comment.createdAt).toLocaleDateString()
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
                            Delete
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Add comment */}

            <form
              className="recipe-social-comment-form"
              onSubmit={handleComment}
            >
              <label htmlFor={`comment-${recipeId}`}>Add a comment</label>

              <textarea
                id={`comment-${recipeId}`}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Share your thoughts..."
                disabled={working}
              />

              <div className="recipe-social-comment-footer">
                <small>{commentText.length}/500</small>

                <button
                  type="submit"
                  className="recipe-social-primary"
                  disabled={working || !commentText.trim()}
                >
                  {working ? "Please wait..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {message && social && (
        <p className="recipe-social-status" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export default RecipeSocial;
