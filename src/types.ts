export type ProductCategory =
  | 'all'
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'mask'
  | 'treatment'
  | 'body'
  | 'set';

export type SkinType = 'all' | 'oily' | 'dry' | 'sensitive' | 'combination' | 'acne';

export interface Product {
  id: string;
  nameMy: string; // Burmese Name
  nameEn: string; // English Name
  sku: string;
  barcode: string;
  category: ProductCategory;
  brand: string;
  skinType: SkinType[];
  volume: string; // e.g., '50ml', '150ml'
  costPrice: number; // In MMK
  sellingPrice: number; // In MMK
  stock: number;
  minStockAlert: number;
  imageUrl: string;
  descriptionMy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number; // 0 - 100
  discountAmount: number; // MMK
  finalPrice: number; // Unit price after discount
  lineTotal: number; // finalPrice * quantity
}

export type PaymentMethod = 'cash' | 'kpay';

export interface OrderItem {
  productId: string;
  productNameMy: string;
  productNameEn: string;
  sku: string;
  unitCost: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  receiptNumber: string;
  items: OrderItem[];
  itemCount: number;
  subtotal: number; // MMK
  discountTotal: number; // MMK
  taxPercent: number;
  taxAmount: number; // MMK
  grandTotal: number; // MMK
  costTotal: number; // MMK
  profit: number; // grandTotal - costTotal - tax
  paymentMethod: PaymentMethod;
  amountReceived: number; // MMK
  changeGiven: number; // MMK
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  status: 'completed' | 'refunded' | 'voided';
}

export type ExpenseCategory =
  | 'rent'
  | 'salary'
  | 'utilities'
  | 'packaging'
  | 'marketing'
  | 'logistics'
  | 'maintenance'
  | 'other';

export interface Expense {
  id: string;
  title: string;
  titleMy: string;
  category: ExpenseCategory;
  amount: number; // MMK
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface StoreProfile {
  name: string;
  nameMy: string;
  slogan: string;
  sloganMy: string;
  phone: string;
  address: string;
  addressMy: string;
  kpayNumber: string;
  kpayName: string;
  waveNumber: string;
  waveName: string;
  taxRate: number; // e.g. 0 or 5
  paperSize: '58mm' | '80mm';
  securityPin: string;
  pinRequiredForFinance: boolean;
  activeCashier: string;
  orderDeletePassword?: string;
}

export type PageTab = 'pos' | 'products' | 'add-product' | 'transactions' | 'finance' | 'security';
