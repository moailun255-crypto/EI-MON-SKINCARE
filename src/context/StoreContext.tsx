import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Order,
  OrderItem,
  Expense,
  StoreProfile,
  PageTab,
  PaymentMethod,
} from '../types';
import {
  INITIAL_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_STORE_PROFILE,
} from '../data/initialData';
import { generateReceiptNumber } from '../utils/format';
import { LanguageMode } from '../utils/translations';
import {
  getSupabase,
  getStoredSupabaseConfig,
  saveSupabaseConfig as saveSupabaseConfigStorage,
  clearSupabaseConfig as clearSupabaseConfigStorage,
  testSupabaseConnection,
  fetchCloudData,
  mapRowToProduct,
  pushProductsToCloud,
  pushSingleProductToCloud,
  deleteProductFromCloud,
  deleteMultipleProductsFromCloud,
  clearAllProductsFromCloud,
  pushOrderToCloud,
  deleteOrderFromCloud,
  clearAllOrdersFromCloud,
  pushExpenseToCloud,
  deleteExpenseFromCloud,
  pushProfileToCloud,
  SupabaseConfig,
} from '../lib/supabase';

interface StoreContextType {
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  storeProfile: StoreProfile;
  cart: CartItem[];
  activeTab: PageTab;
  languageMode: LanguageMode;
  useMyanmarDigits: boolean;
  selectedProductForEdit: Product | null;
  activeReceiptOrder: Order | null;
  isPinLocked: boolean;
  pinAuthError: string | null;

