import { useState } from "react";
import Header from "../components/Header";

interface Prize {
  id: number;
  name: string;
  expiryDate: string;
}

const INITIAL_PRIZES: Prize[] = [
  { id: 1, name: "Rice Cooker", expiryDate: "2026-12-31" },
  { id: 2, name: "Voucher Belanja Rp100.000", expiryDate: "2026-09-15" },
  { id: 3, name: "Snack Ciki Paket", expiryDate: "2026-08-01" },
];

interface PrizesProps {
  navigate: (path: string) => void;
}

export default function Prizes({ navigate }: PrizesProps) {
  const [prizes, setPrizes] = useState<Prize[]>(INITIAL_PRIZES);

  const handleClaim = (id: number) => {
    setPrizes(prizes.filter((prize) => prize.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f3f7ff] flex flex-col font-sans">
      <Header currentPath="/prizes" onNavigate={navigate} />
      
      <main className="flex-1 w-full max-w-[1080px] mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Daftar Hadiah Saya</h1>
        
        {prizes.length === 0 ? (
          <p className="text-slate-500">Tidak ada hadiah yang tersedia.</p>
        ) : (
          <div className="grid gap-4">
            {prizes.map((prize) => (
              <div key={prize.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-slate-800">{prize.name}</h2>
                  <p className="text-sm text-slate-500">Expired: {prize.expiryDate}</p>
                </div>
                <button 
                  onClick={() => handleClaim(prize.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Klaim
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
