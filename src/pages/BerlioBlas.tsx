import React, { useState, useRef, useEffect, useMemo } from "react";

// Import aset lokal
import mesinKosong from "../assets/images/mesin_kosong.png";
import tuas from "../assets/images/tuas.png";
import capsulBiru from "../assets/images/capsul_biru.png";
import capsulKuning from "../assets/images/capsul_kuning.png";
import capsulMerah from "../assets/images/capsul_merah.png";
import berlio1 from "../assets/images/berlio1.png";
import berlio2 from "../assets/images/berlio2.png";
import berlio3 from "../assets/images/berlio3.png";

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

interface FlyingCapsuleItem {
  id: number;
  src: string;
  angle: number;
  distance: number;
  scale: number;
  rotation: number;
  speed: number;
  delay: number;
}

// Info badge langkah (angka + label) yang ditampilkan mengikuti gambar panduan "CARA BERMAIN"
interface StepInfo {
  number: number;
  label: string;
}

// --- SEGMEN MASCOT BERLIO (PAKAI GAMBAR ASLI, BUKAN VECTOR SVG LAGI) ---
const BERLIO_EXPRESSION_MAP: Record<
  "happy" | "excited" | "surprised" | "wink" | "celebrate",
  string
> = {
  happy: berlio1,
  wink: berlio1,
  excited: berlio2,
  celebrate: berlio2,
  surprised: berlio3,
};

function BerlioMascot({
  expression,
  className = "w-20 h-20",
  style = {},
}: {
  expression: "happy" | "excited" | "surprised" | "wink" | "celebrate";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={BERLIO_EXPRESSION_MAP[expression]}
      alt={`Berlio ${expression}`}
      draggable={false}
      className={`${className} object-contain drop-shadow-[0_8px_16px_rgba(2,132,199,0.35)] select-none pointer-events-none`}
      style={style}
    />
  );
}

