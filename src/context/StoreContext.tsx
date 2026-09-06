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
  INITIAL_PRODUCTS,
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
  pushProductsToCloud,
  pushSingleProductToCloud,
  deleteProductFromCloud,
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
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: SupabaseConfig) => Promise<{ success: boolean; message: string }>;
  disconnectSupabase: () => void;
  syncNowWithCloud: () => Promise<void>;

  // Navigation
  setActiveTab: (tab: PageTab) => void;
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

  // Settings & Security
  updateStoreProfile: (profile: StoreProfile) => void;
  verifyPin: (pin: string) => boolean;
  lockSystem: () => void;
  unlockSystem: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  resetToSampleData: () => void;
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
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
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
  const [activeTab, setActiveTab] = useState<PageTab>('pos');
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
          }
          return;
        }

        if (isMounted) {
          setIsCloudConnected(true);
        }

        const cloudData = await fetchCloudData();
        if (isMounted) {
          if (cloudData.products && cloudData.products.length > 0) {
            setProducts(cloudData.products);
          } else if (products.length > 0) {
            pushProductsToCloud(products);
          }

          if (cloudData.orders) {
            setOrders(cloudData.orders);
          }

          if (cloudData.expenses && cloudData.expenses.length > 0) {
            setExpenses(cloudData.expenses);
          }

          if (cloudData.storeProfile) {
            setStoreProfile(cloudData.storeProfile);
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
          if (fresh.orders && isMounted) setOrders(fresh.orders);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          const fresh = await fetchCloudData();
          if (fresh.products && fresh.products.length > 0 && isMounted) setProducts(fresh.products);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        async () => {
          const fresh = await fetchCloudData();
          if (fresh.expenses && isMounted) setExpenses(fresh.expenses);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_profile' },
        async () => {
          const fresh = await fetchCloudData();
          if (fresh.storeProfile && isMounted) setStoreProfile(fresh.storeProfile);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      client.removeChannel(channel);
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
      return test;
    }

    saveSupabaseConfigStorage(config);
    setSupabaseConfigState(config);
    setIsCloudConnected(true);

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
  };

  const syncNowWithCloud = async () => {
    if (!isCloudConnected) return;
    setCloudSyncStatus('syncing');
    try {
      const data = await fetchCloudData();
      if (data.products && data.products.length > 0) setProducts(data.products);
      if (data.orders) setOrders(data.orders);
      if (data.expenses) setExpenses(data.expenses);
      if (data.storeProfile) setStoreProfile(data.storeProfile);
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('error');
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
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    removeFromCart(productId);
    deleteProductFromCloud(productId);
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

  const resetToSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setExpenses(INITIAL_EXPENSES);
    setStoreProfile(INITIAL_STORE_PROFILE);
    clearCart();
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
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
        supabaseConfig,
        updateSupabaseConfig,
        disconnectSupabase,
        syncNowWithCloud,

        setActiveTab,
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
        adjustStock,

        addExpense,
        deleteExpense,
        refundOrder,
        deleteOrder,
        clearAllOrders,
        verifyDeletePassword,
        updateDeletePassword,

        updateStoreProfile,
        verifyPin,
        lockSystem,
        unlockSystem,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToSampleData,
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
