import { CategoryItem } from '../types';

export const DEFAULT_STORE_CATEGORIES: CategoryItem[] = [
  // မျက်နှာအသားအရေ ထိန်းသိမ်းမှု
  { id: 'cleanser', nameMy: 'မျက်နှာသစ် / မိတ်ကပ်ဖျက်ဆေး', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'toner', nameMy: 'တိုနာ / လိုးရှင်း', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'serum', nameMy: 'ဆာရမ်နှင့် အက်စန့်စ်', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'moisturizer', nameMy: 'အစိုဓာတ်ထိန်းခရင်မ်', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'sunscreen', nameMy: 'နေလောင်ကာခရင်မ်', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'mask', nameMy: 'မျက်နှာဖုံးကပ်ခွာ / ဂျယ်လ်', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'treatment', nameMy: 'ဝက်ခြံနှင့် အသားအရေကုထုံး', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'eye_care', nameMy: 'မျက်ဝန်းထိန်းသိမ်းမှု / မျက်လုံးခရင်မ်', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'lip_care', nameMy: 'နှုတ်ခမ်းထိန်းသိမ်းမှု / နှုတ်ခမ်းဆီ', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'exfoliator', nameMy: 'ဂျီးချွတ်နှင့် စကရပ်စ်', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },
  { id: 'mist', nameMy: 'မျက်နှာဖြန်းစပရေး', group: 'မျက်နှာအသားအရေ ထိန်းသိမ်းမှု', isDefault: true },

  // မိတ်ကပ်နှင့် အလှကုန်
  { id: 'makeup', nameMy: 'မိတ်ကပ် / ဖောင်ဒေးရှင်း / ကူရှင်', group: 'မိတ်ကပ်နှင့် အလှကုန်', isDefault: true },
  { id: 'lipstick', nameMy: 'နှုတ်ခမ်းနီ / တင့်', group: 'မိတ်ကပ်နှင့် အလှကုန်', isDefault: true },
  { id: 'powder', nameMy: 'ပေါင်ဒါ / သနပ်ခါး', group: 'မိတ်ကပ်နှင့် အလှကုန်', isDefault: true },
  { id: 'eye_makeup', nameMy: 'မျက်ခုံး / မျက်တောင်ကော့ဆေး', group: 'မိတ်ကပ်နှင့် အလှကုန်', isDefault: true },

  // ခန္ဓာကိုယ်နှင့် ဆံကေသာ
  { id: 'body', nameMy: 'ခန္ဓာကိုယ်ထိန်းသိမ်းမှု / ဘော်ဒီလိုးရှင်း', group: 'ခန္ဓာကိုယ်နှင့် ဆံကေသာ', isDefault: true },
  { id: 'bath', nameMy: 'ဆပ်ပြာနှင့် ရေချိုးဂျယ်လ်', group: 'ခန္ဓာကိုယ်နှင့် ဆံကေသာ', isDefault: true },
  { id: 'hair', nameMy: 'ဆံကေသာထိန်းသိမ်းမှု / ခေါင်းလျှော်ရည်', group: 'ခန္ဓာကိုယ်နှင့် ဆံကေသာ', isDefault: true },
  { id: 'hand_foot', nameMy: 'လက်သည်းနှင့် ခြေလက်ထိန်းသိမ်းမှု', group: 'ခန္ဓာကိုယ်နှင့် ဆံကေသာ', isDefault: true },

  // ရေမွှေးနှင့် တစ်ကိုယ်ရေသုံး
  { id: 'perfume', nameMy: 'ရေမွှေးနှင့် ဘော်ဒီမစ်စ်', group: 'ရေမွှေးနှင့် တစ်ကိုယ်ရေသုံး', isDefault: true },
  { id: 'oral_care', nameMy: 'သွားနှင့် ခံတွင်းသန့်ရှင်းရေး', group: 'ရေမွှေးနှင့် တစ်ကိုယ်ရေသုံး', isDefault: true },
  { id: 'men', nameMy: 'အမျိုးသားသုံး အလှကုန်', group: 'ရေမွှေးနှင့် တစ်ကိုယ်ရေသုံး', isDefault: true },
  { id: 'baby_mom', nameMy: 'မိခင်နှင့် ကလေးသုံး', group: 'ရေမွှေးနှင့် တစ်ကိုယ်ရေသုံး', isDefault: true },

  // ကိရိယာနှင့် ဖြည့်စွက်စာ
  { id: 'tools', nameMy: 'အလှပြင်ကိရိယာ / ဝါဂွမ်း / စပွန်ချ်', group: 'ကိရိယာနှင့် ဖြည့်စွက်စာ', isDefault: true },
  { id: 'supplement', nameMy: 'အစားအသောက်ဖြည့်စွက် / ကော်လာဂျင်', group: 'ကိရိယာနှင့် ဖြည့်စွက်စာ', isDefault: true },
  { id: 'set', nameMy: 'အထူးပက်ကေ့ချ်တွဲ / လက်ဆောင်ဘူး', group: 'ကိရိယာနှင့် ဖြည့်စွက်စာ', isDefault: true },
  { id: 'other', nameMy: 'အထွေထွေ / အခြား', group: 'အခြား', isDefault: true },
];
