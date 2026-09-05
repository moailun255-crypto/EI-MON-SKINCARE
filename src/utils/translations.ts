export type LanguageMode = 'my' | 'en' | 'dual';

export const CATEGORY_LABELS: Record<string, { my: string; en: string }> = {
  all: { my: 'အားလုံး', en: 'All Items' },
  cleanser: { my: 'မျက်နှာသစ်ဆေး', en: 'Cleansers' },
  toner: { my: 'တိုနာ', en: 'Toners' },
  serum: { my: 'ဆာရမ်နှင့် အက်စန့်စ်', en: 'Serums & Essences' },
  moisturizer: { my: 'အစိုဓာတ်ထိန်းခရင်မ်', en: 'Moisturizers' },
  sunscreen: { my: 'နေလောင်ကာခရင်မ်', en: 'Sunscreens' },
  mask: { my: 'မျက်နှာဖုံးကပ်ခွာ', en: 'Sheet Masks' },
  treatment: { my: 'အသားအရေကုထုံး', en: 'Treatments & Creams' },
  body: { my: 'ခန္ဓာကိုယ်ထိန်းသိမ်းမှု', en: 'Body Care' },
  set: { my: 'အထူးပက်ကေ့ချ်တွဲ', en: 'Skincare Sets' },
};

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
  logistics: { my: 'ပို့ဆောင်ခ (Delivery)', en: 'Logistics & Delivery' },
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
