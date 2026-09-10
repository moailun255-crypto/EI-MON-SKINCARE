import React from 'react';

interface ReceiptBarcodeProps {
  value: string;
  className?: string;
}

export const ReceiptBarcode: React.FC<ReceiptBarcodeProps> = ({ value, className = '' }) => {
  // Generate pseudo-code128 aesthetic bars from alphanumeric string
  const bars: { width: number; isBlack: boolean }[] = [];

  // Start guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push({ width: (code % 3) + 1, isBlack: true });
    bars.push({ width: ((code >> 1) % 2) + 1, isBlack: false });
    bars.push({ width: ((code >> 2) % 3) + 1, isBlack: true });
    bars.push({ width: 1, isBlack: false });
  }

  // Stop guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 3, isBlack: true });

  let totalWidth = 0;
  bars.forEach((b) => {
    totalWidth += b.width;
  });

  let currentX = 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} 36`}
        className="w-full max-w-[200px] h-8 overflow-visible"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={36}
              fill="#1c1917"
            />
          );
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-widest text-stone-600 font-bold mt-0.5 select-all">
        *{value}*
      </span>
    </div>
  );
};
