import { useState, useEffect } from "react";
import Home from "./pages/Home";
import BerlioBlast from "./pages/BerlioBlas";
import Prizes from "./pages/Prizes";
import KepalaToko from "./pages/KepalaToko";

export default function App() {
  // Read current path from window.location.pathname
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Listen for back/forward navigation in the browser
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  // Custom navigate function that updates history and state
  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    // Scroll to top on navigation for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Route matching
  // If path is exactly /berlio_blast, render the game page
  if (currentPath === "/berlio_blast") {
    return <BerlioBlast />;
  }

  // If path is /prizes, render the prizes page
  if (currentPath === "/prizes") {
    return <Prizes navigate={navigate} />;
  }

  // If path is /kepala_toko, render the kepala toko page
  if (currentPath === "/kepala_toko") {
    return <KepalaToko navigate={navigate} />;
  }

  // Default is Home page (including / or other unknown paths)
  return <Home navigate={navigate} />;
}
