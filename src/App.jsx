import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import GoogleMapsProvider from './components/GoogleMapsProvider.jsx';
import Navbar from './components/Navbar.jsx';
import AppSplash from './components/AppSplash.jsx';
import HomePage from './views/HomePage.jsx';
import FieldOfficerView from './views/FieldOfficerView.jsx';
import SupervisorView from './views/SupervisorView.jsx';
import CommissionerView from './views/CommissionerView.jsx';
import AdminPanel from './views/AdminPanel.jsx';
import { fetchAdminConfig, selectConfigStatus } from './Redux/slices/adminSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const configStatus = useSelector(selectConfigStatus);
  const showSplash = configStatus === 'idle' || configStatus === 'loading';

  useEffect(() => {
    dispatch(fetchAdminConfig());
  }, [dispatch]);

  return (
    <GoogleMapsProvider>
      <AnimatePresence>{showSplash && <AppSplash key="app-splash" />}</AnimatePresence>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/officer" element={<FieldOfficerView />} />
          <Route path="/supervisor" element={<SupervisorView />} />
          <Route path="/commissioner" element={<CommissionerView />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </GoogleMapsProvider>
  );
}
