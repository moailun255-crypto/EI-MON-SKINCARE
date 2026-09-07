import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const svgSizes = {
    sm: 16,
    md: 22,
    lg: 26,
    xl: 36,
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Luxury Skincare Emblem with Rose & Gold Glow */}
      <div
        className={`relative ${iconSizeClasses[size]} shrink-0 bg-gradient-to-tr from-rose-950 via-rose-700 to-amber-500 flex items-center justify-center shadow-md shadow-rose-950/20 ring-1 ring-white/25 overflow-hidden transition-transform group-hover:scale-105`}
      >
        {/* Subtle Luxury Diamond / Glow background layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300/30 via-transparent to-transparent pointer-events-none" />

        {/* Elegant Skincare Monogram Vector (Rose Lotus + 'EM' Silk Crown) */}
        <svg
          width={svgSizes[size]}
          height={svgSizes[size]}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 text-white drop-shadow-xs"
        >
          {/* Outer Organic Petals / Skincare Droplet Silhouette */}
          <path
            d="M16 3C16 3 9 10 9 17C9 21.4183 12.134 25 16 25C19.866 25 23 21.4183 23 17C23 10 16 3 16 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
          />
          {/* Inner Lotus Petal Curves */}
          <path
            d="M16 11C13.5 15 12 18 12 21C12 23.2 13.8 25 16 25C18.2 25 20 23.2 20 21C20 18 18.5 15 16 11Z"
            fill="url(#lotus-grad)"
            fillOpacity="0.4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* Monogram E & M stylized lines */}
          <path
            d="M11 15L16 20L21 15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Skincare Radiance Starlet / Sparkle */}
          <circle cx="16" cy="9" r="1.4" fill="#FDE047" />
          <defs>
            <linearGradient id="lotus-grad" x1="16" y1="11" x2="16" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#FB7185" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Name Typography */}
      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-stone-900 tracking-tight text-base sm:text-lg leading-tight uppercase font-sans">
              EI MON SKINCARE
            </span>
            <span className="hidden md:inline-flex items-center text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              အရောင်းစနစ်
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium truncate max-w-[180px] sm:max-w-xs">
            အလှကုန်နှင့် အသားအရေထိန်းပစ္စည်း POS
          </p>
        </div>
      )}
    </div>
  );
};
