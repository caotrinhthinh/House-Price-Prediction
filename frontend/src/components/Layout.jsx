import React from 'react';
import { Building2 } from 'lucide-react';
import './Layout.css';

export const Layout = ({ children }) => {
  return (
    <>
      {/* Animated BG */}
      <div className="bg-animated">
        <div className="glow-bubble glow-1"></div>
        <div className="glow-bubble glow-2"></div>
      </div>
      
      <div className="layout-wrapper">
        <header className="app-header">
          <Building2 size={36} className="logo-icon" />
          <h1>Nexus AI.Estate</h1>
        </header>
        
        <main className="main-content">
          {children}
        </main>
        
        <footer className="footer">
          &copy; {new Date().getFullYear()} Nexus Real Estate Intelligence. Powered by XGBoost & LightGBM.
        </footer>
      </div>
    </>
  );
};
