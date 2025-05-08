
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Header from "./Header";
import Footer from "./Footer";
import { useAppSelector } from "@/hooks/use-redux";

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");
  const { user } = useAppSelector((state) => state.auth);

  // Redirect to dashboard if logged in and on home page
  useEffect(() => {
    if (user?.isLoggedIn && location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === "fadeOut") {
      setTransitionStage("fadeIn");
      setDisplayLocation(location);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div
          className={`page-transition ${transitionStage}`}
          onAnimationEnd={handleAnimationEnd}
        >
          {transitionStage === "fadeIn" && (
            <TransitionGroup component={null}>
              <CSSTransition
                key={displayLocation.key}
                classNames="page-transition"
                timeout={400}
              >
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Outlet />
                </div>
              </CSSTransition>
            </TransitionGroup>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
