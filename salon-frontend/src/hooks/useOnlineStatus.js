import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  const checkServer = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      const res = await API.get("");
      setIsOnline(res.data?.status === "ok");
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkServer();
    const goOnline = () => { setIsOnline(true); setTimeout(checkServer, 1500); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const interval = setInterval(checkServer, 30000);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(interval);
    };
  }, [checkServer]);

  return isOnline;
}
