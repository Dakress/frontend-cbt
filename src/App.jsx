import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardPeserta from './pages/DashboardPeserta';
import PersiapanUjian from './pages/PersiapanUjian';
import Ujian from './pages/Ujian';
import SelesaiUjian from './pages/SelesaiUjian';
import HistoryPeserta from './pages/HistoryPeserta';
import AdminDashboard from './pages/AdminDashboard';
import AdminBankSoal from './pages/AdminBankSoal';
import AdminSesiUjian from './pages/AdminSesiUjian';
import AdminPenilaian from './pages/AdminPenilaian';
import AdminManajemenAkun from './pages/AdminManajemenAkun';
import PengawasDashboard from './pages/PengawasDashboard'; // <-- Import Halaman Pengawas Baru

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Jalur Peserta */}
        <Route path="/peserta/dashboard" element={<DashboardPeserta />} />
        <Route path="/peserta/persiapan" element={<PersiapanUjian />} />
        <Route path="/peserta/ujian" element={<Ujian />} />
        <Route path="/peserta/selesai-ujian" element={<SelesaiUjian />} />
        <Route path="/peserta/history" element={<HistoryPeserta />} />

        {/* Jalur Pengawas */}
        <Route path="/pengawas/dashboard" element={<PengawasDashboard />} /> {/* <-- Route Pengawas */}

        {/* Jalur Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/bank-soal" element={<AdminBankSoal />} />
        <Route path="/admin/sesi-ujian" element={<AdminSesiUjian />} />
        <Route path="/admin/manajemen-akun" element={<AdminManajemenAkun />} />
        <Route path="/admin/penilaian" element={<AdminPenilaian />} />
      </Routes>
    </BrowserRouter>
  );
}