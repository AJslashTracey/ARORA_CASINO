import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 border-t border-[rgb(var(--fg)/0.1)] pt-8">
      <div className="flex flex-col items-start justify-between gap-4 text-xs text-softer md:flex-row">
        <p>© {new Date().getFullYear()} Aurora Gaming Ltd. All rights reserved.</p>
        <nav className="flex flex-wrap gap-4">
        <Link to="/terms" className="link">Terms</Link>
        <Link to="/privacy" className="link">Privacy Policy</Link>
        <Link to="/responsible-gaming" className="ml-4 link">Responsible Gaming</Link>
          <Link to="/support" className="link">Support</Link>
        </nav>
      </div>
    </footer>
  );
}