  // Supabase Cloud Sync
  isCloudConnected: boolean;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  cloudError: string | null;
  needsTableSetup: boolean;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: SupabaseConfig) => Promise<{ success: boolean; message: string }>;
  disconnectSupabase: () => void;
  syncNowWithCloud: () => Promise<void>;

  // Navigation
  setActiveTab: (tab: PageTab) => void;
  goBack: () => void;
  canGoBack: boolean;
  setLanguageMode: (mode: LanguageMode) => void;
  setUseMyanmarDigits: (val: boolean) => void;
  setSelectedProductForEdit: (product: Product | null) => void;
  setActiveReceiptOrder: (order: Order | null) => void;

  // Cart operations
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discountPercent: number, discountAmount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTotal: number;
  cartItemCount: number;

  // Checkout
  checkout: (paymentData: {
    paymentMethod: PaymentMethod;
    amountReceived: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    orderDiscount?: number;
  }) => Order | null;

  // Product management
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  deleteMultipleProducts: (productIds: string[]) => void;
  clearAllProducts: (password: string) => { success: boolean; message: string };
  adjustStock: (productId: string, delta: number) => void;

  // Expense management
  addExpense: (expenseData: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Order management
  refundOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => boolean;
  clearAllOrders: (password: string) => { success: boolean; message: string };
  verifyDeletePassword: (password: string) => boolean;
  updateDeletePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  resetDeletePassword: () => { success: boolean; message: string };
  setDirectDeletePassword: (newPassword: string) => { success: boolean; message: string };

  // Settings & Security
  updateStoreProfile: (profile: StoreProfile) => void;
  verifyPin: (pin: string) => boolean;
  lockSystem: () => void;
  unlockSystem: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'ei_mon_products_v1',
  ORDERS: 'ei_mon_orders_v2', // bumped to v2 so old demo transactions are permanently discarded
  EXPENSES: 'ei_mon_expenses_v1',
  PROFILE: 'ei_mon_profile_v1',
  LANG: 'ei_mon_lang_mode',
  DIGITS: 'ei_mon_myanmar_digits',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State with persistent local storage
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Orders initialized empty to clear all demo dummy transactions cleanly
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      localStorage.removeItem('ei_mon_orders_v1'); // wipe demo legacy orders
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((o) => ({
            ...o,
            paymentMethod: (o.paymentMethod === 'cash' ? 'cash' : 'kpay') as PaymentMethod,
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.name = 'EI MON SKINCARE';
        if (parsed.nameMy === 'အိမွန် အသားအရေထိန်းသိမ်းမှု' || !parsed.nameMy) {
          parsed.nameMy = 'EI MON SKINCARE';
        }
        if (parsed.activeCashier === 'မအိမွန် (Ei Mon)') {
          parsed.activeCashier = 'မအိမွန်';
        }
        if (!parsed.orderDeletePassword) {
          parsed.orderDeletePassword = '123456';
        }
        return parsed;
      }
      return INITIAL_STORE_PROFILE;
    } catch {
      return INITIAL_STORE_PROFILE;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTabState] = useState<PageTab>('pos');
  const [tabHistory, setTabHistory] = useState<PageTab[]>(['pos']);

  const setActiveTab = (tab: PageTab) => {
    setActiveTabState(tab);
    setTabHistory((prev) => {
      if (prev[prev.length - 1] === tab) return prev;
      return [...prev, tab];
    });
  };

  const goBack = () => {
    if (selectedProductForEdit) {
      setSelectedProductForEdit(null);
    }
    setTabHistory((prev) => {
      if (prev.length <= 1) {
        setActiveTabState('pos');
        return ['pos'];
      }
      const nextHistory = prev.slice(0, -1);
      const prevTab = nextHistory[nextHistory.length - 1] || 'pos';
      setActiveTabState(prevTab);
      return nextHistory;
    });
  };

  const canGoBack = activeTab !== 'pos' || tabHistory.length > 1;
  const [languageMode, setLanguageMode] = useState<LanguageMode>('my');
  const [useMyanmarDigits, setUseMyanmarDigits] = useState<boolean>(false);

  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [pinAuthError, setPinAuthError] = useState<string | null>(null);

  // Supabase Cloud State
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [needsTableSetup, setNeedsTableSetup] = useState<boolean>(false);

  // Initial cloud sync and realtime multi-device sync
  useEffect(() => {
    let isMounted = true;
    const client = getSupabase();
    if (!client || !supabaseConfig.url || !supabaseConfig.anonKey) {
      setIsCloudConnected(false);
      setCloudSyncStatus('idle');
      return;
    }

    const initCloud = async () => {
      setCloudSyncStatus('syncing');
      setCloudError(null);
      try {
        const testRes = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anonKey);
        if (!testRes.success) {
          if (isMounted) {
            setIsCloudConnected(false);
            setCloudSyncStatus('error');
            setCloudError(testRes.message);
            setNeedsTableSetup(Boolean(testRes.needsTableSetup));
          }
          return;
        }

        if (isMounted) {
          setIsCloudConnected(true);
          setNeedsTableSetup(false);
        }

        const cloudData = await fetchCloudData();
        if (isMounted) {
          if (cloudData.products !== null) {
            setProducts(cloudData.products);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudData.products));
          }

          if (cloudData.orders !== null) {
            setOrders(cloudData.orders);
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(cloudData.orders));
          }

          if (cloudData.expenses !== null) {
            setExpenses(cloudData.expenses);
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(cloudData.expenses));
          }

          if (cloudData.storeProfile !== null) {
            setStoreProfile(cloudData.storeProfile);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cloudData.storeProfile));
          }

          setCloudSyncStatus('synced');
        }
      } catch (err: any) {
        if (isMounted) {
          setCloudSyncStatus('error');
          setCloudError(err.message || 'Sync error');
        }
      }
    };

    initCloud();

    // Supabase Realtime multi-device sync
    const channel = client
      .channel('pos_multidevice_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          const fresh = await fetchCloudData();
          if (fresh.orders !== null && isMounted) {
            setOrders(fresh.orders);
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(fresh.orders));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async (payload) => {
          // 1. Instant optimistic update on all listening devices
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setProducts((prev) => prev.filter((p) => p.id !== deletedId));
              setCart((prev) => prev.filter((item) => item.product.id !== deletedId));
            }
          } else if (payload.eventType === 'INSERT' && payload.new && (payload.new as any).id) {
            const newProd = mapRowToProduct(payload.new);
            setProducts((prev) => {
              const exists = prev.some((p) => p.id === newProd.id);
              return exists ? prev.map((p) => (p.id === newProd.id ? newProd : p)) : [newProd, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new && (payload.new as any).id) {
            const updatedProd = mapRowToProduct(payload.new);
            setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
          }

          // 2. Full fetch to guarantee multi-item and complete sync consistency across all devices
          const fresh = await fetchCloudData();
          if (fresh.products !== null && isMounted) {
            setProducts(fresh.products);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(fresh.products));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        async () => {
          const fresh = await fetchCloudData();
          if (fresh.expenses !== null && isMounted) {
            setExpenses(fresh.expenses);
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(fresh.expenses));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_profile' },
        async () => {
          const fresh = await fetchCloudData();
          if (fresh.storeProfile !== null && isMounted) {
            setStoreProfile(fresh.storeProfile);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(fresh.storeProfile));
          }
        }
      )
      .subscribe();

    // Multi-device sync on app tab/window focus
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        fetchCloudData().then((fresh) => {
          if (!isMounted) return;
          if (fresh.products !== null) {
            setProducts(fresh.products);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(fresh.products));
          }
          if (fresh.orders !== null) {
            setOrders(fresh.orders);
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(fresh.orders));
          }
          if (fresh.expenses !== null) {
            setExpenses(fresh.expenses);
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(fresh.expenses));
          }
          if (fresh.storeProfile !== null) {
            setStoreProfile(fresh.storeProfile);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(fresh.storeProfile));
          }
        });
      }
    };
    window.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);

    // Periodic sync interval (every 10 seconds)
    const intervalSync = setInterval(() => {
      fetchCloudData().then((fresh) => {
        if (!isMounted) return;
        if (fresh.products !== null) {
          setProducts(fresh.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(fresh.products));
        }
        if (fresh.orders !== null) {
          setOrders(fresh.orders);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(fresh.orders));
        }
        if (fresh.expenses !== null) {
          setExpenses(fresh.expenses);
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(fresh.expenses));
        }
        if (fresh.storeProfile !== null) {
          setStoreProfile(fresh.storeProfile);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(fresh.storeProfile));
        }
      });
    }, 10000);

    return () => {
      isMounted = false;
      client.removeChannel(channel);
      window.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
      clearInterval(intervalSync);
    };
  }, [supabaseConfig]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(storeProfile));
  }, [storeProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, languageMode);
  }, [languageMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIGITS, String(useMyanmarDigits));
  }, [useMyanmarDigits]);

  // Supabase configuration actions
  const updateSupabaseConfig = async (config: SupabaseConfig): Promise<{ success: boolean; message: string }> => {
    setCloudSyncStatus('syncing');
    setCloudError(null);
    const test = await testSupabaseConnection(config.url, config.anonKey);
    if (!test.success) {
      setCloudSyncStatus('error');
      setCloudError(test.message);
      setNeedsTableSetup(Boolean(test.needsTableSetup));
      return test;
    }

    saveSupabaseConfigStorage(config);
    setSupabaseConfigState(config);
    setIsCloudConnected(true);
    setNeedsTableSetup(false);

    // Initial push existing local data to cloud so other devices immediately have it
    await Promise.all([
      pushProductsToCloud(products),
      pushProfileToCloud(storeProfile),
      ...orders.map((o) => pushOrderToCloud(o)),
      ...expenses.map((e) => pushExpenseToCloud(e)),
    ]);

    setCloudSyncStatus('synced');
    return { success: true, message: 'Supabase Cloud Database သို့ အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!' };
  };

  const disconnectSupabase = () => {
    clearSupabaseConfigStorage();
    setSupabaseConfigState({ url: '', anonKey: '' });
    setIsCloudConnected(false);
    setCloudSyncStatus('idle');
    setCloudError(null);
    setNeedsTableSetup(false);
  };

  const syncNowWithCloud = async () => {
    const client = getSupabase();
    if (!client || !supabaseConfig.url || !supabaseConfig.anonKey) return;
    setCloudSyncStatus('syncing');
    setCloudError(null);
    try {
      const testRes = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anonKey);
      if (!testRes.success) {
        setIsCloudConnected(false);
        setCloudSyncStatus('error');
        setCloudError(testRes.message);
        setNeedsTableSetup(Boolean(testRes.needsTableSetup));
        return;
      }

      setIsCloudConnected(true);
      setNeedsTableSetup(false);

      const data = await fetchCloudData();
      if (data.products !== null) {
        setProducts(data.products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      }

      if (data.orders !== null) {
        setOrders(data.orders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      }

      if (data.expenses !== null) {
        setExpenses(data.expenses);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
      }

      if (data.storeProfile !== null) {
        setStoreProfile(data.storeProfile);
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.storeProfile));
      }

      setCloudSyncStatus('synced');
    } catch (err: any) {
      setCloudSyncStatus('error');
      setCloudError(err.message || 'Sync error');
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                lineTotal: item.finalPrice * newQty,
              }
            : item
        );
      } else {
        const finalPrice = product.sellingPrice;
        return [
          ...prev,
          {
            product,
            quantity: Math.min(quantity, product.stock),
            discountPercent: 0,
            discountAmount: 0,
            finalPrice,
            lineTotal: finalPrice * Math.min(quantity, product.stock),
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return {
            ...item,
            quantity: validQty,
            lineTotal: item.finalPrice * validQty,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemDiscount = (
    productId: string,
    discountPercent: number,
    discountAmount: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const original = item.product.sellingPrice;
          let calculatedPrice = original;
          if (discountPercent > 0) {
            calculatedPrice = original * (1 - discountPercent / 100);
          } else if (discountAmount > 0) {
            calculatedPrice = Math.max(0, original - discountAmount);
          }
          return {
            ...item,
            discountPercent,
            discountAmount,
            finalPrice: calculatedPrice,
            lineTotal: calculatedPrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart totals
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const cartItemTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartDiscountTotal = Math.max(0, cartSubtotal - cartItemTotal);
  const cartTotal = cartItemTotal;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Checkout process
  const checkout = ({
    paymentMethod,
    amountReceived,
    customerName,
    customerPhone,
    notes,
    orderDiscount = 0,
  }: {
    paymentMethod: PaymentMethod;
    amountReceived: number;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    orderDiscount?: number;
  }): Order | null => {
    if (cart.length === 0) return null;

    const finalGrandTotal = Math.max(0, cartTotal - orderDiscount);
    const taxRate = storeProfile.taxRate || 0;
    const taxAmount = (finalGrandTotal * taxRate) / 100;
    const grandTotalWithTax = Math.round(finalGrandTotal + taxAmount);

    let costTotal = 0;
    const orderItems: OrderItem[] = cart.map((item) => {
      const lineCost = item.product.costPrice * item.quantity;
      costTotal += lineCost;
      return {
        productId: item.product.id,
        productNameMy: item.product.nameMy,
        productNameEn: item.product.nameEn,
        sku: item.product.sku,
        unitCost: item.product.costPrice,
        unitPrice: item.product.sellingPrice,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        finalPrice: item.finalPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      };
    });

    const changeGiven = Math.max(0, amountReceived - grandTotalWithTax);
    const profit = grandTotalWithTax - costTotal - taxAmount;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      receiptNumber: generateReceiptNumber(),
      items: orderItems,
      itemCount: cartItemCount,
      subtotal: cartSubtotal,
      discountTotal: cartDiscountTotal + orderDiscount,
      taxPercent: taxRate,
      taxAmount,
      grandTotal: grandTotalWithTax,
      costTotal,
      profit,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? amountReceived : grandTotalWithTax,
      changeGiven: paymentMethod === 'cash' ? changeGiven : 0,
      cashierName: storeProfile.activeCashier,
      customerName,
      customerPhone,
      notes,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    // Deduct stock from products
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((ci) => ci.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // Save order
    setOrders((prev) => [newOrder, ...prev]);

    // Push to Supabase Cloud if connected
    pushOrderToCloud(newOrder);
    pushProductsToCloud(updatedProducts);

    // Clear cart and show active receipt
    clearCart();
    setActiveReceiptOrder(newOrder);

    return newOrder;
  };

  // Product management
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    localStorage.removeItem('ei_mon_products_explicitly_cleared');
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    pushSingleProductToCloud(newProduct);
  };

  const updateProduct = (updated: Product) => {
    localStorage.removeItem('ei_mon_products_explicitly_cleared');
    setProducts((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? {
              ...updated,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    pushSingleProductToCloud(updated);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      if (updated.length === 0) {
        localStorage.setItem('ei_mon_products_explicitly_cleared', 'true');
      }
      return updated;
    });
    removeFromCart(productId);
    deleteProductFromCloud(productId);
  };

  const deleteMultipleProducts = (productIds: string[]) => {
    if (productIds.length === 0) return;
    const idSet = new Set(productIds);
    setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
    productIds.forEach((id) => removeFromCart(id));
    deleteMultipleProductsFromCloud(productIds);
  };

  const clearAllProducts = (inputPassword: string): { success: boolean; message: string } => {
    if (!verifyDeletePassword(inputPassword)) {
      return {
        success: false,
        message: 'လုံခြုံရေး လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (Password incorrect)',
      };
    }
    setProducts([]);
    clearCart();
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, '[]');
    clearAllProductsFromCloud();
    return {
      success: true,
      message: 'ကုန်ပစ္စည်းစာရင်း အားလုံးကို အောင်မြင်စွာ ဖျက်ပစ်ပြီးပါပြီ (All products cleared successfully)',
    };
  };

  const adjustStock = (productId: string, delta: number) => {
    let updatedProd: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedProd = {
            ...p,
            stock: Math.max(0, p.stock + delta),
            updatedAt: new Date().toISOString(),
          };
          return updatedProd;
        }
        return p;
      })
    );
    if (updatedProd) {
      pushSingleProductToCloud(updatedProd);
    }
  };

  // Expense management
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    pushExpenseToCloud(newExp);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteExpenseFromCloud(id);
  };

  // Refund order
  const refundOrder = (orderId: string) => {
    const orderToRefund = orders.find((o) => o.id === orderId);
    if (!orderToRefund || orderToRefund.status === 'refunded') return;

    // Restore stock
    const restoredProducts = products.map((prod) => {
      const item = orderToRefund.items.find((i) => i.productId === prod.id);
      if (item) {
        return {
          ...prod,
          stock: prod.stock + item.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      return prod;
    });
    setProducts(restoredProducts);
    pushProductsToCloud(restoredProducts);

    // Update order status
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'refunded' as const,
          }
        : o
    );
    setOrders(updatedOrders);
    const updatedOrder = updatedOrders.find((o) => o.id === orderId);
    if (updatedOrder) {
      pushOrderToCloud(updatedOrder);
    }
  };

  // Delete erroneous order: automatically restores stock and reduces financial records
  const deleteOrder = (orderId: string): boolean => {
    const orderToDelete = orders.find((o) => o.id === orderId);
    if (!orderToDelete) return false;

    // Restore stock if the order was completed (not yet refunded)
    let updatedProducts = products;
    if (orderToDelete.status !== 'refunded') {
      updatedProducts = products.map((prod) => {
        const item = orderToDelete.items.find((i) => i.productId === prod.id);
        if (item) {
          return {
            ...prod,
            stock: prod.stock + item.quantity,
            updatedAt: new Date().toISOString(),
          };
        }
        return prod;
      });
      setProducts(updatedProducts);
      pushProductsToCloud(updatedProducts);
    }

    // Remove order completely so all financial calculations decrease
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    deleteOrderFromCloud(orderId);

    // Clear active receipt modal if it was this order
    if (activeReceiptOrder?.id === orderId) {
      setActiveReceiptOrder(null);
    }

    return true;
  };

  // Wipe all transaction flow / orders permanently
  const clearAllOrders = (inputPassword: string): { success: boolean; message: string } => {
    if (!verifyDeletePassword(inputPassword)) {
      return { success: false, message: 'လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည် (Incorrect Password)' };
    }
    setOrders([]);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    clearAllOrdersFromCloud();
    return { success: true, message: 'အရောင်းမှတ်တမ်းများ အားလုံးကို အောင်မြင်စွာ ရှင်းလင်းပြီးပါပြီ (All orders cleared)' };
  };

  const verifyDeletePassword = (inputPassword: string): boolean => {
    const currentPass = storeProfile.orderDeletePassword || '123456';
    return inputPassword.trim() === currentPass.trim();
  };

  const updateDeletePassword = (
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    const currentPass = storeProfile.orderDeletePassword || '123456';
    if (oldPassword.trim() !== currentPass.trim()) {
      return { success: false, message: 'ယခင် လျှို့ဝှက်စကားဝှက် မှားယွင်းနေပါသည်' };
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'စကားဝှက်အသစ်သည် အနည်းဆုံး ၄ လုံး ရှိရပါမည်' };
    }
    const updated = {
      ...storeProfile,
      orderDeletePassword: newPassword.trim(),
    };
    setStoreProfile(updated);
    pushProfileToCloud(updated);
    return { success: true, message: 'လျှို့ဝှက်စကားဝှက် အသစ် အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ' };
  };

  const resetDeletePassword = (): { success: boolean; message: string } => {
    const updated = {
      ...storeProfile,
      orderDeletePassword: '123456',
    };
    setStoreProfile(updated);
    pushProfileToCloud(updated);
    return {
      success: true,
      message: 'စကားဝှက်ကို မူလသတ်မှတ်ချက် (123456) သို့ အောင်မြင်စွာ ပြန်ထားပြီးပါပြီ',
    };
  };

  const setDirectDeletePassword = (
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'စကားဝှက်အသစ်သည် အနည်းဆုံး ၄ လုံး ရှိရပါမည်' };
    }
    const updated = {
      ...storeProfile,
      orderDeletePassword: newPassword.trim(),
    };
    setStoreProfile(updated);
    pushProfileToCloud(updated);
    return {
      success: true,
      message: 'လျှို့ဝှက်စကားဝှက် အသစ် အောင်မြင်စွာ သတ်မှတ်ပြီးပါပြီ',
    };
  };

  // Store Profile update
  const updateStoreProfile = (newProfile: StoreProfile) => {
    setStoreProfile(newProfile);
    pushProfileToCloud(newProfile);
  };

  // PIN security
  const verifyPin = (inputPin: string): boolean => {
    if (!storeProfile.securityPin || inputPin === storeProfile.securityPin) {
      setIsPinLocked(false);
      setPinAuthError(null);
      return true;
    }
    setPinAuthError('လျှို့ဝှက်ကုဒ် မှားယွင်းနေပါသည် (Incorrect PIN)');
    return false;
  };

  const lockSystem = () => {
    setIsPinLocked(true);
  };

  const unlockSystem = () => {
    setIsPinLocked(false);
  };

  // Backup & Restore
  const exportDatabaseJSON = (): string => {
    const exportPayload = {
      version: '1.0',
      appName: 'EI MON SKINCARE',
      exportedAt: new Date().toISOString(),
      storeProfile,
      products,
      orders,
      expenses,
    };
    return JSON.stringify(exportPayload, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.products || !data.orders || !data.storeProfile) {
        throw new Error('Invalid backup schema');
      }
      setProducts(data.products);
      setOrders(data.orders);
      if (data.expenses) setExpenses(data.expenses);
      setStoreProfile(data.storeProfile);
      return true;
    } catch (err) {
      console.error('Failed to import database:', err);
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        expenses,
        storeProfile,
        cart,
        activeTab,
        languageMode,
        useMyanmarDigits,
        selectedProductForEdit,
        activeReceiptOrder,
        isPinLocked,
        pinAuthError,

        // Cloud sync
        isCloudConnected,
        cloudSyncStatus,
        cloudError,
        needsTableSetup,
        supabaseConfig,
        updateSupabaseConfig,
        disconnectSupabase,
        syncNowWithCloud,

        setActiveTab,
        goBack,
        canGoBack,
        setLanguageMode,
        setUseMyanmarDigits,
        setSelectedProductForEdit,
        setActiveReceiptOrder,

        addToCart,
        updateCartQuantity,
        updateCartItemDiscount,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartDiscountTotal,
        cartTotal,
        cartItemCount,

        checkout,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        clearAllProducts,
        adjustStock,

        addExpense,
        deleteExpense,
        refundOrder,
        deleteOrder,
        clearAllOrders,
        verifyDeletePassword,
        updateDeletePassword,
        resetDeletePassword,
        setDirectDeletePassword,

        updateStoreProfile,
        verifyPin,
        lockSystem,
        unlockSystem,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
