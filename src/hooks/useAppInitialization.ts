import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWeddingEvent } from "../service/weddingEventService";
import { selectCurrentUser } from "../store/authSlice";

/**
 * ✅ Centralized hook to initialize app data
 * Fetches wedding event ONCE when user is authenticated
 * Prevents duplicate API calls across multiple screens
 */
export const useAppInitialization = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only fetch if user exists and hasn't been initialized yet
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      const userId = user.id || user._id;

      if (userId) {
        getWeddingEvent(userId, dispatch).catch((error) => {
          console.error("Failed to initialize app data:", error);
        });
      }
    }

    // Reset initialization flag when user logs out
    if (!user) {
      hasInitialized.current = false;
    }
  }, [user, dispatch]);
};
