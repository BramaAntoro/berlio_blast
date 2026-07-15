// import React from "react";
import logo from "../assets/section/logo.png";

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Header({ currentPath, onNavigate }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between">
        {/* Logo */}
        <div onClick={() => onNavigate("/")} className="cursor-pointer flex items-center">
          <img src={logo} alt="Berlian 90" className="h-12 md:h-16 w-auto object-contain" />
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => onNavigate("/")}
            className={`flex items-center gap-2 text-sm md:text-base font-bold pb-2 transition-all cursor-pointer ${
              currentPath === "/"
                ? "text-blue-700 border-b-4 border-blue-700"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Beranda</span>
          </button>
          
          <button
            onClick={() => onNavigate("/prizes")}
            className={`flex items-center gap-2 text-sm md:text-base font-bold pb-2 transition-all cursor-pointer ${
              currentPath === "/prizes"
                ? "text-blue-700 border-b-4 border-blue-700"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <span>Daftar Hadiah</span>
          </button>

          <button
            onClick={() => onNavigate("/berlio_blast")}
            className={`flex items-center gap-2 text-sm md:text-base font-bold pb-2 transition-all cursor-pointer ${
              currentPath === "/berlio_blast"
                ? "text-blue-700 border-b-4 border-blue-700"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Berlio Blast</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
