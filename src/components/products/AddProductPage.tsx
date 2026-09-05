import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory, SkinType } from '../../types';
import { generateSKU } from '../../utils/format';
import { CATEGORY_LABELS, SKIN_TYPE_LABELS } from '../../utils/translations';
import {
  Save,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export const AddProductPage: React.FC = () => {
  const {
    addProduct,
    updateProduct,
    selectedProductForEdit,
    setSelectedProductForEdit,
    setActiveTab,
  } = useStore();

  const isEditing = Boolean(selectedProductForEdit);

  const [nameMy, setNameMy] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('serum');
  const [skinType, setSkinType] = useState<SkinType[]>(['all']);
  const [volume, setVolume] = useState('၅၀ မီလီလီတာ');
  const [costPrice, setCostPrice] = useState<number | ''>(20000);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(30000);
  const [stock, setStock] = useState<number | ''>(20);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [descriptionMy, setDescriptionMy] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Populate form if editing
  useEffect(() => {
    if (selectedProductForEdit) {
      setNameMy(selectedProductForEdit.nameMy);
      setSku(selectedProductForEdit.sku);
      setBarcode(selectedProductForEdit.barcode);
      setCategory(selectedProductForEdit.category);
      setSkinType(selectedProductForEdit.skinType);
      setVolume(selectedProductForEdit.volume);
      setCostPrice(selectedProductForEdit.costPrice);
      setSellingPrice(selectedProductForEdit.sellingPrice);
      setStock(selectedProductForEdit.stock);
      setMinStockAlert(selectedProductForEdit.minStockAlert);
      setDescriptionMy(selectedProductForEdit.descriptionMy || '');
    } else {
      // Auto-generate SKU for new product
      setSku(generateSKU('EMS', 'SKN'));
      setBarcode(String(Math.floor(8800000000000 + Math.random() * 99999999999)));
    }
  }, [selectedProductForEdit]);

  const handleGenerateSKU = () => {
    setSku(generateSKU('EMS', category));
  };

  const handleGenerateBarcode = () => {
    setBarcode(String(Math.floor(8800000000000 + Math.random() * 99999999999)));
  };

  const toggleSkinType = (type: SkinType) => {
    if (type === 'all') {
      setSkinType(['all']);
      return;
    }
    const filtered = skinType.filter((t) => t !== 'all');
    if (filtered.includes(type)) {
      const next = filtered.filter((t) => t !== type);
      setSkinType(next.length === 0 ? ['all'] : next);
    } else {
      setSkinType([...filtered, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameMy.trim()) {
      alert('ကျေးဇူးပြု၍ ပစ္စည်းအမည် ထည့်သွင်းပါ');
      return;
    }

    const payload = {
      nameMy: nameMy.trim(),
      nameEn: nameMy.trim(),
      sku: sku.trim() || generateSKU('EMS', category),
      barcode: barcode.trim() || String(Date.now()),
      category,
      brand: 'EI MON SKINCARE',
      skinType: skinType.length > 0 ? skinType : ['all'],
      volume: volume.trim() || 'ပုံမှန်အရွယ်အစား',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      minStockAlert: Number(minStockAlert) || 5,
      imageUrl: '',
      descriptionMy: descriptionMy.trim(),
    };

    if (isEditing && selectedProductForEdit) {
      updateProduct({
        ...payload,
        id: selectedProductForEdit.id,
        createdAt: selectedProductForEdit.createdAt,
        updatedAt: new Date().toISOString(),
      });
      setToastMessage('ကုန်ပစ္စည်း အချက်အလက် ပြင်ဆင်ပြီးပါပြီ');
    } else {
      addProduct(payload);
      setToastMessage('ကုန်ပစ္စည်းအသစ် ထည့်သွင်းပြီးပါပြီ');
    }

    setTimeout(() => {
      setSelectedProductForEdit(null);
      setActiveTab('products');
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Navigation and Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedProductForEdit(null);
              setActiveTab('products');
            }}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              {isEditing
                ? 'ကုန်ပစ္စည်းအချက်အလက် ပြင်ဆင်ရန်'
                : 'ကုန်ပစ္စည်းအသစ် ထည့်သွင်းရန်'}
            </h1>
            <p className="text-xs text-stone-500">
              EI MON SKINCARE • ကုန်ပစ္စည်းစာရင်း
            </p>
          </div>
        </div>

        {toastMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-fadeIn">
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5 sm:p-7 space-y-6">
        {/* Section 1: Names & Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>၁။ အခြေခံအချက်အလက်</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ပစ္စည်းအမည် <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ဥပမာ - နှလုံးရွက် ချွေးပေါက်ကျဉ်း တိုနာ"
                value={nameMy}
                onChange={(e) => setNameMy(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                အမျိုးအစား
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
              >
                {Object.entries(CATEGORY_LABELS)
                  .filter(([k]) => k !== 'all')
                  .map(([cat, label]) => (
                    <option key={cat} value={cat}>
                      {label.my}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ပမာဏ / အရွယ်အစား
              </label>
              <input
                type="text"
                placeholder="ဥပမာ - ၅၀ မီလီလီတာ၊ ၁၅၀ ဂရမ်၊ ၁ ကတ်"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Skin type suitability */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <label className="block text-xs font-bold text-stone-700">
            သင့်လျော်သောအသားအရေ
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'oily', 'dry', 'sensitive', 'combination', 'acne'] as SkinType[]).map(
              (st) => {
                const isSelected = skinType.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleSkinType(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {SKIN_TYPE_LABELS[st]?.my}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Section 3: Pricing and Inventory in MMK */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h2 className="text-xs font-black text-rose-600 uppercase tracking-wider">
            ၂။ စျေးနှုန်းနှင့် လက်ကျန်စာရင်း
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ဝယ်ရင်းစျေး (ကျပ်)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={costPrice}
                  onChange={(e) =>
                    setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 pr-12 font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-bold">
                  MMK
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ရောင်းချမည့်စျေး (ကျပ်) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30 pr-12 font-bold text-rose-700"
                />
                <span className="absolute right-3 top-2.5 text-xs text-rose-400 font-bold">
                  MMK
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                လက်ကျန်အရေအတွက် <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="0"
                value={stock}
                onChange={(e) =>
                  setStock(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                အနည်းဆုံးလက်ကျန် သတိပေးချက်
              </label>
              <input
                type="number"
                placeholder="5"
                value={minStockAlert}
                onChange={(e) =>
                  setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Codes & Identifiers */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h2 className="text-xs font-black text-rose-600 uppercase tracking-wider">
            ၃။ ဘားကုဒ် (Barcode)
          </h2>

          <div className="max-w-md">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">
                  ဘားကုဒ်
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>အလိုအလျောက် ထုတ်မည်</span>
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ဘားကုဒ် ရိုက်ထည့်ပါ သို့မဟုတ် စကင်ဖတ်ပါ"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Notes */}
        <div className="pt-2 border-t border-stone-100">
          <label className="block text-xs font-bold text-stone-700 mb-1">
            ပစ္စည်းဖော်ပြချက်နှင့် သုံးစွဲပုံမှတ်စု
          </label>
          <textarea
            rows={2}
            value={descriptionMy}
            onChange={(e) => setDescriptionMy(e.target.value)}
            placeholder="အသားအရေအတွက် အကျိုးကျေးဇူးများနှင့် အသုံးပြုပုံ..."
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedProductForEdit(null);
              setActiveTab('products');
            }}
            className="py-2.5 px-5 rounded-xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-bold hover:bg-stone-50 transition-colors cursor-pointer"
          >
            မလုပ်တော့ပါ
          </button>

          <button
            type="submit"
            className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {isEditing
                ? 'အချက်အလက် သိမ်းဆည်းမည်'
                : 'ကုန်ပစ္စည်းအသစ် ထည့်သွင်းမည်'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
