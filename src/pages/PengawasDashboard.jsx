import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function PengawasDashboard() {
  const navigate = useNavigate();
  const [pengawasName, setPengawasName] = useState('Pengawas');
  const [daftarPeserta, setDaftarPeserta] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    if (!storedUser) {
      navigate('/');
      return;
    }

    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'pengawas' && parsed.role !== 'admin') {
      alert('Akses Ditolak! Halaman ini khusus untuk Pengawas Ujian.');
      navigate('/peserta/dashboard');
      return;
    }

    setPengawasName(parsed.nama_lengkap || 'Pengawas');

    // Fetch data peserta & listening realtime perubahan status
    fetchPesertaMonitoring();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchPesertaMonitoring();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchPesertaMonitoring = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'peserta')
      .order('nama_lengkap', { ascending: true });

    if (!error && data) {
      setDaftarPeserta(data);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  // Statistik Realtime
  const totalPeserta = daftarPeserta.length;
  const countOffline = daftarPeserta.filter(p => !p.status_aktivitas || p.status_aktivitas === 'offline').length;
  const countOnline = daftarPeserta.filter(p => p.status_aktivitas === 'online').length;
  const countProses = daftarPeserta.filter(p => p.status_aktivitas === 'proses').length;
  const countSelesai = daftarPeserta.filter(p => p.status_aktivitas === 'selesai').length;

  const filteredPeserta = daftarPeserta.filter(p =>
    p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nim_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBadgeStatus = (status) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Online (Standby)</span>
          </span>
        );
      case 'proses':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>Sedang Ujian</span>
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Selesai Ujian</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            <span>Offline</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      {/* Header Top Bar */}
      <header className="bg-[#5E35B1] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div>
            <span className="font-bold tracking-wider text-lg text-white">ELCRIT</span>
            <span className="text-[10px] ml-2 bg-purple-400/30 text-purple-100 px-2 py-0.5 rounded font-mono">MONITORING PENGAWAS</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <div className="w-8 h-8 rounded-full bg-white text-[#5E35B1] flex items-center justify-center font-bold text-xs">
              {pengawasName ? pengawasName.substring(0, 2).toUpperCase() : 'PW'}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{pengawasName}</p>
              <p className="text-[10px] text-purple-200">Pengawas Ruangan</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold transition border border-white/10"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="p-8 max-w-7xl mx-auto w-full flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Monitoring Ruangan Ujian</h1>
          <p className="text-xs text-gray-500 mt-1">Pantau status presensi dan pengerjaan ujian peserta secara terpusat dan realtime</p>
        </div>

        {/* Card Statistik Realtime */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">🔴 Offline</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{countOffline}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">
              {totalPeserta > 0 ? Math.round((countOffline / totalPeserta) * 100) : 0}%
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase">🟡 Standby (Online)</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{countOnline}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              {totalPeserta > 0 ? Math.round((countOnline / totalPeserta) * 100) : 0}%
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">🔵 Sedang Ujian</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{countProses}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              {totalPeserta > 0 ? Math.round((countProses / totalPeserta) * 100) : 0}%
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase">🟢 Selesai Ujian</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{countSelesai}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              {totalPeserta > 0 ? Math.round((countSelesai / totalPeserta) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Tabel Peserta */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">
              Daftar Peserta Ruangan ({filteredPeserta.length})
            </h2>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari nama atau ID peserta..."
              className="w-72 p-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-3">No</th>
                  <th className="p-3">Nama Lengkap Peserta</th>
                  <th className="p-3">ID / NIM Peserta</th>
                  <th className="p-3 text-center">Status Realtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-400">Memuat data monitoring...</td>
                  </tr>
                ) : filteredPeserta.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-400">Belum ada data peserta terdaftar.</td>
                  </tr>
                ) : (
                  filteredPeserta.map((peserta, idx) => (
                    <tr key={peserta.id} className="hover:bg-purple-50/40 transition">
                      <td className="p-3 font-medium text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-gray-800">{peserta.nama_lengkap}</td>
                      <td className="p-3 font-mono text-[#5E35B1] font-semibold">{peserta.nim_username}</td>
                      <td className="p-3 text-center">
                        {renderBadgeStatus(peserta.status_aktivitas)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}