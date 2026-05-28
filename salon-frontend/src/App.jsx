import { useEffect } from "react";
import AppRoutes from "./routhes/AppRouthes";
import { syncTransactions } from "./offline/sync";

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      syncTransactions();
    };

    window.addEventListener("online", handleOnline);

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return <AppRoutes />;
}
