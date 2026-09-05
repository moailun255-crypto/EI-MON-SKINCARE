/**
 * Formatting utilities for EI MON SKINCARE
 * Myanmar Kyat (MMK) currency and date formatters
 */

export function formatMMK(amount: number, useMyanmarDigits: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-US').format(Math.round(amount));
  if (!useMyanmarDigits) {
    return `${formatted} MMK`;
  }
  
  const myanmarDigitsMap: Record<string, string> = {
    '0': '၀',
    '1': '၁',
    '2': '၂',
    '3': '၃',
    '4': '၄',
    '5': '၅',
    '6': '၆',
    '7': '၇',
    '8': '၈',
    '9': '၉',
    ',': ',',
  };

  const converted = formatted
    .split('')
    .map((char) => myanmarDigitsMap[char] || char)
    .join('');

  return `${converted} ကျပ်`;
}

export function formatMMKCompact(amount: number, useMyanmarDigits: boolean = false): string {
  if (amount >= 1000000) {
    const val = (amount / 1000000).toFixed(1).replace(/\.0$/, '');
    if (!useMyanmarDigits) return `${val}M MMK`;
    const myanmarDigitsMap: Record<string, string> = {
      '0': '၀', '1': '၁', '2': '၂', '3': '၃', '4': '၄',
      '5': '၅', '6': '၆', '7': '၇', '8': '၈', '9': '၉', '.': '.',
    };
    const converted = val.split('').map((c) => myanmarDigitsMap[c] || c).join('');
    return `${converted}သန်း ကျပ်`;
  }
  if (amount >= 1000) {
    const val = Math.round(amount / 1000);
    if (!useMyanmarDigits) return `${val}K MMK`;
    const myanmarDigitsMap: Record<string, string> = {
      '0': '၀', '1': '၁', '2': '၂', '3': '၃', '4': '၄',
      '5': '၅', '6': '၆', '7': '၇', '8': '၈', '9': '၉',
    };
    const converted = String(val).split('').map((c) => myanmarDigitsMap[c] || c).join('');
    return `${converted}ထောင် ကျပ်`;
  }
  return formatMMK(amount, useMyanmarDigits);
}

export function formatDateMy(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `EMS-${year}${month}${day}-${randomSuffix}`;
}

export function generateSKU(brand: string, category: string): string {
  const b = brand.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'EMS';
  const c = category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'SKN';
  const num = Math.floor(100 + Math.random() * 900);
  return `${b}-${c}-${num}`;
}
