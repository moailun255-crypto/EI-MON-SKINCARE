export type LanguageMode = 'my' | 'en' | 'dual';

export const CATEGORY_LABELS: Record<string, { my: string; en: string }> = {
  all: { my: 'အားလုံး', en: 'All Items' },
  // Skincare Essentials
  cleanser: { my: 'မျက်နှာသစ် / မိတ်ကပ်ဖျက်ဆေး', en: 'Cleansers & Removers' },
  toner: { my: 'တိုနာ / လိုးရှင်း', en: 'Toners & Lotions' },
  serum: { my: 'ဆာရမ်နှင့် အက်စန့်စ်', en: 'Serums & Essences' },
  moisturizer: { my: 'အစိုဓာတ်ထိန်းခရင်မ်', en: 'Moisturizers & Creams' },
  sunscreen: { my: 'နေလောင်ကာခရင်မ်', en: 'Sunscreens & UV Protection' },
  mask: { my: 'မျက်နှာဖုံးကပ်ခွာ / ဂျယ်လ်', en: 'Sheet Masks & Sleeping Packs' },
  treatment: { my: 'ဝက်ခြံနှင့် အသားအရေကုထုံး', en: 'Treatments & Spot Care' },
  eye_care: { my: 'မျက်ဝန်းထိန်းသိမ်းမှု / မျက်လုံးခရင်မ်', en: 'Eye Creams & Patches' },
  lip_care: { my: 'နှုတ်ခမ်းထိန်းသိမ်းမှု / နှုတ်ခမ်းဆီ', en: 'Lip Care & Balms' },
  exfoliator: { my: 'ဂျီးချွတ်နှင့် စကရပ်စ်', en: 'Exfoliators & Scrubs' },
  mist: { my: 'မျက်နှာဖြန်းစပရေး', en: 'Facial Mists & Sprays' },

  // Makeup & Cosmetics
  makeup: { my: 'မိတ်ကပ် / ဖောင်ဒေးရှင်း / ကူရှင်', en: 'Makeup & Foundation / Cushion' },
  lipstick: { my: 'နှုတ်ခမ်းနီ / တင့်', en: 'Lipsticks & Tints' },
  powder: { my: 'ပေါင်ဒါ / သနပ်ခါး', en: 'Powder & Compact Powder' },
  eye_makeup: { my: 'မျက်ခုံး / မျက်တောင်ကော့ဆေး', en: 'Eye Makeup & Mascara' },

  // Body & Hair
  body: { my: 'ခန္ဓာကိုယ်ထိန်းသိမ်းမှု / ဘော်ဒီလိုးရှင်း', en: 'Body Care & Lotions' },
  bath: { my: 'ဆပ်ပြာနှင့် ရေချိုးဂျယ်လ်', en: 'Body Wash & Soaps' },
  hair: { my: 'ဆံကေသာထိန်းသိမ်းမှု / ခေါင်းလျှော်ရည်', en: 'Hair Care & Shampoo' },
  hand_foot: { my: 'လက်သည်းနှင့် ခြေလက်ထိန်းသိမ်းမှု', en: 'Hand & Foot Care' },

  // Fragrance & Personal Care
  perfume: { my: 'ရေမွှေးနှင့် ဘော်ဒီမစ်စ်', en: 'Perfumes & Body Mists' },
  oral_care: { my: 'သွားနှင့် ခံတွင်းသန့်ရှင်းရေး', en: 'Oral Care & Toothpaste' },
  men: { my: 'အမျိုးသားသုံး အလှကုန်', en: 'Men Grooming & Care' },
  baby_mom: { my: 'မိခင်နှင့် ကလေးသုံး', en: 'Baby & Maternity Care' },

  // Tools & Wellness
  tools: { my: 'အလှပြင်ကိရိယာ / ဝါဂွမ်း / စပွန်ချ်', en: 'Beauty Tools & Accessories' },
  supplement: { my: 'အစားအသောက်ဖြည့်စွက် / ကော်လာဂျင်', en: 'Supplements & Collagen' },
  set: { my: 'အထူးပက်ကေ့ချ်တွဲ / လက်ဆောင်ဘူး', en: 'Skincare Sets & Gift Boxes' },
  other: { my: 'အထွေထွေ / အခြား', en: 'General & Others' },
};

