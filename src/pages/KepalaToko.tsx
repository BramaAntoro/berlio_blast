import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Prize {
  id: number;
  name: string;
  initialStock: number;
  percentage: number;
}

interface LogbookEntry {
  id: number;
  prizeName: string;
  userName: string;
  date: string;
}

interface Member {
  id: number;
  name: string;
  joinDate: string;
  prizes: { id: number; name: string; claimed: boolean }[];
}

interface KepalaTokoProps {
  navigate: (path: string) => void;
}

export default function KepalaToko({}: KepalaTokoProps) {
  const [view, setView] = useState("kelola");
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 1, name: "Rice Cooker", initialStock: 10, percentage: 5 },
    { id: 2, name: "Voucher Belanja", initialStock: 50, percentage: 20 },
  ]);
  const [logbook] = useState<LogbookEntry[]>([
    { id: 1, prizeName: "Rice Cooker", userName: "Budi", date: "2026-07-15" },
    { id: 2, prizeName: "Voucher Belanja", userName: "Siti", date: "2026-07-14" },
  ]);
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Budi", joinDate: "2026-01-10", prizes: [{ id: 101, name: "Rice Cooker", claimed: false }, { id: 102, name: "Voucher", claimed: true }] },
    { id: 2, name: "Siti", joinDate: "2026-03-15", prizes: [{ id: 103, name: "Ciki", claimed: false }] },
  ]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [newName, setNewName] = useState("");
  const [newInitialStock, setNewInitialStock] = useState(0);
  const [newPercentage, setNewPercentage] = useState(0);

  const getSoldStock = (prizeName: string) => {
    return logbook.filter((entry) => entry.prizeName === prizeName).length;
  };

  const handleAddOrUpdate = () => {
    if (editingPrize) {
      setPrizes(
        prizes.map((p) =>
          p.id === editingPrize.id
            ? { ...editingPrize, name: newName, initialStock: newInitialStock, percentage: newPercentage }
            : p
        )
      );
      setEditingPrize(null);
    } else {
      setPrizes([...prizes, { id: Date.now(), name: newName, initialStock: newInitialStock, percentage: newPercentage }]);
    }
    setNewName("");
    setNewInitialStock(0);
    setNewPercentage(0);
  };

  const handleEdit = (prize: Prize) => {
    setEditingPrize(prize);
    setNewName(prize.name);
    setNewInitialStock(prize.initialStock);
    setNewPercentage(prize.percentage);
  };

  const handleDelete = (id: number) => {
    setPrizes(prizes.filter((p) => p.id !== id));
  };

  const handleClaim = (memberId: number, prizeId: number) => {
    setMembers(members.map(m => m.id === memberId ? {
      ...m, prizes: m.prizes.map(p => p.id === prizeId ? { ...p, claimed: true } : p)
    } : m));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(prev => prev ? {
        ...prev, prizes: prev.prizes.map(p => p.id === prizeId ? { ...p, claimed: true } : p)
      } : null);
    }
  };

  const handleNavigate = (target: string) => {
    setView(target);
    setSelectedMember(null);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar currentView={view} onNavigate={handleNavigate} />
      <main className="flex-1 p-4 md:p-8 overflow-x-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {view === "kelola" ? "Kelola Hadiah Berlio Blast" : view === "logbook" ? "Prize Logbook" : "Membership"}
        </h1>

        {view === "kelola" ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Hadiah</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Rice Cooker"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Stok</label>
                <input
                  type="number"
                  value={newInitialStock}
                  onChange={(e) => setNewInitialStock(Number(e.target.value))}
                  placeholder="0"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Persentase (%)</label>
                <input
                  type="number"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  placeholder="0"
                  className="border p-2 rounded w-full"
                />
              </div>
              <button
                onClick={handleAddOrUpdate}
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold"
              >
                {editingPrize ? "Update Hadiah" : "Tambah Hadiah"}
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nama</th>
                  <th className="p-2">Total Stok</th>
                  <th className="p-2">Stok Keluar</th>
                  <th className="p-2">Sisa Stok</th>
                  <th className="p-2">Persentase</th>
                  <th className="p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((p) => {
                  const sold = getSoldStock(p.name);
                  const remaining = p.initialStock - sold;
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.initialStock}</td>
                      <td className="p-2">{sold}</td>
                      <td className="p-2 font-bold text-slate-700">{remaining}</td>
                      <td className="p-2">{p.percentage}%</td>
                      <td className="p-2">
                        <button onClick={() => handleEdit(p)} className="text-blue-600 mr-2">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : view === "logbook" ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nama Hadiah</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {logbook.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="p-2">{entry.prizeName}</td>
                    <td className="p-2">{entry.userName}</td>
                    <td className="p-2">{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            {selectedMember ? (
              <div>
                <button onClick={() => setSelectedMember(null)} className="mb-4 text-blue-600">&larr; Kembali ke list member</button>
                <h2 className="text-2xl font-bold mb-4">Hadiah {selectedMember.name}</h2>
                <div className="space-y-2">
                  {selectedMember.prizes.map(p => (
                    <div key={p.id} className="flex justify-between items-center border p-2 rounded">
                      <span>{p.name}</span>
                      {p.claimed ? <span className="text-green-600 font-semibold">Sudah Diklaim</span> : 
                        <button onClick={() => handleClaim(selectedMember.id, p.id)} className="bg-blue-600 text-white px-3 py-1 rounded">Klaim</button>
                      }
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Daftar Member</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-4 border-b">Nama</th>
                        <th className="p-4 border-b">Tanggal Bergabung</th>
                        <th className="p-4 border-b">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 border-b">
                          <td className="p-4 font-medium">{m.name}</td>
                          <td className="p-4 text-gray-600">{m.joinDate}</td>
                          <td className="p-4">
                            <button onClick={() => setSelectedMember(m)} className="text-blue-600 hover:text-blue-800 font-semibold">
                              Lihat Hadiah
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
