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

  const isPos = activeTab === 'pos';

  return (
    <div
      className={`bg-stone-100 flex flex-col text-stone-900 font-sans selection:bg-rose-100 selection:text-rose-900 ${
        isPos ? 'h-screen sm:h-screen overflow-hidden' : 'min-h-screen pb-20 sm:pb-8'
      }`}
    >
      {/* Top Header */}
      <Header onOpenMobileCart={() => setIsMobileCartOpen(true)} />

      {/* Supabase Setup Notification Banner if database tables not initialized */}
      <SupabaseSetupBanner />

      {/* Main Navigation Tabs */}
      <Navigation />

      {/* Main Content Area */}
      <main
        className={`w-full ${
          isPos
            ? 'flex-1 min-h-0 overflow-hidden flex flex-col'
            : 'flex-1'
        }`}
      >
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
