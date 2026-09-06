import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { POSPage } from './components/pos/POSPage';
import { ProductListPage } from './components/products/ProductListPage';
import { AddProductPage } from './components/products/AddProductPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { FinancePage } from './components/finance/FinancePage';
import { SecurityBackupPage } from './components/security/SecurityBackupPage';
import { ReceiptModal } from './components/receipt/ReceiptModal';
import { SupabaseSetupBanner } from './components/security/SupabaseSetupBanner';

function MainLayout() {
  const { activeTab, activeReceiptOrder, setActiveReceiptOrder } = useStore();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col pb-20 sm:pb-8 text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Top Header */}
      <Header onOpenMobileCart={() => setIsMobileCartOpen(true)} />

      {/* Supabase Setup Notification Banner if database tables not initialized */}
      <SupabaseSetupBanner />

      {/* Main Navigation Tabs */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'pos' && (
          <POSPage
            isMobileCartOpen={isMobileCartOpen}
            setIsMobileCartOpen={setIsMobileCartOpen}
          />
        )}
        {activeTab === 'products' && <ProductListPage />}
        {activeTab === 'add-product' && <AddProductPage />}
        {activeTab === 'transactions' && <TransactionsPage />}
        {activeTab === 'finance' && <FinancePage />}
        {activeTab === 'security' && <SecurityBackupPage />}
      </main>

      {/* Global Thermal Receipt Modal */}
      <ReceiptModal
        order={activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
