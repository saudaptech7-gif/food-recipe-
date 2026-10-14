/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const recipeName = recipe?.name || recipe?.title || "Community Recipe";

  const [isOpen, setIsOpen] = useState(false);
  const [social, setSocial] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Load comments only when the popup is open.
  useEffect(() => {
    if (!isCommunityRecipe || !recipeId || !isOpen) {
      setLoading(false);
      return undefined;
    }

    if (!isLoggedIn) {
      setSocial(null);
      setLoading(false);
      setMessage("");
      return undefined;
    }

    let cancelled = false;

    async function loadSocial() {
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
    }

    loadSocial();

    return () => {
      cancelled = true;
    };
  }, [recipeId, isCommunityRecipe, isLoggedIn, isOpen, retryCount]);

  // Lock background scrolling and support Escape to close.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !working) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, working]);

  if (!isCommunityRecipe || !recipeId) {
    return null;
  }

  const comments = Array.isArray(social?.comments) ? social.comments : [];

  const owner = social?.owner;

  const commentCount =
    social?.comments?.length ??
    recipe?.commentsCount ??
    recipe?.commentCount ??
    null;

  const closePopup = () => {
    if (!working) {
      setIsOpen(false);
    }
  };

  const loginFirst = () => {
    setIsOpen(false);
    navigate("/login");
  };

  // LIKE / UNLIKE
  const handleLike = async () => {
    if (!isLoggedIn) {
      loginFirst();
      return;
    }

    if (!social || social.isOwnRecipe || working) return;

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

  // FOLLOW / UNFOLLOW
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

  // ADD COMMENT
  const handleComment = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      loginFirst();
      return;
    }

    const cleanText = commentText.trim();

    if (!cleanText || working) return;

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

  // DELETE COMMENT
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
    <>
      {/* SMALL COMMENTS ICON — NO EXPANDING PANEL */}

      <div className="savorly-comment-launcher">
        <button
          type="button"
          className="savorly-comment-icon-button"
          onClick={() => setIsOpen(true)}
          aria-label={`Open comments for ${recipeName}`}
          title="View comments"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 11.4a7.4 7.4 0 0 1-7.4 7.4H5l1.7-3A7.4 7.4 0 1 1 20 11.4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 10.5h7M8.5 13.5h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>

          <span>Comments</span>

          {commentCount !== null && (
            <span className="savorly-comment-icon-count">{commentCount}</span>
          )}
        </button>
      </div>

      {/* CENTERED MODAL POPUP */}

      {isOpen &&
        createPortal(
          <div
            className="savorly-comments-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePopup();
              }
            }}
          >
            <section
              className="savorly-comments-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`comments-title-${recipeId}`}
            >
              <header className="savorly-comments-header">
                <div className="savorly-comments-header-copy">
                  <span className="savorly-comments-eyebrow">
                    SAVORLY COMMUNITY
                  </span>

                  <h2 id={`comments-title-${recipeId}`}>
                    Kitchen conversations
                  </h2>

                  <p>{recipeName}</p>
                </div>

                <button
                  type="button"
                  className="savorly-comments-close"
                  onClick={closePopup}
                  disabled={working}
                  aria-label="Close comments"
                  title="Close"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m6 6 12 12M18 6 6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </header>

              <div className="savorly-comments-modal-body">
                {!isLoggedIn ? (
                  <div className="savorly-comments-login">
                    <span className="savorly-comments-empty-icon">
                      <svg
                        viewBox="0 0 24 24"
                        width="30"
                        height="30"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 11.4a7.4 7.4 0 0 1-7.4 7.4H5l1.7-3A7.4 7.4 0 1 1 20 11.4Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <h3>Join the conversation</h3>

                    <p>
                      Log in to view recipe interactions, follow chefs and share
                      your thoughts.
                    </p>

                    <button
                      type="button"
                      className="savorly-comments-primary"
                      onClick={loginFirst}
                    >
                      Log in to continue
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                ) : loading ? (
                  <div
                    className="savorly-comments-loading"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="savorly-comments-spinner" />
                    <p>Loading conversations...</p>
                  </div>
                ) : !social ? (
                  <div className="savorly-comments-error">
                    <span className="savorly-comments-empty-icon">!</span>

                    <h3>Couldn't load comments</h3>

                    <p>
                      {message ||
                        "The conversation is temporarily unavailable."}
                    </p>

                    <button
                      type="button"
                      className="savorly-comments-primary"
                      onClick={() => {
                        setMessage("");
                        setRetryCount((count) => count + 1);
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* RECIPE CHEF */}

                    {owner && (
                      <div className="savorly-comments-chef">
                        <button
                          type="button"
                          className="savorly-comments-chef-profile"
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/chefs/${owner._id}`);
                          }}
                        >
                          <span className="savorly-comments-avatar">
                            {String(owner.chef || owner.name || "C")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span>
                            <small>RECIPE BY</small>
                            <strong>
                              {owner.chef || owner.name || "Savorly Chef"}
                            </strong>
                          </span>
                        </button>

                        {!social.isOwnRecipe && (
                          <button
                            type="button"
                            className={`savorly-comments-follow ${
                              social.isFollowingOwner ? "is-following" : ""
                            }`}
                            onClick={handleFollow}
                            disabled={working}
                          >
                            {social.isFollowingOwner
                              ? "✓ Following"
                              : "+ Follow"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* LIKES SUMMARY */}

                    <div className="savorly-comments-summary">
                      <div>
                        <span className="savorly-comments-summary-heart">
                          ♥
                        </span>

                        <span>
                          <strong>{social.likesCount || 0}</strong>
                          <small>
                            {(social.likesCount || 0) === 1 ? "Like" : "Likes"}
                          </small>
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`savorly-comments-like ${
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
                        <span aria-hidden="true">
                          {social.likedByMe ? "♥" : "♡"}
                        </span>

                        {social.likedByMe ? "Liked" : "Like recipe"}
                      </button>
                    </div>

                    {/* COMMENTS LIST */}

                    <div className="savorly-comments-list-section">
                      <div className="savorly-comments-list-heading">
                        <div>
                          <h3>Comments</h3>
                          <p>Share ideas and learn from other cooks.</p>
                        </div>

                        <span className="savorly-comments-total">
                          {comments.length}
                        </span>
                      </div>

                      {comments.length === 0 ? (
                        <div className="savorly-comments-empty">
                          <span className="savorly-comments-empty-icon">
                            <svg
                              viewBox="0 0 24 24"
                              width="27"
                              height="27"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M20 11.4a7.4 7.4 0 0 1-7.4 7.4H5l1.7-3A7.4 7.4 0 1 1 20 11.4Z"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>

                          <strong>Start the conversation</strong>

                          <p>
                            No comments yet. Share your first thought about this
                            recipe.
                          </p>
                        </div>
                      ) : (
                        <div className="savorly-comments-list">
                          {comments.map((comment) => {
                            const author = comment.user;
                            const authorName = String(
                              author?.chef || author?.name || "Savorly User",
                            );

                            return (
                              <article
                                className="savorly-comment-item"
                                key={comment._id}
                              >
                                <span className="savorly-comments-avatar">
                                  {authorName.trim().charAt(0).toUpperCase()}
                                </span>

                                <div className="savorly-comment-content">
                                  <div className="savorly-comment-meta">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (author?._id) {
                                          setIsOpen(false);
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
                                      className="savorly-comment-delete"
                                      disabled={working}
                                      onClick={() =>
                                        handleDeleteComment(comment._id)
                                      }
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
                    </div>

                    {/* COMMENT FORM */}

                    <form
                      className="savorly-comments-form"
                      onSubmit={handleComment}
                    >
                      <label htmlFor={`comment-${recipeId}`}>
                        Add your thoughts
                      </label>

                      <textarea
                        id={`comment-${recipeId}`}
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="What do you think about this recipe?"
                        disabled={working}
                      />

                      <div className="savorly-comments-form-footer">
                        <small>{commentText.length}/500</small>

                        <button
                          type="submit"
                          className="savorly-comments-primary"
                          disabled={working || !commentText.trim()}
                        >
                          {working ? "Posting..." : "Post comment"}

                          {!working && <span aria-hidden="true">↗</span>}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {message && social && !loading && (
                  <p className="savorly-comments-message" role="status">
                    {message}
                  </p>
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

export default RecipeSocial;
