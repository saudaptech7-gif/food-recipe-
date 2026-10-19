/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = "error") => {
    const id = `${Date.now()}-${Math.random()}`;

    setNotifications((previous) => [
      ...previous,
      { id, message, type },
    ]);

    setTimeout(() => {
      setNotifications((previous) =>
        previous.filter((item) => item.id !== id)
      );
    }, 4000);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <div className="global-notifications" aria-live="polite">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`global-toast ${item.type}`}
            role={item.type === "error" ? "alert" : "status"}
          >
            <span className="global-toast-icon">
              {item.type === "success"
                ? "✓"
                : item.type === "warning"
                  ? "!"
                  : "×"}
            </span>

            <div className="global-toast-content">
              <strong>
                {item.type === "success"
                  ? "Success"
                  : item.type === "warning"
                    ? "Attention"
                    : "Something went wrong"}
              </strong>

              <p>{item.message}</p>
            </div>

            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider"
    );
  }

  return context;
}
