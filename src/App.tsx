import React, { useState, useRef, useEffect } from "react";

// Import aset lokal
import mesinKosong from "./assets/images/mesin_kosong.png";
import tuas from "./assets/images/tuas.png";
import capsulBiru from "./assets/images/capsul_biru.png";
import capsulKuning from "./assets/images/capsul_kuning.png";
import capsulMerah from "./assets/images/capsul_merah.png";

const GACHA_AUDIO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/4/47/Charkha_spinning_wheel_sound.mp3";

interface KapsulItem {
  id: number;
  src: string;
  top: string;
  left: string;
  rotation: string;
  scale: string;
  zIndex: string;
}

export default function App() {
  const [angle, setAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spinState, setSpinState] = useState<
    "stop" | "fast" | "medium" | "slow"
  >("stop");

  const [droppedCapsule, setDroppedCapsule] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const tuasRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    const audio = new Audio(GACHA_AUDIO_URL);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const listKapsul: KapsulItem[] = [
    {
      id: 1,
      src: capsulBiru,
      top: "15%",
      left: "22%",
      rotation: "rotate-[15deg]",
      scale: "scale-[0.85]",
      zIndex: "z-10",
    },
    {
      id: 2,
      src: capsulMerah,
      top: "10%",
      left: "38%",
      rotation: "rotate-[-35deg]",
      scale: "scale-[0.88]",
      zIndex: "z-10",
    },
    {
      id: 3,
      src: capsulBiru,
      top: "12%",
      left: "54%",
      rotation: "rotate-[40deg]",
      scale: "scale-[0.85]",
      zIndex: "z-10",
    },
    {
      id: 4,
      src: capsulMerah,
      top: "20%",
      left: "66%",
      rotation: "rotate-[-12deg]",
      scale: "scale-[0.82]",
      zIndex: "z-10",
    },
    {
      id: 5,
      src: capsulKuning,
      top: "32%",
      left: "12%",
      rotation: "rotate-[-60deg]",
      scale: "scale-95",
      zIndex: "z-20",
    },
    {
      id: 6,
      src: capsulMerah,
      top: "24%",
      left: "26%",
      rotation: "rotate-[110deg]",
      scale: "scale-100",
      zIndex: "z-20",
    },
    {
      id: 7,
      src: capsulKuning,
      top: "26%",
      left: "44%",
      rotation: "rotate-[15deg]",
      scale: "scale-100",
      zIndex: "z-20",
    },
    {
      id: 8,
      src: capsulBiru,
      top: "30%",
      left: "58%",
      rotation: "rotate-[-50deg]",
      scale: "scale-95",
      zIndex: "z-20",
    },
    {
      id: 9,
      src: capsulBiru,
      top: "44%",
      left: "16%",
      rotation: "rotate-[5deg]",
      scale: "scale-105",
      zIndex: "z-30",
    },
    {
      id: 10,
      src: capsulMerah,
      top: "42%",
      left: "32%",
      rotation: "rotate-[-25deg]",
      scale: "scale-105",
      zIndex: "z-30",
    },
    {
      id: 11,
      src: capsulKuning,
      top: "38%",
      left: "48%",
      rotation: "rotate-[75deg]",
      scale: "scale-105",
      zIndex: "z-30",
    },
    {
      id: 12,
      src: capsulMerah,
      top: "42%",
      left: "64%",
      rotation: "rotate-[85deg]",
      scale: "scale-100",
      zIndex: "z-30",
    },
    {
      id: 13,
      src: capsulMerah,
      top: "54%",
      left: "36%",
      rotation: "rotate-[12deg]",
      scale: "scale-110",
      zIndex: "z-40",
    },
    {
      id: 14,
      src: capsulKuning,
      top: "52%",
      left: "22%",
      rotation: "rotate-[-20deg]",
      scale: "scale-105",
      zIndex: "z-40",
    },
    {
      id: 15,
      src: capsulBiru,
      top: "50%",
      left: "52%",
      rotation: "rotate-[35deg]",
      scale: "scale-105",
      zIndex: "z-40",
    },
  ];

  const playAudio = () => {
    if (audioRef.current) {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(() => {});
    }
  };

  const fadeOutAudio = () => {
    if (!audioRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    fadeIntervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.volume > 0.05) {
        audioRef.current.volume -= 0.08;
      } else {
        if (audioRef.current) audioRef.current.pause();
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }
    }, 40);
  };

  const kocokHadiah = () => {
    const rand = Math.floor(Math.random() * 100);
    if (rand === 0) return "Voucher Rp 50.000";
    if (rand >= 1 && rand <= 4) return "Produk Gratis!";
    if (rand >= 5 && rand <= 19) return "Voucher Rp 25.000";
    if (rand >= 20 && rand <= 59) return "250 Points";
    return "100 Points / Snack / Minuman";
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDroppedCapsule(null);
    setIsDragging(true);
    playAudio();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !tuasRef.current) return;

      const rect = tuasRef.current.getBoundingClientRect();
      const pivotX = rect.left + rect.width * 0.47;
      const pivotY = rect.top + rect.height * 0.81;

      const deltaX = e.clientX - pivotX;
      const deltaY = e.clientY - pivotY;

      let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 18;
      if (currentAngle < 0) currentAngle = 0;
      if (currentAngle > 35) currentAngle = 30;

      setAngle(currentAngle);

      if (currentAngle > 10 && spinState !== "fast") {
        setSpinState("fast");
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setAngle(0);

        if (spinState === "fast") {
          setSpinState("medium");
          setTimeout(() => {
            setSpinState("slow");
            fadeOutAudio();

            setTimeout(() => {
              setSpinState("stop");

              const pilihanGambar = [capsulBiru, capsulKuning, capsulMerah];
              const kapsulTerpilih =
                pilihanGambar[Math.floor(Math.random() * pilihanGambar.length)];
              setDroppedCapsule(kapsulTerpilih);
              setReward(kocokHadiah());
            }, 450);
          }, 350);
        } else {
          setSpinState("stop");
          fadeOutAudio();
        }
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, spinState]);

  return (
    <div className="w-full min-h-screen bg-[#0f172a] flex items-center justify-center p-4 select-none relative overflow-hidden">
      <style>{`
        @keyframes gachaShuffle {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          20% { transform: translate(11px, -13px) rotate(72deg); }
          40% { transform: translate(-13px, 7px) rotate(144deg); }
          60% { transform: translate(8px, 11px) rotate(216deg); }
          80% { transform: translate(-10px, -8px) rotate(288deg); }
          100% { transform: translate(0px, 0px) rotate(360deg); }
        }
        @keyframes capsulePopOut {
          0% {
            transform: translate(0, -10px) scale(0);
            opacity: 0;
          }
          60% {
            transform: translate(0, 5px) scale(1.1) rotate(20deg);
            opacity: 1;
          }
          80% {
            transform: translate(0, -3px) scale(0.95) rotate(-10deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
        }
        @keyframes capsuleWobble {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(6deg); }
          40% { transform: rotate(-6deg); }
          60% { transform: rotate(4deg); }
          80% { transform: rotate(-4deg); }
        }

        .animate-fast { animation: gachaShuffle 0.13s linear infinite; }
        .animate-medium { animation: gachaShuffle 0.35s ease-in-out infinite; }
        .animate-slow { animation: gachaShuffle 0.75s ease-out infinite; }
        
        /* Eksekusi animasi pop-out dari lubang hitam selama 0.5s, lalu lanjut wobble looping */
        .animate-capsule-release {
          animation: 
            capsulePopOut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            capsuleWobble 1.2s ease-in-out infinite 0.5s;
        }
      `}</style>

      {/* Wrapper Utama Mesin */}
      <div className="relative w-full max-w-[480px] aspect-[550/631] flex items-center justify-center">
        {isDragging && (
          <div className="absolute inset-0 z-50 cursor-grabbing bg-transparent" />
        )}

        {/* Layer 1: Base Mesin */}
        <img
          src={mesinKosong}
          alt="Mesin Gacha"
          className="w-full h-full object-contain pointer-events-none z-30"
        />

        {/* Layer 2: Container Kapsul Atas (Di Dalam Kaca) */}
        <div className="absolute top-[21%] left-[16%] w-[68%] h-[38%] pointer-events-none bg-transparent z-40">
          <div className="relative w-full h-full">
            {listKapsul.map((kapsul) => {
              let animationClass = "";
              if (spinState === "fast") animationClass = "animate-fast";
              else if (spinState === "medium")
                animationClass = "animate-medium";
              else if (spinState === "slow") animationClass = "animate-slow";

              return (
                <img
                  key={kapsul.id}
                  src={kapsul.src}
                  alt="Capsul"
                  className={`absolute w-[22%] aspect-square object-contain opacity-100 
                    ${animationClass ? animationClass : `transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${kapsul.rotation} ${kapsul.scale}`} 
                    ${kapsul.zIndex}`}
                  style={{ top: kapsul.top, left: kapsul.left }}
                />
              );
            })}
          </div>
        </div>

        {/* Layer 3: Kapsul Keluar */}
        {droppedCapsule && (
          <div
            onClick={() => setShowModal(true)}
            className="absolute bottom-[10.5%] left-[41%] w-[18%] aspect-square z-40 cursor-pointer animate-capsule-release flex items-center justify-center"
          >
            <img
              src={droppedCapsule}
              alt="Kapsul Hadiah Keluar"
              className="w-full h-full object-contain drop-shadow-[0_8px_6px_rgba(0,0,0,0.6)]"
            />
          </div>
        )}

        {/* Layer 4: Tuas Engkol */}
        <div
          ref={tuasRef}
          onMouseDown={handleMouseDown}
          className={`absolute w-[25%] h-[35%] right-[7%] top-[40.5%] z-10 cursor-grab active:cursor-grabbing scale-[1.55]
            ${!isDragging ? "transition-transform duration-600 cubic-bezier(0.16, 1, 0.3, 1)" : ""}`}
          style={{
            transformOrigin: "47% 81%",
            transform: `rotate(${angle}deg)`,
          }}
        >
          <img
            src={tuas}
            alt="Tuas"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* POP-UP / MODAL HADIAH */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_.25s_ease]">
            {/* Header */}
            <div className="flex flex-col items-center px-8 pt-8">
              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                Selamat!
              </h2>

              <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">
                Kamu berhasil mendapatkan hadiah dari mesin gacha.
              </p>
            </div>

            {/* Hadiah */}
            <div className="px-8 mt-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 py-5 px-4 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-2">
                  HADIAH
                </p>

                <p className="text-2xl font-bold text-slate-900">{reward}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-8">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDroppedCapsule(null);
                }}
                className="
            w-full
            rounded-2xl
            bg-slate-900
            py-4
            text-white
            font-semibold
            transition
            hover:bg-slate-800
            active:scale-[0.98]
          "
              >
                Ambil Hadiah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
