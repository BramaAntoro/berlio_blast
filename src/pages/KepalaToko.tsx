import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Prize {
  id: number;
  name: string;
  stock: number;
  percentage: number;
}

interface LogbookEntry {
  id: number;
  prizeName: string;
  userName: string;
  date: string;
}

interface KepalaTokoProps {
  navigate: (path: string) => void;
}

export default function KepalaToko({ navigate }: KepalaTokoProps) {
  const [view, setView] = useState("kelola");
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 1, name: "Rice Cooker", stock: 10, percentage: 5 },
    { id: 2, name: "Voucher Belanja", stock: 50, percentage: 20 },
  ]);
  const [logbook] = useState<LogbookEntry[]>([
    { id: 1, prizeName: "Rice Cooker", userName: "Budi", date: "2026-07-15" },
    { id: 2, prizeName: "Voucher Belanja", userName: "Siti", date: "2026-07-14" },
  ]);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState(0);
  const [newPercentage, setNewPercentage] = useState(0);

  const handleAddOrUpdate = () => {
    if (editingPrize) {
      setPrizes(prizes.map(p => p.id === editingPrize.id ? { ...editingPrize, name: newName, stock: newStock, percentage: newPercentage } : p));
      setEditingPrize(null);
    } else {
      setPrizes([...prizes, { id: Date.now(), name: newName, stock: newStock, percentage: newPercentage }]);
    }
    setNewName(""); setNewStock(0); setNewPercentage(0);
  };

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setNewName(prize.name);
    setNewStock(prize.stock);
    setNewPercentage(prize.percentage);
  };

  const handleDelete = (id: number) => {
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const handleNavigate = (target: string) => {
    setView(target);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar currentView={view} onNavigate={handleNavigate} />
      <main className="flex-1 p-4 md:p-8 overflow-x-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {view === "kelola" ? "Kelola Hadiah Berlio Blast" : "Prize Logbook"}
        </h1>
        
        {view === "kelola" ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Hadiah</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contoh: Rice Cooker" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))} placeholder="0" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Persentase (%)</label>
                <input type="number" value={newPercentage} onChange={e => setNewPercentage(Number(e.target.value))} placeholder="0" className="border p-2 rounded w-full" />
              </div>
              <button onClick={handleAddOrUpdate} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold">
                {editingPrize ? "Update Hadiah" : "Tambah Hadiah"}
              </button>
            </div>
            <table className="w-full text-left">
              <thead><tr className="border-b"><th className="p-2">Nama</th><th className="p-2">Stok</th><th className="p-2">Persentase</th><th className="p-2">Aksi</th></tr></thead>
              <tbody>
                {prizes.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.stock}</td>
                    <td className="p-2">{p.percentage}%</td>
                    <td className="p-2">
                      <button onClick={() => handleEdit(p)} className="text-blue-600 mr-2">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-600">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <table className="w-full text-left">
              <thead><tr className="border-b"><th className="p-2">Nama Hadiah</th><th className="p-2">User</th><th className="p-2">Tanggal</th></tr></thead>
              <tbody>
                {logbook.map(entry => (
                  <tr key={entry.id} className="border-b">
                    <td className="p-2">{entry.prizeName}</td>
                    <td className="p-2">{entry.userName}</td>
                    <td className="p-2">{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