export default function BerlioBlast() {
  // --- STATE PERMAINAN ---
  const [currentStep, setCurrentStep] = useState<"masukkan_koin" | "playing">(
    "masukkan_koin",
  );

  const [coinBalance, setCoinBalance] = useState<number>(5);
  const [insertedCoins, setInsertedCoins] = useState<number>(0);
  const [coinCount, setCoinCount] = useState<number>(0);

  const [isInsertingCoin, setIsInsertingCoin] = useState<boolean>(false);

  const [angle, setAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [spinState, setSpinState] = useState<
    "stop" | "fast" | "medium" | "slow"
  >("stop");

  const [droppedCapsule, setDroppedCapsule] = useState<string | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isCapsuleOpening, setIsCapsuleOpening] = useState<boolean>(false);
  const [isCapsuleOpened, setIsCapsuleOpened] = useState<boolean>(false);

  const [flyingCapsules, setFlyingCapsules] = useState<FlyingCapsuleItem[]>([]);

  const [dropCounter, setDropCounter] = useState<number>(0);
  const [flashTrigger, setFlashTrigger] = useState<number>(0);

  // --- SUARA / SOUND EFFECT ---
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const tuasRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // =========================================================================
  // === KONFIGURASI POSISI "KACA" MESIN (DOME) — SATU SUMBER KEBENARAN ===
  // Semua elemen yang harus tampil DI DALAM kubah kaca (aura cahaya, cincin
  // efek putar, kompartemen kapsul, efek energi saat tuas ditarik) sekarang
  // memakai nilai yang SAMA dari objek ini. Sebelumnya nilai ini di-hardcode
  // terpisah di beberapa tempat dan sedikit berbeda-beda (mis. 64%/36% vs
  // 62%/34%), itulah yang bikin kapsul terlihat tidak menempel pas di kaca.
  //
  // Cara kalibrasi ke gambar mesin_kosong.png milikmu:
  // 1. Set SHOW_DOME_DEBUG = true di bawah ini.
  // 2. Buka aplikasi, kamu akan melihat garis putus-putus merah menandai
  //    area yang dianggap "kaca" oleh kode.
  // 3. Ubah angka top/left/width/height (dalam %) sampai garis itu pas
  //    menutupi kubah kaca asli di gambar.
  // 4. Set SHOW_DOME_DEBUG kembali ke false.
  // =========================================================================
  const DOME = {
    top: 59, // jarak dari atas container mesin (dalam %)
    left: 50, // jarak dari kiri container mesin (dalam %)
    width: 58, // lebar area kaca (dalam % dari lebar container mesin)
    height: 27, // tinggi area kaca (dalam % dari tinggi container mesin)
  };
  const SHOW_DOME_DEBUG = false;

  const domeBoxStyle: React.CSSProperties = {
    top: `${DOME.top}%`,
    left: `${DOME.left}%`,
    width: `${DOME.width}%`,
    height: `${DOME.height}%`,
  };

  // Batas bawah kubah kaca (dipakai supaya elemen lain, seperti layar LCD,
  // tidak pernah digambar menimpa area kapsul di dalam kaca).
  const DOME_BOTTOM = DOME.top + DOME.height; // = 86%

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

  const confettiPieces = useMemo(() => {
    const warna = [
      "#facc15",
      "#38bdf8",
      "#f472b6",
      "#a78bfa",
      "#34d399",
      "#fb923c",
      "#f87171",
    ];
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${(Math.random() * 0.9).toFixed(2)}s`,
      duration: `${(Math.random() * 1.5 + 1.8).toFixed(2)}s`,
      color: warna[i % warna.length],
      size: Math.random() * 7 + 5,
      radius: Math.random() > 0.45 ? "9999px" : "3px",
    }));
  }, []);

  const burstParticles = useMemo(() => {
    const warna = ["#fde047", "#38bdf8", "#f472b6", "#a78bfa", "#4ade80"];
    return Array.from({ length: 18 }).map((_, i) => {
      const sudut = (i / 18) * Math.PI * 2;
      const jarak = 75 + Math.random() * 60;
      return {
        id: i,
        tx: `${Math.cos(sudut) * jarak}px`,
        ty: `${Math.sin(sudut) * jarak}px`,
        color: warna[i % warna.length],
        delay: `${(Math.random() * 0.12).toFixed(2)}s`,
      };
    });
  }, []);

  const listKapsul: KapsulItem[] = [
    { id: 1, src: capsulBiru, top: "6%", left: "10%", rotation: "rotate-[15deg]", scale: "scale-90", zIndex: "z-10" },
    { id: 2, src: capsulMerah, top: "3%", left: "27%", rotation: "rotate-[-35deg]", scale: "scale-95", zIndex: "z-10" },
    { id: 3, src: capsulKuning, top: "5%", left: "44%", rotation: "rotate-[50deg]", scale: "scale-90", zIndex: "z-10" },
    { id: 4, src: capsulBiru, top: "2%", left: "61%", rotation: "rotate-[-20deg]", scale: "scale-95", zIndex: "z-10" },
    { id: 5, src: capsulMerah, top: "6%", left: "77%", rotation: "rotate-[30deg]", scale: "scale-90", zIndex: "z-10" },

    { id: 6, src: capsulKuning, top: "20%", left: "4%", rotation: "rotate-[-60deg]", scale: "scale-95", zIndex: "z-15" },
    { id: 7, src: capsulMerah, top: "18%", left: "20%", rotation: "rotate-[110deg]", scale: "scale-100", zIndex: "z-15" },
    { id: 8, src: capsulBiru, top: "22%", left: "37%", rotation: "rotate-[15deg]", scale: "scale-95", zIndex: "z-15" },
    { id: 9, src: capsulKuning, top: "19%", left: "54%", rotation: "rotate-[-50deg]", scale: "scale-100", zIndex: "z-15" },
    { id: 10, src: capsulMerah, top: "23%", left: "70%", rotation: "rotate-[40deg]", scale: "scale-95", zIndex: "z-15" },
    { id: 11, src: capsulBiru, top: "20%", left: "85%", rotation: "rotate-[-10deg]", scale: "scale-90", zIndex: "z-15" },

    { id: 12, src: capsulMerah, top: "36%", left: "10%", rotation: "rotate-[5deg]", scale: "scale-105", zIndex: "z-20" },
    { id: 13, src: capsulKuning, top: "34%", left: "28%", rotation: "rotate-[-25deg]", scale: "scale-100", zIndex: "z-20" },
    { id: 14, src: capsulBiru, top: "38%", left: "46%", rotation: "rotate-[75deg]", scale: "scale-105", zIndex: "z-20" },
    { id: 15, src: capsulMerah, top: "35%", left: "64%", rotation: "rotate-[85deg]", scale: "scale-100", zIndex: "z-20" },
    { id: 16, src: capsulKuning, top: "37%", left: "81%", rotation: "rotate-[-15deg]", scale: "scale-105", zIndex: "z-20" },

    { id: 17, src: capsulBiru, top: "52%", left: "16%", rotation: "rotate-[12deg]", scale: "scale-110", zIndex: "z-30" },
    { id: 18, src: capsulKuning, top: "50%", left: "34%", rotation: "rotate-[-20deg]", scale: "scale-105", zIndex: "z-30" },
    { id: 19, src: capsulMerah, top: "54%", left: "52%", rotation: "rotate-[35deg]", scale: "scale-110", zIndex: "z-30" },
    { id: 20, src: capsulBiru, top: "51%", left: "70%", rotation: "rotate-[-45deg]", scale: "scale-105", zIndex: "z-30" },

    { id: 21, src: capsulKuning, top: "62%", left: "22%", rotation: "rotate-[-8deg]", scale: "scale-115", zIndex: "z-35" },
    { id: 22, src: capsulMerah, top: "60%", left: "42%", rotation: "rotate-[28deg]", scale: "scale-110", zIndex: "z-35" },
    { id: 23, src: capsulBiru, top: "64%", left: "60%", rotation: "rotate-[-30deg]", scale: "scale-115", zIndex: "z-35" },
  ];

  const playAudio = () => {
    if (isMuted) return;
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

  const getAudioCtx = (): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return null;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playTone = (
    ctx: AudioContext,
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.22,
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + startOffset);
    gain.gain.linearRampToValueAtTime(
      volume,
      ctx.currentTime + startOffset + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + startOffset + duration,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration + 0.05);
  };

  const playNoiseBurst = (
    ctx: AudioContext,
    duration: number,
    volume = 0.3,
  ) => {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  };

  const playCoinInsertSfx = () => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    playTone(ctx, 1046.5, 0, 0.12, "sine", 0.22);
    playTone(ctx, 1568, 0.08, 0.18, "sine", 0.18);
  };

  const playClickSfx = () => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    playTone(ctx, 700, 0, 0.07, "square", 0.12);
  };

  const playLeverGrabSfx = () => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    playTone(ctx, 240, 0, 0.09, "square", 0.09);
  };

  const playBlastImpactSfx = () => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    playTone(ctx, 95, 0, 0.35, "sine", 0.35);
    playTone(ctx, 60, 0.02, 0.4, "sine", 0.22);
    playNoiseBurst(ctx, 0.3, 0.28);
  };

  const playCapsulePopSfx = () => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.24, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const playRewardFanfareSfx = () => {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) =>
      playTone(ctx, freq, i * 0.11, 0.28, "triangle", 0.22),
    );
  };

  const kocokHadiah = () => {
    const rand = Math.floor(Math.random() * 100);
    if (rand >= 0 && rand <= 15) return "VOUCHER\nRp50.000";
    if (rand >= 16 && rand <= 30) return "PRODUK GRATIS!";
    if (rand >= 31 && rand <= 60) return "VOUCHER\nRp25.000";
    if (rand >= 61 && rand <= 80) return "250 POIN";
    return "100 POIN / SNACK";
  };

  const handleMasukkanCoin = () => {
    if (isInsertingCoin) return;
    if (coinBalance <= 0) return;

    playCoinInsertSfx();
    setIsInsertingCoin(true);
    setTimeout(() => {
      setIsInsertingCoin(false);
      setCoinBalance((prev) => Math.max(0, prev - 1));
      setInsertedCoins((prev) => prev + 1);
    }, 750);
  };

  const handleMulaiMain = () => {
    if (insertedCoins <= 0) return;
    playClickSfx();
    setCoinCount(insertedCoins);
    setInsertedCoins(0);
    setCurrentStep("playing");
  };

  const handleKembaliIsiKoin = () => {
    playClickSfx();
    setDroppedCapsule(null);
    setIsCapsuleOpening(false);
    setIsCapsuleOpened(false);
    setShowModal(false);
    setFlyingCapsules([]);
    setCurrentStep("masukkan_koin");
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentStep !== "playing") return;
    if (coinCount <= 0) return;

    if (e.cancelable) e.preventDefault();
    playLeverGrabSfx();
    setDroppedCapsule(null);
    setIsCapsuleOpening(false);
    setIsCapsuleOpened(false);
    setFlyingCapsules([]);
    setIsDragging(true);
    playAudio();
  };

  const handleOpenCapsule = () => {
    if (isCapsuleOpening || isCapsuleOpened) return;

    setIsCapsuleOpening(true);

    const ctx = getAudioCtx();
    if (ctx && !isMuted) {
      let t = 0;
      const shakeInterval = setInterval(() => {
        if (t > 6) {
          clearInterval(shakeInterval);
          return;
        }
        playTone(ctx, 180 + Math.random() * 85, 0, 0.08, "triangle", 0.16);
        t++;
      }, 100);
    }

    setTimeout(() => {
      setIsCapsuleOpening(false);
      setIsCapsuleOpened(true);
      playRewardFanfareSfx();
    }, 850);
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
          setFlashTrigger((f) => f + 1);
          playBlastImpactSfx();

          const capsuleImages = [capsulBiru, capsulKuning, capsulMerah];
          const listPeledakan = Array.from({ length: 16 }).map((_, idx) => {
            const angleDeg = Math.random() * 360;
            const distance = 160 + Math.random() * 220;
            const scale = 0.5 + Math.random() * 0.7;
            const rot = Math.random() * 720 - 360;
            const speed = 0.5 + Math.random() * 0.6;
            const delay = Math.random() * 0.15;
            return {
              id: idx,
              src: capsuleImages[
                Math.floor(Math.random() * capsuleImages.length)
              ],
              angle: angleDeg,
              distance,
              scale,
              rotation: rot,
              speed,
              delay,
            };
          });
          setFlyingCapsules(listPeledakan);

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
              setDropCounter((c) => c + 1);
              playCapsulePopSfx();
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

  const stepInfo: StepInfo = useMemo(() => {
    if (currentStep === "masukkan_koin") {
      return insertedCoins > 0
        ? { number: 1, label: `SIAP MULAI (${insertedCoins} KOIN)` }
        : { number: 1, label: "MASUKKAN BLAST COIN" };
    }
    if (showModal) {
      return isCapsuleOpened
        ? { number: 6, label: "HADIAH MASUK!" }
        : { number: 5, label: "LIHAT HADIAHMU!" };
    }
    if (droppedCapsule) return { number: 5, label: "LIHAT HADIAHMU!" };
    if (isDragging || spinState === "fast")
      return { number: 3, label: "TARIK TUAS!" };
    if (spinState === "medium" || spinState === "slow")
      return { number: 4, label: "BLASTING!" };
    return { number: 2, label: "SIAP BLAST!" };
  }, [
    currentStep,
    showModal,
    isCapsuleOpened,
    droppedCapsule,
    isDragging,
    spinState,
    insertedCoins,
  ]);

  const tampilkanOverlayBlasting =
    spinState === "medium" || spinState === "slow";

  const chargePercent = Math.min(100, (angle / 30) * 100);

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
        @keyframes floatCapsuleA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes floatCapsuleB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-3deg); }
        }
        @keyframes floatCapsuleC {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(4deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.55; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes leaverGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(56,189,248,0.35)); }
          50% { filter: drop-shadow(0 0 16px rgba(56,189,248,0.85)); }
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
        @keyframes coinSlideIn {
          0% { transform: translateY(-70px) rotate(0deg); opacity: 1; }
          70% { transform: translateY(6px) rotate(180deg); opacity: 1; }
          100% { transform: translateY(30px) rotate(220deg); opacity: 0; }
        }
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lcdFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-40px) translateX(0) rotate(0deg); opacity: 1; }
          50% { transform: translateY(220px) translateX(15px) rotate(280deg); opacity: 1; }
          100% { transform: translateY(480px) translateX(-15px) rotate(560deg); opacity: 0; }
        }
        @keyframes particleBurstOut {
          0% { transform: translate(-50%, -50%) translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0.25); opacity: 0; }
        }
        @keyframes screenFlash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes machineShakeHeavy {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, 5px) rotate(-1deg); }
          20% { transform: translate(5px, -5px) rotate(1deg); }
          30% { transform: translate(-4px, 3px) rotate(-0.5deg); }
          40% { transform: translate(4px, -3px) rotate(0.5deg); }
          50% { transform: translate(-3px, 2px) rotate(-0.3deg); }
          60% { transform: translate(3px, -2px) rotate(0.3deg); }
          70% { transform: translate(-2px, 1px) rotate(-0.1deg); }
          80% { transform: translate(2px, -1px) rotate(0.1deg); }
        }
        @keyframes buttonShineSweep {
          0% { left: -120%; }
          16% { left: 140%; }
          100% { left: 140%; }
        }
        @keyframes tapHintBounce {
          0%, 100% { transform: translateY(0) rotate(-12deg) scale(1); }
          50% { transform: translateY(-12px) rotate(-12deg) scale(1.1); }
        }
        @keyframes bounceShort {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes capsuleCrackShake {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 15px rgba(250,204,21,0.5)); }
          10% { transform: scale(1.1) rotate(-8deg); filter: drop-shadow(0 0 25px rgba(250,204,21,0.8)); }
          20% { transform: scale(1.1) rotate(8deg); filter: drop-shadow(0 0 25px rgba(250,204,21,0.8)); }
          30% { transform: scale(1.1) rotate(-12deg); filter: drop-shadow(0 0 35px rgba(255,255,255,0.9)); }
          40% { transform: scale(1.1) rotate(12deg); filter: drop-shadow(0 0 35px rgba(255,255,255,0.9)); }
          50% { transform: scale(1.15) rotate(-6deg); filter: drop-shadow(0 0 40px rgba(250,204,21,1)); }
          60% { transform: scale(1.15) rotate(6deg); filter: drop-shadow(0 0 40px rgba(250,204,21,1)); }
          70% { transform: scale(1.2) rotate(-10deg); filter: drop-shadow(0 0 45px rgba(255,255,255,1)); }
          80% { transform: scale(1.2) rotate(10deg); filter: drop-shadow(0 0 45px rgba(255,255,255,1)); }
          90% { transform: scale(1.25) rotate(0deg); filter: drop-shadow(0 0 50px rgba(250,204,21,1)); }
        }
        @keyframes capsuleFlyOut3D {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0.1) rotate(0deg);
            opacity: 1;
            filter: drop-shadow(0 0 0px transparent);
          }
          15% {
            opacity: 1;
            filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(var(--scale)) rotate(var(--rot)deg);
            opacity: 0;
          }
        }
        @keyframes popBadge {
          0% { transform: scale(0.4) rotate(-8deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .confetti-piece { animation-name: confettiFall; animation-timing-function: ease-in; animation-fill-mode: forwards; }
        .burst-particle { animation: particleBurstOut 0.75s cubic-bezier(0.2, 0.7, 0.3, 1) forwards; }
        .screen-flash { animation: screenFlash 0.4s ease-out forwards; }
        .machine-shake-heavy { animation: machineShakeHeavy 0.4s ease-in-out infinite; }
        .tap-hint-bounce { animation: tapHintBounce 1.1s ease-in-out infinite; }
        .pop-badge { animation: popBadge 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        .float-capsule-a { animation: floatCapsuleA 3.5s ease-in-out infinite; }
        .float-capsule-b { animation: floatCapsuleB 4.2s ease-in-out infinite; }
        .float-capsule-c { animation: floatCapsuleC 3.8s ease-in-out infinite; }

        .animate-fast { animation: gachaShuffle 0.13s linear infinite; }
        .animate-medium { animation: gachaShuffle 0.35s ease-in-out infinite; }
        .animate-slow { animation: gachaShuffle 0.75s ease-out infinite; }

        .animate-capsule-release {
          animation:
            capsulePopOut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            capsuleWobble 1.2s ease-in-out infinite 0.5s;
        }

        .star-dot { animation: twinkle ease-in-out infinite; }
        .glass-glow { animation: glowPulse 3.2s ease-in-out infinite; }
        .lever-glow { animation: leaverGlow 2.4s ease-in-out infinite; }
        .burst-ring { animation: burstRing 1.6s ease-out infinite; }
        .capsule-pulse { animation: capsuleGlowPulse 1.4s ease-in-out infinite; }
        .modal-pop { animation: fadeInModal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards; }
        .gacha-3d-ring { animation: spinHorizontalRing 1.4s linear infinite, ringPulseFX 2s ease-in-out infinite; }
        .capsule-modal-breath { animation: capsuleBreath 2s ease-in-out infinite; }
        .coin-slide-in { animation: coinSlideIn 0.75s cubic-bezier(0.55, 0, 0.55, 1) forwards; }
        .check-pop { animation: checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .lcd-flicker { animation: lcdFlicker 1.8s ease-in-out infinite; }
        
        .animate-capsule-fly {
          animation: capsuleFlyOut3D var(--speed) cubic-bezier(0.12, 0.82, 0.28, 1) var(--delay) forwards;
        }
        .animate-capsule-crack {
          animation: capsuleCrackShake 0.85s cubic-bezier(.36,.07,.19,.97) both;
        }
        .shine-sweep-button {
          position: absolute;
          top: 0;
          left: -120%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-25deg);
          animation: buttonShineSweep 3s ease-in-out infinite;
        }
        .animate-bounce-short {
          animation: bounceShort 0.4s ease-in-out infinite;
        }

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
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      {/* BADGE LANGKAH AKTIF (persisten di pojok kiri atas) */}
      <div className="absolute top-3 left-3 z-[60] flex items-center gap-2 bg-[#0b1230]/85 border border-amber-400/30 rounded-full pl-1.5 pr-4 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur-sm">
        <span className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 text-slate-950 text-xs font-black flex items-center justify-center shadow-inner">
          {stepInfo.number}
        </span>
        <span className="text-[11px] font-black text-amber-300 tracking-wider uppercase">
          {stepInfo.label}
        </span>
      </div>

      {/* Tombol mute/unmute suara, persisten di pojok kanan atas */}
      <button
        onClick={() => {
          setIsMuted((prev) => {
            const next = !prev;
            if (next && audioRef.current) {
              audioRef.current.pause();
              if (fadeIntervalRef.current)
                clearInterval(fadeIntervalRef.current);
            }
            return next;
          });
        }}
        className="absolute top-3 right-3 z-[60] w-9 h-9 rounded-full bg-[#0b1230]/85 border border-amber-400/30 shadow-[0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center text-amber-300 active:scale-90 transition"
        aria-label={isMuted ? "Nyalakan suara" : "Matikan suara"}
      >
        {isMuted ? (
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M18.36 5.64a9 9 0 0 1 0 12.72" />
          </svg>
        )}
      </button>

      {/* BERLIO CUTE MASCOT FLOATING COMPANION */}
      {currentStep === "playing" && !showModal && (
        <div className="absolute bottom-4 right-4 z-40 flex flex-col items-center pointer-events-none">
          <div className="bg-[#0b1230]/95 border border-sky-500/30 px-3 py-1.5 rounded-xl text-[10px] text-sky-200 font-bold tracking-wide mb-1.5 shadow-[0_5px_15px_rgba(0,0,0,0.5)] max-w-[125px] text-center animate-pulse">
            {isDragging
              ? "TARIK LAGI! 🔥"
              : spinState === "fast"
                ? "BERPUTAR! 🌀"
                : spinState === "medium" || spinState === "slow"
                  ? "BOOM! BLAST! 🚀"
                  : droppedCapsule
                    ? "Buka kapsul! 🎁"
                    : "TARIK TUASNYA! 👇"}
          </div>
          <BerlioMascot
            expression={
              isDragging
                ? "excited"
                : spinState === "fast"
                  ? "surprised"
                  : spinState === "medium" || spinState === "slow"
                    ? "celebrate"
                    : droppedCapsule
                      ? "wink"
                      : "happy"
            }
            className="w-20 h-20 animate-bounce"
            style={{ animationDuration: "3s" }}
          />
        </div>
      )}

      {/* =========================================================================
          STEP 1: MASUKKAN BLAST COIN
         ========================================================================= */}
      {currentStep === "masukkan_koin" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-4">
          <div className="modal-pop relative w-full max-w-[340px] aspect-[3/4.2] rounded-[28px] bg-gradient-to-b from-[#071130] to-[#03071a] border border-slate-800 p-6 flex flex-col items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-visible">
            <div className="absolute top-[-52px] z-20 flex flex-col items-center pointer-events-none">
              <BerlioMascot
                expression="happy"
                className="w-24 h-24 animate-bounce"
                style={{ animationDuration: "2.8s" }}
              />
              <div className="bg-sky-400 text-slate-950 font-black text-[9px] tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow-md -mt-1.5 animate-pulse">
                HALO KAK! 👋
              </div>
            </div>

            <div className="text-center mt-8 z-10">
              <h3 className="text-xl font-black text-white tracking-wider uppercase">
                MASUKKAN BLAST COIN
              </h3>
              <p className="text-amber-400 text-[11px] font-bold tracking-widest uppercase mt-1">
                Saldo Blast Coin: {coinBalance}
              </p>
              <p className="text-sky-300 text-[11px] font-bold tracking-widest uppercase mt-0.5">
                Sudah Dimasukkan: {insertedCoins}
              </p>
            </div>

            <div className="relative flex flex-col items-center justify-center my-auto w-full z-10">
              <div className="relative w-40 h-44 rounded-2xl bg-gradient-to-b from-[#12234f] to-[#0a1636] border-2 border-sky-400/20 shadow-[inset_0_0_25px_rgba(56,189,248,0.15),0_10px_25px_rgba(0,0,0,0.5)] flex flex-col items-center justify-end pb-6 overflow-hidden">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-sky-300/70 tracking-[0.2em] uppercase">
                  Berlio Blast
                </div>

                {isInsertingCoin && (
                  <div className="coin-slide-in absolute top-8 w-11 h-11 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border-2 border-yellow-100/50 flex items-center justify-center shadow-[0_4px_10px_rgba(217,119,6,0.6)] z-20">
                    <span className="text-white text-lg font-black italic">
                      B
                    </span>
                  </div>
                )}

                {insertedCoins > 0 && (
                  <div className="absolute bottom-8 flex items-center justify-center gap-[-6px]">
                    {Array.from({ length: Math.min(insertedCoins, 5) }).map(
                      (_, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border border-yellow-100/50 shadow-[0_2px_6px_rgba(217,119,6,0.5)] -ml-2 first:ml-0"
                        />
                      ),
                    )}
                    {insertedCoins > 5 && (
                      <span className="text-amber-300 text-[10px] font-black ml-1">
                        +{insertedCoins - 5}
                      </span>
                    )}
                  </div>
                )}

                <div className="relative w-16 h-3 rounded-full bg-black/70 border border-sky-400/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div
                    className={`absolute w-[92%] h-[75%] rounded-full transition-all duration-300 ${
                      isInsertingCoin
                        ? "bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        : "bg-sky-500/20"
                    }`}
                  />
                </div>
              </div>

              <p className="text-slate-300 text-xs font-semibold mt-4 text-center max-w-[220px] leading-relaxed">
                {insertedCoins > 0
                  ? `Kamu sudah memasukkan ${insertedCoins} Blast Coin. Masukkan lagi atau tekan "Mulai Main" untuk bermain.`
                  : "Masukkan Blast Coin satu per satu untuk memulai permainan!"}
              </p>
            </div>

            <div className="w-full flex flex-col items-center mb-2 gap-2.5 z-10">
              <button
                onClick={handleMasukkanCoin}
                disabled={isInsertingCoin || coinBalance <= 0}
                className="w-full max-w-[240px] rounded-full bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] py-3 text-base font-black text-slate-950 tracking-widest shadow-[0_4px_15px_rgba(245,158,11,0.4),inset_0_2px_2px_rgba(255,255,255,0.3)] transition active:scale-[0.96] uppercase disabled:opacity-60 relative overflow-hidden group"
              >
                <div className="shine-sweep-button" />
                <span className="relative z-10">
                  {isInsertingCoin
                    ? "MEMASUKKAN..."
                    : coinBalance <= 0
                      ? "SALDO HABIS"
                      : "MASUKKAN 1 COIN"}
                </span>
              </button>

              <button
                onClick={handleMulaiMain}
                disabled={insertedCoins <= 0}
                className="w-full max-w-[240px] rounded-full border-2 border-emerald-400/70 bg-emerald-500/10 py-2.5 text-sm font-black text-emerald-300 tracking-widest shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] transition active:scale-[0.96] uppercase disabled:opacity-40 disabled:border-slate-600 disabled:text-slate-500"
              >
                MULAI MAIN ({insertedCoins})
              </button>

              <span
                className="mt-2 text-sky-400 font-bold tracking-wider italic text-lg select-none opacity-90 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                style={{ fontFamily: "cursive, sans-serif" }}
              >
                Berlian 90
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2-4: MESIN GACHA (SIAP BLAST -> TARIK TUAS -> BLASTING)
         ========================================================================= */}
      {spinState === "medium" && (
        <div
          key={`flash-${flashTrigger}`}
          className="screen-flash fixed inset-0 z-[80] bg-white pointer-events-none"
        />
      )}

      <div
        className={`relative w-full max-w-[520px] aspect-[550/631] flex items-center justify-center scale-105 md:scale-110 transition-transform [perspective:1000px] ${
          spinState === "medium" || spinState === "slow"
            ? "machine-shake-heavy"
            : ""
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 cursor-grabbing bg-transparent" />
        )}

        {/* Indikator Saldo Koin Sederhana di Atas Kaca Mesin */}
        <div className="absolute top-[3%] left-1/2 -translate-x-1/2 text-center z-40 pointer-events-none w-full">
          <span className="block text-xs font-black text-amber-400 tracking-[0.25em] uppercase drop-shadow-md">
            KOIN DI MESIN: {coinCount}
          </span>
        </div>

        {/*
          LCD SCREEN
          -----------------------------------------------------------------
          CATATAN PERBAIKAN: sebelumnya layar LCD ini diposisikan di
          top-[68.5%], yang jatuh DI DALAM rentang vertikal kubah kaca
          (DOME.top 59% s/d DOME.top+DOME.height = 86%). Karena elemen ini
          dirender setelah kompartemen kapsul dan sama-sama z-40, browser
          menggambarnya di lapisan paling atas sehingga kotak teks
          "SIAP? Tarik tuas untuk mulai!" menimpa tumpukan kapsul di dalam
          kaca (persis seperti pada screenshot yang dilampirkan).

          Perbaikannya: geser layar LCD ke bawah, keluar dari area kaca
          (DOME_BOTTOM = 86%), supaya tidak pernah lagi menutupi kapsul.
          Sekarang ia duduk di panel konsol mesin, di bawah kubah kaca.
        */}
        {currentStep === "playing" && (
          <div
            className="absolute left-[50%] -translate-x-1/2 w-[34%] h-[7.5%] z-40 pointer-events-none flex flex-col items-center justify-center overflow-hidden"
            style={{ top: `${DOME_BOTTOM + 3}%` }}
          >
            <div className="relative w-full h-full bg-[#03153c]/92 border border-sky-400/40 rounded-md flex flex-col items-center justify-center p-1 shadow-[inset_0_0_10px_rgba(56,189,248,0.55),0_0_12px_rgba(56,189,248,0.35)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-60" />

              {isDragging || spinState === "fast" ? (
                <div className="text-center animate-pulse">
                  <p className="text-amber-400 text-[10px] font-black tracking-widest uppercase">
                    BLAST!
                  </p>
                  <p className="text-sky-300 text-[7px] font-bold">
                    Semoga beruntung, Kak!
                  </p>
                </div>
              ) : spinState === "medium" || spinState === "slow" ? (
                <div className="text-center">
                  <p className="text-pink-500 text-[10px] font-black tracking-widest uppercase animate-bounce">
                    BLASTING!
                  </p>
                  <p className="text-pink-300 text-[7px] font-bold">
                    Tunggu sebentar...
                  </p>
                </div>
              ) : coinCount <= 0 ? (
                <div className="text-center">
                  <p className="text-red-400 text-[9px] font-black tracking-widest uppercase">
                    KOIN HABIS
                  </p>
                  <p className="text-slate-400 text-[7px] font-bold">
                    Isi koin lagi ya!
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sky-300 text-[10px] font-black tracking-widest uppercase">
                    SIAP?
                  </p>
                  <p className="text-slate-300 text-[7px] font-bold">
                    Tarik tuas untuk mulai!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === "playing" &&
          coinCount <= 0 &&
          !isDragging &&
          spinState === "stop" &&
          !droppedCapsule && (
            <div className="absolute top-[16%] left-1/2 -translate-x-1/2 z-40">
              <button
                onClick={handleKembaliIsiKoin}
                className="rounded-full bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] px-5 py-2 text-xs font-black text-slate-950 tracking-widest shadow-[0_4px_12px_rgba(245,158,11,0.4)] hover:scale-105 transition active:scale-[0.96] uppercase relative overflow-hidden"
              >
                <div className="shine-sweep-button" />
                Isi Koin Lagi
              </button>
            </div>
          )}

        {/* Aura Kaca — sekarang memakai DOME yang sama dengan kompartemen kapsul */}
        <div
          className="glass-glow absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.35),transparent_70%)] blur-2xl z-0 pointer-events-none"
          style={domeBoxStyle}
        />

        {/* Cincin Efek Putaran Kapsul — sebelumnya pakai ukuran berbeda (62%/34%), sekarang disamakan */}
        <div
          className={`absolute -translate-x-1/2 -translate-y-1/2 z-[35] pointer-events-none overflow-visible transition-all duration-500 ease-in-out
            ${spinState === "fast" ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"}
          `}
          style={domeBoxStyle}
        >
          <div className="gacha-3d-ring absolute top-1/2 left-1/2 w-[102%] aspect-square rounded-full border-[3px] border-amber-300 shadow-[inset_0_0_15px_rgba(234,179,8,0.6)]">
            {[0, 90, 180, 270].map((deg) => (
              <span
                key={deg}
                className="star-dot absolute w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(253,224,71,0.9)]"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${deg}deg) translate(90px) translate(-50%, -50%)`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Gambar Kerangka Utama Mesin */}
        <img
          src={mesinKosong}
          alt="Mesin Gacha"
          className="w-[85%] h-[85%] object-contain pointer-events-none z-30 drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)] mx-auto"
        />

        {/* Kompartemen Kapsul di Dalam Kubah Kaca — DOME dipakai di sini juga */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-transparent z-40 overflow-hidden rounded-full"
          style={domeBoxStyle}
        >
          {SHOW_DOME_DEBUG && (
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-500 pointer-events-none z-[999]" />
          )}
          <div className="relative w-full h-full">
            {listKapsul.map((kapsul) => {
              let animationClass = "";
              if (spinState === "fast") animationClass = "animate-fast";
              else if (spinState === "medium")
                animationClass = "animate-medium";
              else if (spinState === "slow") animationClass = "animate-slow";

              let floatClass = "";
              if (spinState === "stop" && !isDragging) {
                const floatTypes = [
                  "float-capsule-a",
                  "float-capsule-b",
                  "float-capsule-c",
                ];
                floatClass = floatTypes[kapsul.id % floatTypes.length];
              }

              return (
                <img
                  key={kapsul.id}
                  src={kapsul.src}
                  alt="Capsul"
                  className={`absolute w-[26%] aspect-square object-contain opacity-100 
                    ${animationClass ? animationClass : `transition-all duration-1000 ${kapsul.rotation} ${kapsul.scale}`} 
                    ${floatClass}
                    ${kapsul.zIndex}`}
                  style={{ top: kapsul.top, left: kapsul.left }}
                />
              );
            })}
          </div>
          {/* Vignette tepi kaca: menggelapkan pinggir kompartemen supaya bola di
              tepi terlihat "masuk" ke lengkungan kaca, bukan seperti tempelan
              datar di atas rangka mesin. Murni dekoratif, tidak mengubah logika. */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                "inset 0 0 18px 6px rgba(2,6,23,0.55), inset 0 10px 20px rgba(2,6,23,0.35)",
            }}
          />
        </div>

        {/* Efek Pengisian Energi Kubah Saat Tuas Ditarik — DOME dipakai di sini juga */}
        {isDragging && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[45] rounded-full overflow-hidden transition-all duration-300"
            style={{
              ...domeBoxStyle,
              background: `radial-gradient(circle, rgba(56, 189, 248, ${0.1 + (chargePercent / 100) * 0.4}) 0%, transparent 70%)`,
              boxShadow: `inset 0 0 ${20 + (chargePercent / 100) * 50}px rgba(56, 189, 248, ${0.2 + (chargePercent / 100) * 0.6})`,
            }}
          >
            {angle > 15 && (
              <div className="absolute inset-0 opacity-80 animate-pulse">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full animate-spin"
                  style={{ animationDuration: "1s" }}
                >
                  <path
                    d="M 50,10 L 45,35 L 55,40 L 50,60 L 60,65 L 50,90"
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={angle > 22 ? 0.9 : 0.4}
                  />
                  <path
                    d="M 10,50 L 35,45 L 40,55 L 60,50 L 65,60 L 90,50"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={angle > 25 ? 0.9 : 0.3}
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: OVERLAY "BLASTING!" */}
        {tampilkanOverlayBlasting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <div className="blast-pulse-bg absolute top-1/2 left-1/2 w-[90%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.45),transparent_70%)] blur-2xl -translate-x-1/2 -translate-y-1/2" />

            <div className="relative w-[115%] h-auto max-w-[430px] aspect-[2/1] animate-bounce-short z-50">
              <svg
                viewBox="0 0 500 250"
                className="w-full h-full drop-shadow-[0_12px_28px_rgba(249,115,22,0.65)]"
              >
                <defs>
                  <linearGradient
                    id="goldGradComic"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#fef08a" />
                    <stop offset="65%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient
                    id="burstGradComic"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="40%" stopColor="#ea580c" />
                    <stop offset="75%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>
                  <mask id="dotsMaskComic">
                    <rect x="0" y="0" width="500" height="250" fill="#fff" />
                    <pattern
                      id="dotPatternComic"
                      x="0"
                      y="0"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="5" cy="5" r="2.5" fill="#000" />
                    </pattern>
                    <rect
                      x="0"
                      y="0"
                      width="500"
                      height="250"
                      fill="url(#dotPatternComic)"
                      opacity="0.15"
                    />
                  </mask>
                </defs>

                <path
                  d="M 250,5 L 285,75 L 360,40 L 325,105 L 420,105 L 330,135 L 390,210 L 295,175 L 250,245 L 205,175 L 110,210 L 170,135 L 80,105 L 175,105 L 140,40 L 215,75 Z"
                  fill="url(#burstGradComic)"
                  stroke="#451a03"
                  strokeWidth="8"
                  strokeLinejoin="miter"
                  className="animate-pulse"
                />

                <path
                  d="M 250,25 L 275,85 L 335,60 L 305,110 L 385,110 L 310,132 L 355,190 L 280,162 L 250,215 L 220,162 L 145,190 L 190,132 L 115,110 L 195,110 L 165,60 L 225,85 Z"
                  fill="#facc15"
                  stroke="#78350f"
                  strokeWidth="4"
                  strokeLinejoin="miter"
                  opacity="0.95"
                />

                <path
                  d="M 250,25 L 275,85 L 335,60 L 305,110 L 385,110 L 310,132 L 355,190 L 280,162 L 250,215 L 220,162 L 145,190 L 190,132 L 115,110 L 195,110 L 165,60 L 225,85 Z"
                  fill="#ea580c"
                  mask="url(#dotsMaskComic)"
                />

                <g
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  opacity="0.65"
                  strokeLinecap="round"
                >
                  <line x1="250" y1="125" x2="280" y2="40" />
                  <line x1="250" y1="125" x2="380" y2="70" />
                  <line x1="250" y1="125" x2="410" y2="150" />
                  <line x1="250" y1="125" x2="310" y2="210" />
                  <line x1="250" y1="125" x2="190" y2="210" />
                  <line x1="250" y1="125" x2="90" y2="150" />
                  <line x1="250" y1="125" x2="120" y2="70" />
                  <line x1="250" y1="125" x2="220" y2="40" />
                </g>

                <text
                  x="254"
                  y="152"
                  textAnchor="middle"
                  fontSize="100"
                  fontWeight="900"
                  fontStyle="italic"
                  fill="#030712"
                  style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
                >
                  BLAST!
                </text>
                <text
                  x="250"
                  y="148"
                  textAnchor="middle"
                  fontSize="100"
                  fontWeight="900"
                  fontStyle="italic"
                  fill="none"
                  stroke="#030712"
                  strokeWidth="18"
                  strokeLinejoin="round"
                  style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
                >
                  BLAST!
                </text>
                <text
                  x="250"
                  y="148"
                  textAnchor="middle"
                  fontSize="100"
                  fontWeight="900"
                  fontStyle="italic"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinejoin="round"
                  style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
                >
                  BLAST!
                </text>
                <text
                  x="250"
                  y="148"
                  textAnchor="middle"
                  fontSize="100"
                  fontWeight="900"
                  fontStyle="italic"
                  fill="url(#goldGradComic)"
                  style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}
                >
                  BLAST!
                </text>
              </svg>
            </div>
            <div className="absolute w-[180%] aspect-square border-none rounded-full pointer-events-none z-0 bg-[repeating-conic-gradient(from_0deg,rgba(251,191,36,0.15)_0deg_10deg,transparent_10deg_20deg)] animate-[spin_10s_linear_infinite]" />
          </div>
        )}

        {/* Kapsul Peledakan yang Berhamburan ke Luar (Step 4) */}
        {(spinState === "medium" || spinState === "slow") &&
          flyingCapsules.map((c) => {
            const rad = (c.angle * Math.PI) / 180;
            const tx = `${Math.cos(rad) * c.distance}px`;
            const ty = `${Math.sin(rad) * c.distance}px`;
            return (
              <img
                key={c.id}
                src={c.src}
                alt="Flying Capsule"
                className="animate-capsule-fly absolute z-50 pointer-events-none w-14 h-14 object-contain"
                style={{
                  top: `${DOME.top}%`,
                  left: `${DOME.left}%`,
                  ["--tx" as any]: tx,
                  ["--ty" as any]: ty,
                  ["--scale" as any]: c.scale,
                  ["--rot" as any]: c.rotation,
                  ["--speed" as any]: `${c.speed}s`,
                  ["--delay" as any]: `${c.delay}s`,
                }}
              />
            );
          })}

        {/* Efek Burst Lingkaran + Partikel Menyebar Saat Kapsul Keluar */}
        {droppedCapsule && !showModal && (
          <div
            key={`burst-${dropCounter}`}
            className="absolute bottom-[9.5%] left-[39%] w-[22%] aspect-square z-30 pointer-events-none flex items-center justify-center"
          >
            <span className="burst-ring absolute inset-0 rounded-full border-2 border-yellow-300" />
            <span
              className="burst-ring absolute inset-0 rounded-full border-2 border-sky-300"
              style={{ animationDelay: "0.55s" }}
            />
            {burstParticles.map((p) => (
              <span
                key={p.id}
                className="burst-particle absolute top-1/2 left-1/2 rounded-full"
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: p.color,
                  boxShadow: `0 0 6px ${p.color}`,
                  animationDelay: p.delay,
                  ["--tx" as any]: p.tx,
                  ["--ty" as any]: p.ty,
                }}
              />
            ))}
          </div>
        )}

        {/* Objek Kapsul Keluar yang Dapat Diklik */}
        {droppedCapsule && (
          <div
            onClick={() => setShowModal(true)}
            className="absolute bottom-[9.5%] left-[39%] w-[22%] aspect-square z-40 cursor-pointer animate-capsule-release flex items-center justify-center"
          >
            <img
              src={droppedCapsule}
              alt="Kapsul Hadiah Keluar"
              className="capsule-pulse w-full h-full object-contain"
            />
          </div>
        )}

        {/* Tuas Kemudi Pemutar Mesin (Step 3) */}
        <div
          ref={tuasRef}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          className={`absolute w-[25%] h-[35%] left-[74.5%] top-[40.5%] z-10 scale-[1.75] touch-none
            ${
              currentStep === "playing" && coinCount > 0
                ? "cursor-grab active:cursor-grabbing lever-glow"
                : "cursor-not-allowed opacity-75"
            }
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

      {/* =========================================================================
          MODAL: STEP 5 (LIHAT HADIAHMU!) & STEP 6 (HADIAH MASUK!)
         ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="modal-pop relative w-full max-w-[365px] rounded-[32px] bg-[#03091e] border-2 border-slate-800 p-6 flex flex-col items-center overflow-visible shadow-[0_0_50px_rgba(0,0,0,0.95)]">
            {!isCapsuleOpened ? (
              <div className="w-full flex flex-col items-center">
                <div className="absolute top-[-52px] z-20 flex flex-col items-center pointer-events-none">
                  <BerlioMascot
                    expression="surprised"
                    className="w-24 h-24 animate-bounce"
                    style={{ animationDuration: "2.4s" }}
                  />
                  <div className="bg-amber-400 text-slate-950 font-black text-[9px] tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow-md -mt-1.5 animate-pulse">
                    {isCapsuleOpening ? "DEG-DEGAN! 😲" : "AYO BUKA! 😲"}
                  </div>
                </div>

                <div className="text-center mt-8 z-10">
                  <h2 className="text-4xl font-extrabold text-white tracking-wide mb-0.5">
                    YEAY!
                  </h2>
                  <p className="text-xs font-bold text-amber-300 tracking-widest uppercase opacity-95">
                    LIHAT HADIAHMU!
                  </p>
                </div>

                <div className="relative w-full h-[240px] flex items-center justify-center my-4 overflow-visible">
                  <div className="sunburst-bg" />
                  <div className="absolute w-40 h-40 bg-amber-400/15 blur-2xl rounded-full" />

                  {isCapsuleOpening && (
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                      <div className="absolute w-24 h-24 border-4 border-white rounded-full animate-ping opacity-75" />
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute w-56 h-56 animate-spin"
                        style={{ animationDuration: "1.5s" }}
                      >
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                          <line
                            key={deg}
                            x1="50"
                            y1="50"
                            x2={50 + Math.cos((deg * Math.PI) / 180) * 45}
                            y2={50 + Math.sin((deg * Math.PI) / 180) * 45}
                            stroke="#fbbf24"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray="10 5"
                            className="animate-pulse"
                          />
                        ))}
                      </svg>
                    </div>
                  )}

                  <div
                    onClick={handleOpenCapsule}
                    className={`relative w-44 h-44 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
                      ${isCapsuleOpening ? "animate-capsule-crack z-30" : "capsule-modal-breath"}`}
                  >
                    <img
                      src={droppedCapsule || capsulKuning}
                      alt="Kapsul"
                      className="w-[85%] h-[85%] object-contain"
                    />
                  </div>
                  {!isCapsuleOpening && (
                    <span className="tap-hint-bounce absolute bottom-6 right-10 text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] pointer-events-none">
                      👆
                    </span>
                  )}
                </div>

                <div className="text-center px-4 mb-4 z-10">
                  <p className="text-slate-300 text-sm font-medium">
                    {isCapsuleOpening
                      ? "Membuka kapsul..."
                      : "WOOHOO! Tap kapsul untuk membuka hadiah!"}
                  </p>
                </div>

                <div className="w-full px-2 pb-1 z-10">
                  <button
                    onClick={handleOpenCapsule}
                    disabled={isCapsuleOpening}
                    className="w-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 py-3 text-sm font-black text-slate-950 tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.4)] transition active:scale-[0.98] uppercase disabled:opacity-60 relative overflow-hidden"
                  >
                    <div className="shine-sweep-button" />
                    Buka Sekarang
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center relative">
                <div
                  key={`confetti-${dropCounter}`}
                  className="absolute inset-0 overflow-hidden pointer-events-none z-0"
                >
                  {confettiPieces.map((c) => (
                    <span
                      key={c.id}
                      className="confetti-piece absolute top-0"
                      style={{
                        left: c.left,
                        width: `${c.size}px`,
                        height: `${c.size}px`,
                        backgroundColor: c.color,
                        borderRadius: c.radius,
                        animationDelay: c.delay,
                        animationDuration: c.duration,
                      }}
                    />
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center -mt-8 -mb-1 z-25 relative">
                  <BerlioMascot
                    expression="celebrate"
                    className="w-24 h-24 animate-bounce"
                    style={{ animationDuration: "2s" }}
                  />
                  <div className="bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider px-3 py-1 rounded-full uppercase shadow-md -mt-2">
                    KAMU HEBAT! 🎉
                  </div>
                </div>

                <div className="text-center mt-3 z-10">
                  <h2 className="pop-badge text-3xl font-black text-white tracking-wide">
                    SELAMAT!
                  </h2>
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">
                    KAMU MENDAPATKAN
                  </p>
                </div>

                <div className="w-full px-1 my-6 z-10">
                  <div className="ticket-edge-cut w-full bg-gradient-to-br from-[#3b0764] via-[#5b21b6] to-[#4338ca] border-2 border-purple-500/30 p-6 py-9 relative shadow-[0_15px_30px_rgba(91,33,182,0.45)] flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-3.5 w-[1px] border-l border-dashed border-purple-300/25" />
                    <div className="absolute top-0 bottom-0 right-3.5 w-[1px] border-r border-dashed border-purple-300/25" />
                    <div className="shine-sweep absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-[shineSweep_2.2s_ease-in-out_infinite]" />
                    <span className="text-purple-200/90 font-extrabold text-xs tracking-[0.25em] uppercase mb-1.5">
                      VOUCHER
                    </span>
                    <span className="text-3xl font-black text-white tracking-wide text-center whitespace-pre-line leading-tight uppercase">
                      {reward}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5 px-2 z-10">
                  <div className="check-pop w-10 h-10 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.6)] shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-sm font-semibold">
                    Hadiah berhasil ditambahkan ke akunmu!
                  </p>
                </div>

                <div className="w-full px-2 pb-1 z-10 flex flex-col gap-2.5 relative">
                  <button
                    onClick={() => {
                      playClickSfx();
                      setShowModal(false);
                      setIsCapsuleOpening(false);
                      setIsCapsuleOpened(false);
                      setDroppedCapsule(null);
                      setReward(null);
                      setFlyingCapsules([]);
                    }}
                    className="w-full rounded-2xl bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] py-3 text-sm font-black text-slate-950 tracking-widest shadow-[0_4px_15px_rgba(245,158,11,0.4)] active:scale-[0.96] uppercase relative overflow-hidden"
                  >
                    <div className="shine-sweep-button" />
                    {coinCount > 0 ? "Main Lagi" : "Selesai"}
                  </button>
                  {coinCount <= 0 && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setIsCapsuleOpening(false);
                        setIsCapsuleOpened(false);
                        setDroppedCapsule(null);
                        setReward(null);
                        setFlyingCapsules([]);
                        handleKembaliIsiKoin();
                      }}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-bold text-slate-300 tracking-wide uppercase hover:bg-slate-800 transition"
                    >
                      Isi Koin Lagi
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}