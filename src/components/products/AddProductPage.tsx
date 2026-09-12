import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory, SkinType } from '../../types';
import { generateSKU } from '../../utils/format';
import { CATEGORY_LABELS, SKIN_TYPE_LABELS } from '../../utils/translations';
import { CameraScannerModal } from '../pos/CameraScannerModal';
import {
  Save,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Camera,
  X,
  Barcode,
} from 'lucide-react';

export const AddProductPage: React.FC = () => {
  const {
    addProduct,
    updateProduct,
    selectedProductForEdit,
    setSelectedProductForEdit,
    setActiveTab,
    goBack,
  } = useStore();

  const isEditing = Boolean(selectedProductForEdit);

  const [nameMy, setNameMy] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('serum');
  const [skinType, setSkinType] = useState<SkinType[]>(['all']);
  const [volume, setVolume] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [descriptionMy, setDescriptionMy] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Populate form if editing, or initialize clean empty form without auto-filling barcode
  useEffect(() => {
    if (selectedProductForEdit) {
      setNameMy(selectedProductForEdit.nameMy);
      setSku(selectedProductForEdit.sku);
      setBarcode(selectedProductForEdit.barcode || '');
      setCategory(selectedProductForEdit.category);
      setSkinType(selectedProductForEdit.skinType);
      setVolume(selectedProductForEdit.volume || '');
      setCostPrice(selectedProductForEdit.costPrice || '');
      setSellingPrice(selectedProductForEdit.sellingPrice || '');
      setStock(selectedProductForEdit.stock ?? '');
      setMinStockAlert(selectedProductForEdit.minStockAlert ?? 5);
      setDescriptionMy(selectedProductForEdit.descriptionMy || '');
    } else {
      // Clean blank state for new product - strictly do NOT auto-fill random barcodes!
      setNameMy('');
      setSku(generateSKU('EMS', 'SKN'));
      setBarcode(''); // Kept clean so user can scan the actual barcode on the product
      setCategory('serum');
      setSkinType(['all']);
      setVolume('');
      setCostPrice('');
      setSellingPrice('');
      setStock('');
      setMinStockAlert(5);
      setDescriptionMy('');
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

    const finalSku = sku.trim() || generateSKU('EMS', category);
    const finalBarcode = barcode.trim() || finalSku;

    const payload = {
      nameMy: nameMy.trim(),
      nameEn: nameMy.trim(),
      sku: finalSku,
      barcode: finalBarcode,
      category,
      brand: 'EI MON SKINCARE',
      skinType: skinType.length > 0 ? skinType : ['all'],
      volume: selectedProductForEdit?.volume || '',
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
            type="button"
            onClick={() => {
              setSelectedProductForEdit(null);
              goBack();
            }}
            className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 text-stone-700 hover:text-rose-700 hover:bg-rose-50/50 shadow-2xs font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer min-h-[44px]"
            title="နောက်သို့ ပြန်သွားမည် (Go Back)"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span>နောက်သို့ (Back)</span>
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

          <div className="grid grid-cols-1 gap-4">
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
        <div className="space-y-3 pt-3 border-t border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4" />
                <span>၃။ ဘားကုဒ် (Barcode)</span>
              </h2>
              <p className="text-[11px] text-stone-500">
                ပစ္စည်းပေါ်ရှိ ဘားကုဒ်ကို ကင်မရာဖြင့် တိုက်ရိုက် စကင်ဖတ်ပါ သို့မဟုတ် လက်ဖြင့် ရိုက်ထည့်ပါ (အလိုအလျောက် ဖြည့်မထားပါ)
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateBarcode}
              className="text-[11px] text-stone-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto py-1"
              title="ပစ္စည်းတွင် ဘားကုဒ်မပါရှိပါက ဆိုင်တွင်းသုံး ဘားကုဒ် အလိုအလျောက် ထုတ်နိုင်သည်"
            >
              <RefreshCw className="w-3 h-3" />
              <span>အတွင်းသုံး ဘားကုဒ် ထုတ်မည်</span>
            </button>
          </div>

          <div className="space-y-2 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ပစ္စည်းပေါ်ရှိ ဘားကုဒ် ရိုက်ထည့်ပါ သို့မဟုတ် စကင်ဖတ်ပါ"
                  className="w-full text-xs sm:text-sm pl-3.5 pr-9 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 font-mono font-bold"
                />
                {barcode && (
                  <button
                    type="button"
                    onClick={() => setBarcode('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                    title="ဘားကုဒ် ရှင်းလင်းမည်"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Start Camera Barcode Scan Button */}
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>ကင်မရာဖြင့် စကင်ဖတ်မည်</span>
              </button>
            </div>

            {barcode ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  အသုံးပြုမည့် ဘားကုဒ်: <strong className="font-mono">{barcode}</strong>
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 italic">
                * ဘားကုဒ် မဖြည့်ထားပါက SKU အမှတ်အသားကို ဘားကုဒ်အဖြစ် အသုံးပြုပါမည်
              </p>
            )}
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
              goBack();
            }}
            className="py-2.5 px-5 rounded-2xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-bold hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500" />
            <span>မလုပ်တော့ပါ (နောက်သို့)</span>
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

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        title="ကုန်ပစ္စည်းပေါ်ရှိ ဘားကုဒ်ကို စကင်ဖတ်ပါ"
        elementId="add-product-camera-scanner-view"
        onScan={(code) => {
          setBarcode(code);
          setIsCameraScannerOpen(false);
          setToastMessage(`ဘားကုဒ် [${code}] စကင်ဖတ်ပြီးပါပြီ`);
          return {
            success: true,
            message: 'ဘားကုဒ် စကင်ဖတ်ပြီးပါပြီ',
            productName: code,
          };
        }}
      />
    </div>
  );
};
