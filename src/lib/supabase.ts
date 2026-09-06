import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order, Expense, StoreProfile } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const DEFAULT_SUPABASE_URL = 'https://ywtzyjtcdhyafxjapqlw.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_lLqgweloEp9nDH1Ro9h-gQ_nda7yibV';

const CONFIG_KEY = 'ei_mon_supabase_credentials_v1';

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }

  // Fallback to environment variables or preset project credentials
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: envUrl.startsWith('http') ? envUrl : DEFAULT_SUPABASE_URL,
    anonKey: envKey.length > 10 ? envKey : DEFAULT_SUPABASE_ANON_KEY,
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  // Reset cached client
  cachedClient = null;
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem(CONFIG_KEY);
  cachedClient = null;
};

let cachedClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

// Test connection
export const testSupabaseConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  if (!url || !anonKey) {
    return { success: false, message: 'URL နှင့် Anon Key နှစ်ခုလုံး ဖြည့်စွက်ပေးရန် လိုအပ်ပါသည်' };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    const { error } = await testClient.from('products').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, but connection was authenticated
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Supabase ချိတ်ဆက်မှု အောင်မြင်ပါသည် (ဇယားများ မဆောက်ရသေးပါ၊ SQL Script ကို Run ပေးပါ)',
        };
      }
      return { success: false, message: `ချိတ်ဆက်မှု မအောင်မြင်ပါ: ${error.message}` };
    }

    return { success: true, message: 'Supabase Cloud Database သို့ အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!' };
  } catch (err: any) {
    return { success: false, message: `ချိတ်ဆက်မှု မအောင်မြင်ပါ: ${err.message || 'Error'}` };
  }
};

