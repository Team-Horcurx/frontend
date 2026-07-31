import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import GoogleMapsProvider from './components/GoogleMapsProvider.jsx';
import Navbar from './components/Navbar.jsx';
import HomePage from './views/HomePage.jsx';
import FieldOfficerView from './views/FieldOfficerView.jsx';
import SupervisorView from './views/SupervisorView.jsx';
import CommissionerView from './views/CommissionerView.jsx';
import AdminPanel from './views/AdminPanel.jsx';
import { fetchAdminConfig } from './Redux/slices/adminSlice.js';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAdminConfig());
  }, [dispatch]);

  return (
    <GoogleMapsProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/officer" element={<FieldOfficerView />} />
        <Route path="/supervisor" element={<SupervisorView />} />
        <Route path="/commissioner" element={<CommissionerView />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </GoogleMapsProvider>
  );
}
