import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Original section images (with their baked-in transparent padding)
import section1 from "../assets/section/section1.png";
import section2 from "../assets/section/section2.png";
import section3 from "../assets/section/section3.png";
import section4 from "../assets/section/section4.png";
import section5 from "../assets/section/section5.png";
import section6 from "../assets/section/section6.png";
import section7 from "../assets/section/section7.png";
import section8 from "../assets/section/section8.png";

interface HomeProps {
  navigate: (path: string) => void;
}

/**
 * Every exported PNG has empty transparent space baked into its top/bottom
 * edges (that's why there was a big visual gap even with gap:0). Instead of
 * eyeballing a pixel value, `topPad`/`bottomPad` below are the ACTUAL padding
 * measured from each file, expressed as a % of the image's own width.
 *
 * Why % of width and not px? Because these images are responsive
 * (width: 100%, height: auto) — a vertical margin expressed in % is always
 * resolved against the element's containing block WIDTH in CSS, so this
 * stays correct at any screen size instead of only working at one fixed
 * container width.
 */
const SECTION_META: Record<
  string,
  { src: string; alt: string; topPad: number; bottomPad: number }
> = {
  section1: { src: section1, alt: "Welcome to Berlian 90 Dashboard", topPad: 4.448, bottomPad: 6.743 },
  section2: { src: section2, alt: "Total Akumulasi Sale", topPad: 4.624, bottomPad: 5.925 },
  section3: { src: section3, alt: "Data Member", topPad: 5.255, bottomPad: 6.404 },
  section4: { src: section4, alt: "Level Membership Saat Ini", topPad: 1.345, bottomPad: 2.691 },
  section5: { src: section5, alt: "Keuntungan Member", topPad: 3.293, bottomPad: 6.066 },
  section6: { src: section6, alt: "Perhitungan Poin Sale", topPad: 1.727, bottomPad: 3.140 },
  section7: { src: section7, alt: "Aktivitas Terakhir", topPad: 1.463, bottomPad: 5.203 },
  section8: { src: section8, alt: "Makin Tinggi Levelmu, Makin Banyak Keuntungan!", topPad: 5.799, bottomPad: 8.628 },
};

// Layout: which sections are full-width rows vs. side-by-side pairs.
// Reorder / regroup here any time — the padding-removal logic below just
// walks this structure by index, no manual gap tweaking needed.
const ROWS: (keyof typeof SECTION_META)[][] = [
  ["section1"],
  ["section2", "section3"],
  ["section4", "section5"],
  ["section6", "section7"],
  ["section8"],
];

// Extra breathing room between sections, ON TOP of removing the baked-in
// padding. Set to 0 for a literal zero gap. A couple of px is usually nicer
// visually since rounded corners look better with a hairline of separation.
const EXTRA_GAP_PX = 0;

export default function Home({ navigate }: HomeProps) {
  return (
    <div className="min-h-screen bg-[#f3f7ff] flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <Header currentPath="/" onNavigate={navigate} />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-3 md:px-4 pt-0 pb-0 flex flex-col">
        {ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`w-full grid items-start ${
              row.length === 2 ? "grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5" : "grid-cols-1"
            }`}
          >
            {row.map((key, colIndex) => {
              const meta = SECTION_META[key];
              const isFirstRow = rowIndex === 0;
              return (
                <img
                  key={key}
                  src={meta.src}
                  alt={meta.alt}
                  className="w-full h-auto object-contain block"
                  style={{
                    // Pull the image up to cancel its own top padding, so it
                    // sits flush against whatever is above it (previous row's
                    // bottom padding was already cancelled by ITS marginBottom).
                    marginTop: isFirstRow ? 0 : `calc(-${meta.topPad}% - ${EXTRA_GAP_PX}px)`,
                    // Trim its own bottom padding so the next row can sit flush.
                    marginBottom: `-${meta.bottomPad}%`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}