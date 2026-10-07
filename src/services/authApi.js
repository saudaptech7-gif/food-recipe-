const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

export const signup = async (userData) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
};

export const login = async (userData) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/me`, {
    credentials: "include",
  });

  const data = await response.json();

  if (response.status === 401) {
    window.dispatchEvent(new Event("auth-expired"));
  }

  if (!response.ok) {
    throw new Error(data.message || "Not authenticated");
  }

  return data;
};

export const logoutUser = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",

    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
};
