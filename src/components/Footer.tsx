// import React from "react";
import { Phone, MapPin } from "lucide-react";
import logo from "../assets/section/logo.png";

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M16.6 5.82c-1.02-.9-1.63-2.16-1.63-3.52h-3.13v13.44c0 1.53-1.24 2.77-2.77 2.77a2.77 2.77 0 0 1-2.77-2.77 2.77 2.77 0 0 1 2.77-2.77c.28 0 .55.04.8.12v-3.18a6 6 0 0 0-.8-.05A5.9 5.9 0 0 0 3.17 15.7a5.9 5.9 0 0 0 5.9 5.9 5.9 5.9 0 0 0 5.9-5.9V9.01a8.16 8.16 0 0 0 4.76 1.53V7.4a4.85 4.85 0 0 1-3.13-1.58Z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const menuLinks = ["Beranda", "Daftar Hadiah", "Berlio Blast"];
const infoLinks = ["Tentang Kami", "Kebijakan Privasi", "Syarat & Ketentuan"];

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A1848] text-white">
      <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-8 md:py-10 grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
        {/* Brand */}
        <div className="col-span-2 md:col-span-2 flex flex-col gap-2">
          <img src={logo} alt="Berlian 90" className="h-9 md:h-10 w-auto object-contain" />
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Belanja Hemat,
            <br />
            Kualitas Hebat!
          </p>
        </div>

        {/* Menu */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold tracking-wide text-blue-200/90">MENU</h4>
          <ul className="flex flex-col gap-2 text-sm text-blue-100/90">
            {menuLinks.map((item) => (
              <li key={item} className="hover:text-white cursor-pointer transition-colors">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Informasi */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold tracking-wide text-blue-200/90">INFORMASI</h4>
          <ul className="flex flex-col gap-2 text-sm text-blue-100/90">
            {infoLinks.map((item) => (
              <li key={item} className="hover:text-white cursor-pointer transition-colors">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Hubungi Kami + Follow Us */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold tracking-wide text-blue-200/90">HUBUNGI KAMI</h4>
            <div className="flex items-start gap-2 text-sm text-blue-100/90">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" />
              <span>0813-8888-8890</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-blue-100/90">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Jalan Astanaanyar No. 90, Kota Bandung, Jawa Barat 40241</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold tracking-wide text-blue-200/90">FOLLOW US</h4>
            <div className="flex items-center gap-2 text-sm text-blue-100/90">
              <TikTokIcon className="w-4 h-4 shrink-0" />
              <span>Plastik OPP Berlian 90</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-100/90">
              <InstagramIcon className="w-4 h-4 shrink-0" />
              <span>Plastik OPP Berlian 90</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}