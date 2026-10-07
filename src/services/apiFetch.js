export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event("auth-expired"));
  }

  return response;
};
