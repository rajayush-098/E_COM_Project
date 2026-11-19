import React from 'react';
import { Outlet } from 'react-router-dom';
import { Database, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { CartDrawer } from '../cart/CartDrawer';
import { ToastViewport } from '../common/Feedback';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function Layout() {
  const { isAdmin } = useAuth();
  const { catalogLoading, catalogFromFirestore, isSeeding, initializeFirestoreCatalog } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F7] text-[#202A27]">
      {!catalogLoading && !catalogFromFirestore && isAdmin && (
        <div className="bg-[#202A27] text-white text-xs px-4 py-2 flex items-center justify-center gap-3">
          <span>Admin notice: Your Firestore database has not been seeded yet.</span>
          <button
            type="button"
            disabled={isSeeding}
            onClick={() => void initializeFirestoreCatalog()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#26734D] hover:bg-[#1E5C3D] text-white font-medium cursor-pointer disabled:opacity-60"
          >
            {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            {isSeeding ? 'Syncing...' : 'Seed Firestore Catalogue'}
          </button>
        </div>
      )}

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
      <ToastViewport />
    </div>
  );
}