/**
 * Grouped categories for organized dropdowns & navigation
 */
export const CATEGORY_GROUPS = [
  {
    groupMy: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု',
    groupEn: 'Skincare',
    keys: [
      'cleanser',
      'toner',
      'serum',
      'moisturizer',
      'sunscreen',
      'mask',
      'treatment',
      'eye_care',
      'lip_care',
      'exfoliator',
      'mist',
    ],
  },
  {
    groupMy: 'မိတ်ကပ်နှင့် အလှကုန်',
    groupEn: 'Makeup',
    keys: ['makeup', 'lipstick', 'powder', 'eye_makeup'],
  },
  {
    groupMy: 'ခန္ဓာကိုယ်နှင့် ဆံကေသာ',
    groupEn: 'Body & Hair',
    keys: ['body', 'bath', 'hair', 'hand_foot'],
  },
  {
    groupMy: 'ရေမွှေးနှင့် တစ်ကိုယ်ရေသုံး',
    groupEn: 'Fragrance & Personal',
    keys: ['perfume', 'oral_care', 'men', 'baby_mom'],
  },
  {
    groupMy: 'ကိရိယာနှင့် ဖြည့်စွက်စာ',
    groupEn: 'Tools & Wellness',
    keys: ['tools', 'supplement', 'set', 'other'],
  },
];

/**
 * Returns localized category name for standard or custom categories
 */
export function getCategoryDisplayName(category: string, lang: 'my' | 'en' = 'my'): string {
  if (CATEGORY_LABELS[category]) {
    return CATEGORY_LABELS[category][lang];
  }
  return category;
}

export const PAYMENT_LABELS: Record<string, { my: string; en: string; color: string }> = {
  cash: { my: 'ငွေသား', en: 'Cash', color: 'bg-emerald-600 text-white' },
  kpay: { my: 'KBZPay', en: 'KBZPay', color: 'bg-blue-600 text-white' },
};

export const EXPENSE_CATEGORY_LABELS: Record<string, { my: string; en: string }> = {
  rent: { my: 'ဆိုင်ခန်းငှားရမ်းခ', en: 'Shop Rent' },
  salary: { my: 'ဝန်ထမ်းလစာ', en: 'Staff Salary' },
  utilities: { my: 'လျှပ်စစ်မီတာ/ရေ/အင်တာနက်', en: 'Utilities & Internet' },
  packaging: { my: 'စက္ကူအိတ်နှင့် ထုပ်ပိုးပစ္စည်း', en: 'Bags & Packaging' },
  marketing: { my: 'ကြော်ငြာနှင့် ပရိုမိုးရှင်း', en: 'Marketing & Ads' },
  logistics: { my: 'ပို့ဆောင်ခ', en: 'Logistics & Delivery' },
  maintenance: { my: 'ဆိုင်ပြင်ဆင်ထိန်းသိမ်းစရိတ်', en: 'Maintenance' },
  other: { my: 'အထွေထွေစရိတ်', en: 'Other Expense' },
};

export const SKIN_TYPE_LABELS: Record<string, { my: string; en: string }> = {
  all: { my: 'အသားအရေအားလုံး', en: 'All Skin Types' },
  oily: { my: 'အဆီပြန်အသားအရေ', en: 'Oily Skin' },
  dry: { my: 'အသားခြောက်', en: 'Dry Skin' },
  sensitive: { my: 'အသားနု/ထိခိုက်လွယ်', en: 'Sensitive Skin' },
  combination: { my: 'ပေါင်းစပ်အသားအရေ', en: 'Combination Skin' },
  acne: { my: 'ဝက်ခြံလွယ်သောအသား', en: 'Acne-Prone' },
};
