import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function DashboardPeserta() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ id: '', nama_lengkap: 'Peserta Ujian', nim_username: '' });
  const [sesiList, setSesiList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal Ganti Password
  const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/');
    }

    const fetchSesiAktif = async () => {
      // Ambil seluruh sesi ujian
      const { data, error } = await supabase
        .from('sesi_ujian')
        .select('*, paket_soal(id, nama_paket, penjelasan, link_video)');

      if (!error && data) {
        const sekarang = new Date();

        // Filter Sesi: Hanya tampilkan sesi yang SEDANG AKTIF
        // (Waktu sekarang sudah melewati jadwal_mulai DAN belum melewati jadwal_selesai)
        const sesiValid = data.filter((sesi) => {
          const mulai = sesi.jadwal_mulai ? new Date(sesi.jadwal_mulai) : null;
          const selesai = sesi.jadwal_selesai ? new Date(sesi.jadwal_selesai) : null;

          // Jika ada jadwal mulai dan belum saatnya dibuka -> Sembunyikan
          if (mulai && sekarang < mulai) return false;

          // Jika ada jadwal selesai dan sudah lewat waktunya -> Sembunyikan/Hilangkan
          if (selesai && sekarang > selesai) return false;

          return true;
        });

        setSesiList(sesiValid);
      }
      setLoading(false);
    };

    fetchSesiAktif();
  }, [navigate]);

  const handleGantiPassword = async (e) => {
    e.preventDefault();

    if (!passwordBaru || !konfirmasiPassword) {
      alert('Semua kolom password wajib diisi!');
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      alert('Konfirmasi password baru tidak cocok!');
      return;
    }

    // Update password ke database tabel users
    const { error } = await supabase
      .from('users')
      .update({ password: passwordBaru })
      .eq('id', user.id);

    if (error) {
      alert('Gagal mengganti password: ' + error.message);
    } else {
      alert('Password berhasil diubah! Silakan gunakan password baru untuk login selanjutnya.');
      // Update session localStorage juga
      const updatedUser = { ...user, password: passwordBaru };
      localStorage.setItem('user_cbt', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setModalPasswordOpen(false);
      setPasswordBaru('');
      setKonfirmasiPassword('');
    }
  };

  const handleLogout = async () => {
    if (user.id) {
      await supabase
        .from('users')
        .update({ status_aktivitas: 'offline' })
        .eq('id', user.id);
    }
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PS';
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Navbar Atas */}
      <header className="bg-[#5E35B1] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <span className="font-bold tracking-wider text-lg text-white">ELCRIT</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/peserta/history" className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5">
            <span>📋 Riwayat Nilai</span>
          </Link>

          {/* Tombol Buka Modal Ganti Password */}
          <button 
            onClick={() => setModalPasswordOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            🔒 Ganti Password
          </button>

          <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full border border-white/10">
            <div className="w-8 h-8 rounded-full bg-white text-[#5E35B1] flex items-center justify-center font-bold text-xs">
              {getInitials(user.nama_lengkap)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user.nama_lengkap}</p>
              <p className="text-[10px] text-purple-200">ID: {user.nim_username}</p>
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

      {/* Konten Dashboard */}
      <main className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Halo, {user.nama_lengkap} 👋</h1>
          <p className="text-xs text-gray-500 mt-1">Daftar sesi ujian aktif yang dibuka oleh pengawas/admin</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-10">Memuat sesi ujian...</p>
        ) : sesiList.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-gray-700">Belum ada sesi ujian yang dibuka oleh Admin.</p>
            <p className="text-xs text-gray-400">Silakan tunggu hingga admin membuat sesi ujian.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sesiList.map((sesi, i) => (
              <div key={sesi.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-purple-50 text-[#5E35B1] rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold bg-purple-100 text-[#5E35B1] px-2 py-0.5 rounded uppercase">
                      {sesi.nama_sesi}
                    </span>
                    <h3 className="font-bold text-gray-800 text-base mt-1">
                      {sesi.paket_soal?.nama_paket || 'Paket Ujian'}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      {sesi.paket_soal?.penjelasan || 'Ujian berbasis analisis video penelitian'}
                    </p>
                    <div className="flex space-x-6 text-xs text-gray-600 font-medium">
                      <span>⏱ Durasi: {sesi.durasi_menit || 60} Menit</span>
                      <span>📄 Sistem: PG & Uraian</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    localStorage.setItem('sesi_ujian_aktif', JSON.stringify(sesi));
                    navigate('/peserta/persiapan');
                  }} 
                  className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition flex items-center space-x-2"
                >
                  <span>Mulai</span>
                  <span>&gt;</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Ganti Password Peserta */}
      {modalPasswordOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-base">Ganti Password Akun</h3>
              <button onClick={() => setModalPasswordOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleGantiPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password Baru</label>
                <input 
                  type={showPass ? "text" : "password"}
                  required
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input 
                  type={showPass ? "text" : "password"}
                  required
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="showPassToggle" 
                  checked={showPass} 
                  onChange={() => setShowPass(!showPass)}
                  className="rounded"
                />
                <label htmlFor="showPassToggle" className="text-xs text-gray-600 cursor-pointer">Tampilkan password</label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button 
                  type="button"
                  onClick={() => setModalPasswordOpen(false)}
                  className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="py-2.5 bg-[#5E35B1] hover:bg-[#4b2a8e] text-white rounded-xl text-xs font-semibold transition shadow-md"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}