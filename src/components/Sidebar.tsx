// import React from "react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-full md:w-64 bg-slate-900 md:min-h-screen text-white p-6">
      <h2 className="text-xl font-bold mb-8 text-blue-400">Kepala Toko</h2>
      <nav className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible">
        <button
          onClick={() => onNavigate("kelola")}
          className={`whitespace-nowrap p-2 rounded ${currentView === "kelola" ? "bg-blue-700" : "hover:bg-slate-800"}`}
        >
          Kelola Hadiah
        </button>
        <button
          onClick={() => onNavigate("logbook")}
          className={`whitespace-nowrap p-2 rounded ${currentView === "logbook" ? "bg-blue-700" : "hover:bg-slate-800"}`}
        >
          Prize Logbook
        </button>
        <button
          onClick={() => onNavigate("membership")}
          className={`whitespace-nowrap p-2 rounded ${currentView === "membership" ? "bg-blue-700" : "hover:bg-slate-800"}`}
        >
          Membership
        </button>
      </nav>
    </aside>
  );
}
