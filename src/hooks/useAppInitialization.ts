import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWeddingEvent } from "../service/weddingEventService";
import { getPhases } from "../service/phaseService";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../service/firebase";
import { selectCurrentUser } from "../store/authSlice";
import { store } from "../store/store";
import { setWeddingPublicMeta } from "../service/weddingJoinRequestFirestore";

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
        getWeddingEvent(userId, dispatch)
          .then(() => {
            const we =
              store.getState().weddingEvent.getWeddingEvent.weddingEvent;
            const eventId = we._id;
            const creatorId = we.creatorId;
            if (eventId && creatorId) {
              setWeddingPublicMeta(eventId, creatorId).catch(() => {});
            }
            if (eventId) {
              getPhases(eventId, dispatch).catch(() => {});
            }
          })
          .catch((error) => {
            console.error("Failed to initialize app data:", error);
          });
      }

      // Ensure Firebase Auth for Firestore actions (chat/request)
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((error) => {
          console.error("Failed to sign in anonymously:", error);
        });
      }
    }

    // Reset initialization flag when user logs out
    if (!user) {
      hasInitialized.current = false;
    }
  }, [user, dispatch]);
};
