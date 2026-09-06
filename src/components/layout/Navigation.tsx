import React from 'react';
import { useStore } from '../../context/StoreContext';
import { PageTab } from '../../types';
import {
  Store,
  Boxes,
  PlusCircle,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, products, orders } = useStore();

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrdersCount = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;

  const navItems: {
    id: PageTab;
    titleMy: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      titleMy: 'အရောင်းကောင်တာ',
      icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'products',
      titleMy: 'ကုန်ပစ္စည်းများ',
      icon: <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-900',
    },
    {
      id: 'add-product',
      titleMy: 'ပစ္စည်းအသစ်ထည့်ရန်',
      icon: <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'transactions',
      titleMy: 'အရောင်းမှတ်တမ်း',
      icon: <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: todayOrdersCount > 0 ? todayOrdersCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'finance',
      titleMy: 'ဘဏ္ဍာရေးနှင့် စာရင်း',
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'security',
      titleMy: 'လုံခြုံရေးနှင့် သိမ်းဆည်းမှု',
      icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <nav className="hidden sm:block bg-stone-900 text-stone-300 border-b border-stone-800 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1.5 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 relative cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/90'
                  }`}
                >
                  {item.icon}
                  <span>{item.titleMy}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Phones) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative cursor-pointer ${
                isActive ? 'text-rose-600 font-black' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-2 text-[9px] font-bold px-1 py-0.1 rounded-full ${
                      item.badgeColor || 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 max-w-[62px] truncate text-center">
                {item.titleMy}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
