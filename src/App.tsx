import React, { useState, useRef, useEffect, useMemo } from "react";

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

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
}

interface Sparkle {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
}

export default function App() {
  // --- STATE PERMAINAN ---
  // Mulai langsung dari step 'cek_koin' sesuai gambar panduan
  const [currentStep, setCurrentStep] = useState<"cek_koin" | "playing">("cek_koin");
  const [coinCount, setCoinCount] = useState<number>(5); // Jumlah default koin gacha

  const [angle, setAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spinState, setSpinState] = useState<"stop" | "fast" | "medium" | "slow">("stop");

  const [droppedCapsule, setDroppedCapsule] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isCapsuleOpened, setIsCapsuleOpened] = useState<boolean>(false);

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

  const stars: Star[] = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${(Math.random() * 4).toFixed(2)}s`,
      duration: `${(Math.random() * 2 + 2).toFixed(2)}s`,
    }));
  }, []);

  const sparkles: Sparkle[] = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      top: `${10 + Math.random() * 75}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 10 + 8,
      delay: `${(Math.random() * 5).toFixed(2)}s`,
      duration: `${(Math.random() * 3 + 4).toFixed(2)}s`,
    }));
  }, []);

  const listKapsul: KapsulItem[] = [
    { id: 1, src: capsulBiru, top: "15%", left: "22%", rotation: "rotate-[15deg]", scale: "scale-[0.85]", zIndex: "z-10" },
    { id: 2, src: capsulMerah, top: "10%", left: "38%", rotation: "rotate-[-35deg]", scale: "scale-[0.88]", zIndex: "z-10" },
    { id: 3, src: capsulBiru, top: "12%", left: "54%", rotation: "rotate-[40deg]", scale: "scale-[0.85]", zIndex: "z-10" },
    { id: 4, src: capsulMerah, top: "20%", left: "66%", rotation: "rotate-[-12deg]", scale: "scale-[0.82]", zIndex: "z-10" },
    { id: 5, src: capsulKuning, top: "32%", left: "12%", rotation: "rotate-[-60deg]", scale: "scale-95", zIndex: "z-20" },
    { id: 6, src: capsulMerah, top: "24%", left: "26%", rotation: "rotate-[110deg]", scale: "scale-100", zIndex: "z-20" },
    { id: 7, src: capsulKuning, top: "26%", left: "44%", rotation: "rotate-[15deg]", scale: "scale-100", zIndex: "z-20" },
    { id: 8, src: capsulBiru, top: "30%", left: "58%", rotation: "rotate-[-50deg]", scale: "scale-95", zIndex: "z-20" },
    { id: 9, src: capsulBiru, top: "44%", left: "16%", rotation: "rotate-[5deg]", scale: "scale-105", zIndex: "z-30" },
    { id: 10, src: capsulMerah, top: "42%", left: "32%", rotation: "rotate-[-25deg]", scale: "scale-105", zIndex: "z-30" },
    { id: 11, src: capsulKuning, top: "38%", left: "48%", rotation: "rotate-[75deg]", scale: "scale-105", zIndex: "z-30" },
    { id: 12, src: capsulMerah, top: "42%", left: "64%", rotation: "rotate-[85deg]", scale: "scale-100", zIndex: "z-30" },
    { id: 13, src: capsulMerah, top: "54%", left: "36%", rotation: "rotate-[12deg]", scale: "scale-110", zIndex: "z-40" },
    { id: 14, src: capsulKuning, top: "52%", left: "22%", rotation: "rotate-[-20deg]", scale: "scale-105", zIndex: "z-40" },
    { id: 15, src: capsulBiru, top: "50%", left: "52%", rotation: "rotate-[35deg]", scale: "scale-105", zIndex: "z-40" },
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
    if (rand >= 0 && rand <= 15) return "VOUCHER\nRp50.000";
    if (rand >= 16 && rand <= 30) return "PRODUK GRATIS!";
    if (rand >= 31 && rand <= 60) return "VOUCHER\nRp25.000";
    if (rand >= 61 && rand <= 80) return "250 POIN";
    return "100 POIN / SNACK";
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentStep !== "playing") return; 
    if (coinCount <= 0) return;

    if (e.cancelable) e.preventDefault();
    setDroppedCapsule(null);
    setIsCapsuleOpened(false);
    setIsDragging(true);
    playAudio();
  };

  useEffect(() => {
    const calculateAngle = (clientX: number, clientY: number) => {
      if (!tuasRef.current) return;

      const rect = tuasRef.current.getBoundingClientRect();
      const pivotX = rect.left + rect.width * 0.47;
      const pivotY = rect.top + rect.height * 0.81;

      const deltaX = clientX - pivotX;
      const deltaY = clientY - pivotY;

      let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 18;
      if (currentAngle < 0) currentAngle = 0;
      if (currentAngle > 35) currentAngle = 30;

      setAngle(currentAngle);

      if (currentAngle > 10 && spinState !== "fast") {
        setSpinState("fast");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      calculateAngle(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      calculateAngle(touch.clientX, touch.clientY);
    };

    const handleRelease = () => {
      if (isDragging) {
        setIsDragging(false);
        setAngle(0);

        if (spinState === "fast") {
          setSpinState("medium");
          setCoinCount((prev) => Math.max(0, prev - 1));

          setTimeout(() => {
            setSpinState("slow");
            fadeOutAudio();

            setTimeout(() => {
              setSpinState("stop");
              const pilihanGambar = [capsulBiru, capsulKuning, capsulMerah];
              const kapsulTerpilih = pilihanGambar[Math.floor(Math.random() * pilihanGambar.length)];
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
      window.addEventListener("mouseup", handleRelease);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleRelease);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleRelease);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleRelease);
    };
  }, [isDragging, spinState]);

  return (
    <div className="w-full min-h-screen bg-[#050a1f] flex items-center justify-center p-2 select-none relative overflow-hidden touch-none">
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
          0% { transform: translate(0, -10px) scale(0); opacity: 0; }
          60% { transform: translate(0, 5px) scale(1.1) rotate(20deg); opacity: 1; }
          80% { transform: translate(0, -3px) scale(0.95) rotate(-10deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes capsuleWobble {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(6deg); }
          40% { transform: rotate(-6deg); }
          60% { transform: rotate(4deg); }
          80% { transform: rotate(-4deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes floatSparkle {
          0% { transform: translateY(0) rotate(0deg) scale(0.7); opacity: 0; }
          15% { opacity: 0.9; }
          50% { transform: translateY(-22px) rotate(180deg) scale(1); opacity: 1; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-46px) rotate(360deg) scale(0.7); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.55; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes leaverGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(250,204,21,0.35)); }
          50% { filter: drop-shadow(0 0 16px rgba(250,204,21,0.85)); }
        }
        @keyframes burstRing {
          0% { transform: scale(0.3); opacity: 0.9; }
          80% { opacity: 0.15; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes capsuleGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(250,204,21,0.5)); }
          50% { filter: drop-shadow(0 0 26px rgba(250,204,21,0.95)); }
        }
        @keyframes fadeInModal {
          0% { opacity: 0; transform: scale(0.92) translateY(10px); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes modalSparkleFloat {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes spinHorizontalRing {
          0% { transform: translate(-50%, -50%) rotateX(76deg) rotateZ(0deg); }
          100% { transform: translate(-50%, -50%) rotateX(76deg) rotateZ(360deg); }
        }
        @keyframes ringPulseFX {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(234,179,8,0.8)) drop-shadow(0 0 30px rgba(249,115,22,0.4)); opacity: 0.85; }
          50% { filter: drop-shadow(0 0 25px rgba(234,179,8,1)) drop-shadow(0 0 45px rgba(249,115,22,0.7)); opacity: 1; }
        }
        @keyframes rotateSunburst {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes capsuleBreath {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(250,204,21,0.4)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 28px rgba(250,204,21,0.75)); }
        }

        .animate-fast { animation: gachaShuffle 0.13s linear infinite; }
        .animate-medium { animation: gachaShuffle 0.35s ease-in-out infinite; }
        .animate-slow { animation: gachaShuffle 0.75s ease-out infinite; }

        .animate-capsule-release {
          animation:
            capsulePopOut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            capsuleWobble 1.2s ease-in-out infinite 0.5s;
        }

        .star-dot { animation: twinkle ease-in-out infinite; }
        .float-sparkle { animation: floatSparkle ease-in-out infinite; }
        .glass-glow { animation: glowPulse 3.2s ease-in-out infinite; }
        .lever-glow { animation: leaverGlow 2.4s ease-in-out infinite; }
        .burst-ring { animation: burstRing 1.6s ease-out infinite; }
        .capsule-pulse { animation: capsuleGlowPulse 1.4s ease-in-out infinite; }
        .modal-pop { animation: fadeInModal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards; }
        .gacha-3d-ring { animation: spinHorizontalRing 1.4s linear infinite, ringPulseFX 2s ease-in-out infinite; }
        .capsule-modal-breath { animation: capsuleBreath 2s ease-in-out infinite; }

        .sunburst-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 480px;
          height: 480px;
          background: repeating-conic-gradient(
            from 0deg,
            rgba(251, 191, 36, 0.28) 0deg 15deg,
            transparent 15deg 30deg
          );
          border-radius: 50%;
          mask-image: radial-gradient(circle, black 20%, transparent 65%);
          -webkit-mask-image: radial-gradient(circle, black 20%, transparent 65%);
          animation: rotateSunburst 20s linear infinite;
          pointer-events: none;
        }

        .ticket-edge-cut {
          clip-path: polygon(
            0% 0%, 100% 0%, 100% 38%, 96% 43%, 96% 57%, 100% 62%, 100% 100%, 0% 100%, 0% 62%, 4% 57%, 4% 43%, 0% 38%
          );
        }
      `}</style>

      {/* Background Utama */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1128] via-[#0d1a3d] to-[#050814]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(56,189,248,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(250,204,21,0.10),transparent_55%)]" />

      {/* Taburan Bintang */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <span
            key={s.id}
            className="star-dot absolute rounded-full bg-white"
            style={{ top: s.top, left: s.left, width: `${s.size}px`, height: `${s.size}px`, animationDelay: s.delay, animationDuration: s.duration }}
          />
        ))}
      </div>

      {/* =========================================================================
          TAMPILAN AWAL SEPERTI DI GAMBAR (STEP: CEK KOIN)
         ========================================================================= */}
      {currentStep === "cek_koin" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px] p-4">
          <div className="modal-pop relative w-full max-w-[340px] aspect-[3/4] rounded-[24px] bg-gradient-to-b from-[#071130] to-[#03071a] border border-slate-800 p-6 flex flex-col items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
            
            {/* Judul Atas */}
            <h3 className="text-xl font-black text-white tracking-wider mt-4 uppercase">
              KOIN GAÇA KAMU
            </h3>

            {/* Konten Koin Tengah Berdampingan Sesuai Gambar */}
            <div className="flex items-center justify-center gap-4 my-auto w-full px-4">
              {/* Token Bulat Emas Koin B */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 flex items-center justify-center border-4 border-yellow-200/40 shadow-[0_6px_16px_rgba(217,119,6,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)]">
                <span className="text-white text-5xl font-black italic select-none tracking-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                  B
                </span>
              </div>

              {/* Angka Saldo dan Label KOIN */}
              <div className="flex flex-col items-start justify-center text-left">
                <span className="text-6xl font-black text-white leading-none tracking-tight">
                  {coinCount}
                </span>
                <span className="text-sm font-extrabold text-amber-400 tracking-widest uppercase mt-1">
                  KOIN
                </span>
              </div>
            </div>

            {/* Teks Ajakan & Tombol Bawah */}
            <div className="w-full flex flex-col items-center mb-2">
              <p className="text-slate-200 text-sm font-semibold px-2 mb-6 leading-relaxed max-w-[260px]">
                Ayo, gunakan koinmu untuk mendapatkan hadiah!
              </p>

              {/* Tombol Kuning Emas Presisi Dengan Tulisan LANJUT */}
              <button
                onClick={() => setCurrentStep("playing")}
                className="w-full max-w-[240px] rounded-full bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] py-3 text-base font-black text-slate-950 tracking-widest shadow-[0_4px_15px_rgba(245,158,11,0.4),inset_0_2px_2px_rgba(255,255,255,0.3)] transition active:scale-[0.96] uppercase"
              >
                LANJUT
              </button>

              {/* Logo / Teks Catatan Kaki "Berlian 90" */}
              <span className="mt-6 text-sky-400 font-bold tracking-wider italic text-lg select-none opacity-90 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" style={{ fontFamily: "cursive, sans-serif" }}>
                Berlian 90
              </span>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN GAMEPLAY INTERFACES (MESIN GACHA)
         ========================================================================= */}
      <div className="relative w-full max-w-[520px] aspect-[550/631] flex items-center justify-center scale-105 md:scale-110 transition-transform [perspective:1000px]">
        {isDragging && <div className="absolute inset-0 z-50 cursor-grabbing bg-transparent" />}

        {/* Indikator Saldo Koin Sederhana di Atas Kaca Mesin */}
        <div className="absolute top-[3%] left-1/2 -translate-x-1/2 text-center z-40 pointer-events-none w-full">
          <span className="block text-xs font-black text-amber-400 tracking-[0.25em] uppercase drop-shadow-md">
            SISA KOIN: {coinCount}
          </span>
        </div>

        {/* Aura Kaca */}
        <div className="glass-glow absolute top-[8%] left-1/2 -translate-x-1/2 w-[78%] h-[45%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.35),transparent_70%)] blur-2xl z-0 pointer-events-none" />

        {/* Cincin Efek Putaran Kapsul */}
        <div 
          className={`absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[94%] h-[48%] z-35 pointer-events-none overflow-visible transition-all duration-500 ease-in-out
            ${spinState === "fast" ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"}
          `}
        >
          <div className="gacha-3d-ring absolute top-1/2 left-1/2 w-[102%] aspect-square rounded-full border-[3px] border-amber-300 shadow-[inset_0_0_15px_rgba(234,179,8,0.6)]" />
        </div>

        {/* Gambar Kerangka Utama Mesin */}
        <img src={mesinKosong} alt="Mesin Gacha" className="w-full h-full object-contain pointer-events-none z-30 drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)]" />

        {/* Kompartemen Kapsul di Dalam Kubah */}
        <div className="absolute top-[21%] left-[16%] w-[68%] h-[38%] pointer-events-none bg-transparent z-40 overflow-hidden rounded-full">
          <div className="relative w-full h-full">
            {listKapsul.map((kapsul) => {
              let animationClass = "";
              if (spinState === "fast") animationClass = "animate-fast";
              else if (spinState === "medium") animationClass = "animate-medium";
              else if (spinState === "slow") animationClass = "animate-slow";

              return (
                <img
                  key={kapsul.id}
                  src={kapsul.src}
                  alt="Capsul"
                  className={`absolute w-[22%] aspect-square object-contain opacity-100 
                    ${animationClass ? animationClass : `transition-all duration-1000 ${kapsul.rotation} ${kapsul.scale}`} 
                    ${kapsul.zIndex}`}
                  style={{ top: kapsul.top, left: kapsul.left }}
                />
              );
            })}
          </div>
        </div>

        {/* Efek Burst Lingkaran Saat Kapsul Keluar */}
        {droppedCapsule && !showModal && (
          <div className="absolute bottom-[9.5%] left-[39%] w-[22%] aspect-square z-30 pointer-events-none flex items-center justify-center">
            <span className="burst-ring absolute inset-0 rounded-full border-2 border-yellow-300" />
            <span className="burst-ring absolute inset-0 rounded-full border-2 border-sky-300" style={{ animationDelay: "0.55s" }} />
          </div>
        )}

        {/* Objek Kapsul Keluar yang Dapat Diklik */}
        {droppedCapsule && (
          <div
            onClick={() => setShowModal(true)}
            className="absolute bottom-[9.5%] left-[39%] w-[22%] aspect-square z-40 cursor-pointer animate-capsule-release flex items-center justify-center"
          >
            <img src={droppedCapsule} alt="Kapsul Hadiah Keluar" className="capsule-pulse w-full h-full object-contain" />
          </div>
        )}

        {/* Tuas Kemudi Pemutar Mesin */}
        <div
          ref={tuasRef}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          className={`absolute w-[25%] h-[35%] right-[7%] top-[40.5%] z-10 scale-[1.75] touch-none
            ${currentStep === "playing" && coinCount > 0 ? "cursor-grab active:cursor-grabbing lever-glow" : "cursor-not-allowed opacity-75"}
            ${!isDragging ? "transition-transform duration-600 cubic-bezier(0.16, 1, 0.3, 1)" : ""}`}
          style={{ transformOrigin: "47% 81%", transform: `rotate(${angle}deg)` }}
        >
          <img src={tuas} alt="Tuas" className="w-full h-full object-contain pointer-events-none" />
        </div>
      </div>

      {/* MODAL WINDOW INTERAKTIF PEMBUKAAN HADIAH (STEP 5 & 6) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="modal-pop relative w-full max-w-[365px] rounded-[32px] bg-[#03091e] border-2 border-slate-800 p-6 flex flex-col items-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)]">
            
            {!isCapsuleOpened ? (
              /* --- REVISI STEP 5: TAP KAPSUL TANDA TANYA --- */
              <div className="w-full flex flex-col items-center">
                <div className="text-center mt-3 z-10">
                  <h2 className="text-4xl font-extrabold text-white tracking-wide mb-0.5">YEAY!</h2>
                  <p className="text-xs font-bold text-white tracking-widest uppercase opacity-90">LIHAT HADIAHMU!</p>
                </div>

                <div className="relative w-full h-[240px] flex items-center justify-center my-4">
                  <div className="sunburst-bg" />
                  <div className="absolute w-40 h-40 bg-amber-400/15 blur-2xl rounded-full" />
                  <div 
                    onClick={() => setIsCapsuleOpened(true)}
                    className="relative w-44 h-44 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 capsule-modal-breath"
                  >
                    <img src={droppedCapsule || capsulKuning} alt="Kapsul" className="w-[85%] h-[85%] object-contain" />
                    <span className="absolute text-[#facc15] font-black text-5xl drop-shadow-[0_0_12px_rgba(250,204,21,0.95)]">?</span>
                  </div>
                </div>

                <div className="text-center px-4 mb-4 z-10">
                  <p className="text-slate-300 text-sm font-medium">Tap kapsul untuk membuka hadiah!</p>
                </div>

                <div className="w-full px-2 pb-1 z-10">
                  <button
                    onClick={() => setIsCapsuleOpened(true)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3 text-sm font-bold text-slate-400 tracking-wide"
                  >
                    Buka Sekarang
                  </button>
                </div>
              </div>
            ) : (
              /* --- REVISI STEP 6: NOTIFIKASI TIKET UNGU --- */
              <div className="w-full flex flex-col items-center">
                <div className="text-center mt-3">
                  <h2 className="text-3xl font-black text-white tracking-wide">SELAMAT!</h2>
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">KAMU MENDAPATKAN</p>
                </div>

                <div className="w-full px-1 my-7">
                  <div className="ticket-edge-cut w-full bg-gradient-to-br from-[#3b0764] via-[#5b21b6] to-[#4338ca] border-2 border-purple-500/30 p-6 py-9 relative shadow-[0_15px_30px_rgba(91,33,182,0.45)] flex flex-col items-center justify-center">
                    <div className="absolute top-0 bottom-0 left-3.5 w-[1px] border-l border-dashed border-purple-300/25" />
                    <div className="absolute top-0 bottom-0 right-3.5 w-[1px] border-r border-dashed border-purple-300/25" />
                    <span className="text-purple-200/90 font-extrabold text-xs tracking-[0.25em] uppercase mb-1.5">VOUCHER</span>
                    <span className="text-3xl font-black text-white tracking-wide text-center whitespace-pre-line leading-tight uppercase">
                      {reward}
                    </span>
                  </div>
                </div>

                <div className="text-center px-4 mb-5 leading-relaxed">
                  <p className="text-slate-300 text-sm font-medium">Hadiah sudah masuk ke<br />akun membermu!</p>
                </div>

                <div className="w-full px-2 pb-1">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setDroppedCapsule(null);
                      setIsCapsuleOpened(false);
                      // Jika koin habis (0), kembalikan ke layar cek koin utama untuk instruksi isi ulang saldo
                      setCurrentStep(coinCount > 0 ? "playing" : "cek_koin");
                    }}
                    className="w-full rounded-2xl bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] text-slate-950 font-black text-base py-3 tracking-widest shadow-[0_5px_18px_rgba(234,179,8,0.4)]"
                  >
                    SELESAI
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}