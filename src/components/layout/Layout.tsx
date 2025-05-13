
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <TransitionGroup component={null}>
          <CSSTransition
            key={location.key}
            classNames="page"
            timeout={300}
            unmountOnExit
          >
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Outlet />
            </div>
          </CSSTransition>
        </TransitionGroup>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