// Product mappers
const mapProductToRow = (p: Product) => ({
  id: p.id,
  name_my: p.nameMy,
  name_en: p.nameEn,
  sku: p.sku || '',
  barcode: p.barcode || '',
  category: p.category,
  brand: p.brand,
  skin_type: p.skinType,
  volume: p.volume,
  cost_price: p.costPrice,
  selling_price: p.sellingPrice,
  stock: p.stock,
  min_stock_alert: p.minStockAlert,
  image_url: p.imageUrl,
  description_my: p.descriptionMy,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

const mapRowToProduct = (row: any): Product => ({
  id: row.id,
  nameMy: row.name_my,
  nameEn: row.name_en,
  sku: row.sku || '',
  barcode: row.barcode || '',
  category: row.category,
  brand: row.brand,
  skinType: Array.isArray(row.skin_type) ? row.skin_type : [],
  volume: row.volume || '',
  costPrice: Number(row.cost_price || 0),
  sellingPrice: Number(row.selling_price || 0),
  stock: Number(row.stock || 0),
  minStockAlert: Number(row.min_stock_alert || 5),
  imageUrl: row.image_url || '',
  descriptionMy: row.description_my || '',
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
});

// Order mappers
const mapOrderToRow = (o: Order) => ({
  id: o.id,
  receipt_number: o.receiptNumber,
  items: o.items,
  item_count: o.itemCount,
  subtotal: o.subtotal,
  discount_total: o.discountTotal,
  tax_percent: o.taxPercent,
  tax_amount: o.taxAmount,
  grand_total: o.grandTotal,
  cost_total: o.costTotal,
  profit: o.profit,
  payment_method: o.paymentMethod,
  amount_received: o.amountReceived,
  change_given: o.changeGiven,
  cashier_name: o.cashierName,
  customer_name: o.customerName || '',
  customer_phone: o.customerPhone || '',
  notes: o.notes || '',
  status: o.status,
  created_at: o.createdAt,
});

const mapRowToOrder = (row: any): Order => ({
  id: row.id,
  receiptNumber: row.receipt_number,
  items: Array.isArray(row.items) ? row.items : [],
  itemCount: Number(row.item_count || 0),
  subtotal: Number(row.subtotal || 0),
  discountTotal: Number(row.discount_total || 0),
  taxPercent: Number(row.tax_percent || 0),
  taxAmount: Number(row.tax_amount || 0),
  grandTotal: Number(row.grand_total || 0),
  costTotal: Number(row.cost_total || 0),
  profit: Number(row.profit || 0),
  paymentMethod: row.payment_method === 'cash' ? 'cash' : 'kpay',
  amountReceived: Number(row.amount_received || 0),
  changeGiven: Number(row.change_given || 0),
  cashierName: row.cashier_name || 'Cashier',
  customerName: row.customer_name || '',
  customerPhone: row.customer_phone || '',
  notes: row.notes || '',
  status: row.status || 'completed',
  createdAt: row.created_at || new Date().toISOString(),
});

// Expense mappers
const mapExpenseToRow = (e: Expense) => ({
  id: e.id,
  title: e.title,
  title_my: e.titleMy,
  category: e.category,
  amount: e.amount,
  date: e.date,
  recorded_by: e.recordedBy,
  notes: e.notes || '',
});

const mapRowToExpense = (row: any): Expense => ({
  id: row.id,
  title: row.title || '',
  titleMy: row.title_my || '',
  category: row.category,
  amount: Number(row.amount || 0),
  date: row.date || new Date().toISOString().slice(0, 10),
  recordedBy: row.recorded_by || 'Admin',
  notes: row.notes || '',
});

// Database Fetchers
export const fetchCloudData = async (): Promise<{
  products: Product[] | null;
  orders: Order[] | null;
  expenses: Expense[] | null;
  storeProfile: StoreProfile | null;
}> => {
  const client = getSupabase();
  if (!client) {
    return { products: null, orders: null, expenses: null, storeProfile: null };
  }

  try {
    const [prodRes, orderRes, expRes, profRes] = await Promise.all([
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('orders').select('*').order('created_at', { ascending: false }),
      client.from('expenses').select('*').order('date', { ascending: false }),
      client.from('store_profile').select('*').eq('id', 'main').maybeSingle(),
    ]);

    const products = prodRes.data ? prodRes.data.map(mapRowToProduct) : null;
    const orders = orderRes.data ? orderRes.data.map(mapRowToOrder) : null;
    const expenses = expRes.data ? expRes.data.map(mapRowToExpense) : null;
    const storeProfile = profRes.data?.profile ? (profRes.data.profile as StoreProfile) : null;

    return { products, orders, expenses, storeProfile };
  } catch (err) {
    console.warn('Failed to fetch from Supabase:', err);
    return { products: null, orders: null, expenses: null, storeProfile: null };
  }
};

// Database Pushers
export const pushProductsToCloud = async (products: Product[]) => {
  const client = getSupabase();
  if (!client || products.length === 0) return;
  try {
    const rows = products.map(mapProductToRow);
    await client.from('products').upsert(rows, { onConflict: 'id' });
  } catch (err) {
    console.error('Error syncing products to Supabase:', err);
  }
};

export const pushSingleProductToCloud = async (product: Product) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('products').upsert(mapProductToRow(product), { onConflict: 'id' });
  } catch (err) {
    console.error('Error saving product to Supabase:', err);
  }
};

export const deleteProductFromCloud = async (productId: string) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('products').delete().eq('id', productId);
  } catch (err) {
    console.error('Error deleting product from Supabase:', err);
  }
};

export const pushOrderToCloud = async (order: Order) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('orders').upsert(mapOrderToRow(order), { onConflict: 'id' });
  } catch (err) {
    console.error('Error saving order to Supabase:', err);
  }
};

export const deleteOrderFromCloud = async (orderId: string) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('orders').delete().eq('id', orderId);
  } catch (err) {
    console.error('Error deleting order from Supabase:', err);
  }
};

export const clearAllOrdersFromCloud = async () => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('orders').delete().neq('id', 'keep_none_empty_placeholder_000');
  } catch (err) {
    console.error('Error clearing orders from Supabase:', err);
  }
};

export const pushExpenseToCloud = async (expense: Expense) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('expenses').upsert(mapExpenseToRow(expense), { onConflict: 'id' });
  } catch (err) {
    console.error('Error saving expense to Supabase:', err);
  }
};

export const deleteExpenseFromCloud = async (expenseId: string) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('expenses').delete().eq('id', expenseId);
  } catch (err) {
    console.error('Error deleting expense from Supabase:', err);
  }
};

export const pushProfileToCloud = async (profile: StoreProfile) => {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('store_profile').upsert({
      id: 'main',
      profile: profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Error saving profile to Supabase:', err);
  }
};
