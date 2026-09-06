export const SUPABASE_SETUP_SQL = `-- EI MON SKINCARE POS - Supabase Database Schema & Realtime Setup
-- Copy and run this script in your Supabase SQL Editor (1-Click Run)

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_my TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  brand TEXT,
  skin_type JSONB DEFAULT '[]'::jsonb,
  volume TEXT,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  description_my TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  tax_percent NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  cost_total NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  amount_received NUMERIC DEFAULT 0,
  change_given NUMERIC DEFAULT 0,
  cashier_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT,
  title_my TEXT,
  category TEXT,
  amount NUMERIC DEFAULT 0,
  date TEXT,
  recorded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_profile (
  id TEXT PRIMARY KEY DEFAULT 'main',
  profile JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Allow anon all on products" ON products;
DROP POLICY IF EXISTS "Allow anon all on orders" ON orders;
DROP POLICY IF EXISTS "Allow anon all on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow anon all on store_profile" ON store_profile;

-- Create open access policies for the POS applet using anon key
CREATE POLICY "Allow anon all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on store_profile" ON store_profile FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime Publication for live device syncing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'store_profile') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE store_profile;
  END IF;
END $$;
`;

export const SUPABASE_SCHEMA_SQL = SUPABASE_SETUP_SQL;
