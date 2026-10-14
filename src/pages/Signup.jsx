import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signup } from "../services/authApi";
import { useNotification } from "../context/NotificationContext";

function Signup() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await signup(formData);

      notify(
        "Your account has been created successfully. Please sign in.",
        "success"
      );

      navigate("/login");
    } catch (error) {
      notify(
        error.message || "Account creation failed. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🍴</div>

          <h1>Create Account</h1>

          <p>Join us and discover delicious recipes.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="signup-name">Name</label>

            <input
              id="signup-name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="signup-email">Email</label>

            <input
              id="signup-email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="signup-password">Password</label>

            <input
              id="signup-password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>

          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;

