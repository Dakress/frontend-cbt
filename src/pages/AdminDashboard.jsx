import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [totalMahasiswa, setTotalMahasiswa] = useState(0);
  const [menungguPenilaian, setMenungguPenilaian] = useState(0);
  const [adminName, setAdminName] = useState('Admin'); 
  const [aktivitasTerbaru, setAktivitasTerbaru] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil data user dari localStorage
    const storedUser = localStorage.getItem('user_cbt');
    if (!storedUser) {
      navigate('/'); 
      return;
    }

    const parsed = JSON.parse(storedUser);
    
    // SATPAM: Cek apakah role-nya benar-benar admin
    if (parsed.role !== 'admin') {
      alert('Akses Ditolak! Anda terdeteksi sebagai Peserta.');
      navigate('/peserta/dashboard'); 
      return;
    }

    // Set nama admin dari data sesi lokal
    if (parsed.nama_lengkap) {
      setAdminName(parsed.nama_lengkap);
    }

    const fetchAdminData = async () => {
      // 1. Hitung total mahasiswa
      const { count: countSiswa } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'peserta');
      if (countSiswa !== null) setTotalMahasiswa(countSiswa);

      // 2. Hitung Ujian Menunggu Penilaian
      const { data: dataMenunggu } = await supabase
        .from('hasil_ujian')
        .select('status, nilai_uraian');
      
      if (dataMenunggu) {
        const belumDikoreksi = dataMenunggu.filter(
          item => item.nilai_uraian === 0 || item.status === 'Menunggu' || item.status?.toLowerCase() === 'selesai'
        ).length;
        setMenungguPenilaian(belumDikoreksi);
      }

      // 3. Aktivitas Terbaru
      const { data: hasilData, error } = await supabase
        .from('hasil_ujian')
        .select('id, waktu_selesai, users(nama_lengkap, nim_username), paket_soal(nama_paket)')
        .order('waktu_selesai', { ascending: false })
        .limit(5);

      if (!error && hasilData) {
        setAktivitasTerbaru(hasilData);
      }
      setLoading(false);
    };

    fetchAdminData();
  }, [navigate]); 

  const handleLogout = () => {
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-[#5E35B1] text-white flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
              </svg>
            </div>
            <h2 className="font-bold text-xl tracking-wider text-white">ELCRIT</h2>
          </div>

          <nav className="space-y-2">
            <Link to="/admin/dashboard" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-[#774ECA] text-white font-medium text-sm">
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/bank-soal" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>📁</span>
              <span>Bank Soal</span>
            </Link>
            <Link to="/admin/sesi-ujian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>🕒</span>
              <span>Sesi Ujian</span>
            </Link>
            <Link to="/admin/penilaian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>⭐</span>
              <span>Penilaian</span>
            </Link>
            <Link to="/admin/manajemen-akun" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>👥</span>
              <span>Manajemen Akun</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-3">
          <button onClick={handleLogout} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-semibold transition">
            Keluar Sistem
          </button>
          <div className="text-xs text-purple-300">
            <p>ELCRIT CBT v1.0</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#5E35B1] text-white flex items-center justify-center font-bold text-sm">
              {adminName ? adminName.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">{adminName}</p>
              {/* Teks di bawah nama telah ditukar menjadi 'Admin' sahaja */}
              <p className="text-[10px] text-gray-500">Admin</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-[#5E35B1] text-2xl mb-2 flex justify-center">👥</div>
            <h3 className="text-gray-500 text-sm font-medium">Total Mahasiswa</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{totalMahasiswa}</p>
            <span className="text-[10px] text-gray-400">Tercatat di Database Supabase</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-[#5E35B1] text-2xl mb-2 flex justify-center">▶️</div>
            <h3 className="text-gray-500 text-sm font-medium">Sesi Ujian Aktif</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">1</p>
            <span className="text-[10px] text-green-600 font-semibold">Token Aktif</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-[#5E35B1] text-2xl mb-2 flex justify-center">⏳</div>
            <h3 className="text-gray-500 text-sm font-medium">Menunggu Penilaian</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{menungguPenilaian}</p>
            <span className="text-[10px] text-orange-500 font-semibold">Uraian Belum Dikoreksi</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4">Aktivitas Terbaru Peserta</h2>
          
          {loading ? (
            <p className="text-xs text-gray-400">Memuat aktivitas...</p>
          ) : aktivitasTerbaru.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
              <p className="text-xs text-gray-500">Belum ada aktivitas peserta yang menyelesaikan ujian.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aktivitasTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-[#5E35B1] rounded-full"></div>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold text-gray-900">{item.users?.nama_lengkap || 'Peserta Ujian'}</span> (NIM: {item.users?.nim_username || '-'}) telah menyelesaikan ujian <span className="font-semibold text-[#5E35B1]">{item.paket_soal?.nama_paket || 'Paket Ujian'}</span>.
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {item.waktu_selesai ? new Date(item.waktu_selesai).toLocaleString('id-ID') : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}