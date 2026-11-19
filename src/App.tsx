import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { About } from './pages/About';
import { Account } from './pages/Account';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Cart } from './pages/Cart';
import { Categories } from './pages/Categories';
import { Checkout } from './pages/Checkout';
import { GiftMatch } from './pages/GiftMatch';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { ProductDetails } from './pages/ProductDetails';
import { Shop } from './pages/Shop';
import { Wishlist } from './pages/Wishlist';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop mode="shop" />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category/:slug" element={<Shop mode="category" />} />
                <Route path="/deals" element={<Shop mode="deals" />} />
                <Route path="/search" element={<Shop mode="search" />} />
                <Route path="/product/:slug" element={<ProductDetails />} />
                <Route path="/giftmatch" element={<GiftMatch />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/login" element={<Login />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
