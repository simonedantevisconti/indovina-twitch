import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function DefaultLayout() {
  const location = useLocation();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousScrollBehavior;
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Header />

      <main className="app-main">
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
