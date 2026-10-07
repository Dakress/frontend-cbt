import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function PersiapanUjian() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ nama_lengkap: 'Peserta Ujian', nim_username: '' });
  const [sesiAktif, setSesiAktif] = useState(null);
  const [jumlahSoal, setJumlahSoal] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/');
    }

    // Ambil data sesi yang spesifik dipilih peserta dari localStorage
    const storedSesi = localStorage.getItem('sesi_ujian_aktif');
    if (storedSesi) {
      const sesi = JSON.parse(storedSesi);
      setSesiAktif(sesi);

      // Hitung jumlah soal berdasarkan paket soal pada sesi tersebut
      const fetchJumlahSoal = async () => {
        const { count } = await supabase
          .from('soal')
          .select('*', { count: 'exact', head: true })
          .eq('paket_id', sesi.paket_id);

        if (count !== null) setJumlahSoal(count);
        setLoading(false);
      };

      fetchJumlahSoal();
    } else {
      navigate('/peserta/dashboard');
    }
  }, [navigate]);

  const handleMulaiUjian = async (e) => {
    e.preventDefault();
    if (!sesiAktif) return;

    // Validasi token ujian dengan kode token sesi di database
    if (tokenInput.toUpperCase().trim() === sesiAktif.kode_token.toUpperCase().trim()) {
      
      // Update status_aktivitas peserta menjadi 'proses' saat menekan tombol Mulai
      const storedUser = localStorage.getItem('user_cbt');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.id) {
          await supabase
            .from('users')
            .update({ status_aktivitas: 'proses' })
            .eq('id', parsedUser.id);
        }
      }

      // Berpindah ke halaman lembar ujian
      navigate('/peserta/ujian');
    } else {
      alert('Kode Token Ujian salah! Silakan minta token yang valid dari pengawas/admin.');
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
    localStorage.removeItem('sesi_ujian_aktif');
    navigate('/');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PS';
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
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

      <main className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <Link to="/peserta/dashboard" className="text-xs text-[#5E35B1] font-semibold hover:underline flex items-center space-x-1 mb-2">
            <span>&lt; Kembali ke Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {sesiAktif ? `${sesiAktif.paket_soal?.nama_paket || 'Paket Ujian'} - Persiapan Ujian` : 'Persiapan Ujian'}
          </h1>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-gray-400 text-xs">Memuat data persiapan...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-medium">Durasi Ujian</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{sesiAktif?.durasi_menit || 60} Menit</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Jumlah Soal</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{jumlahSoal} Soal (PG & Uraian)</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tata Tertib Ujian:</h3>
              <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 leading-relaxed">
                <li>Kerjakan soal secara mandiri tanpa bantuan pihak lain.</li>
                <li>Dilarang membuka tab browser baru selama ujian berlangsung.</li>
                <li>Dilarang keluar dari mode layar penuh (*fullscreen*). Pelanggaran dicatat sistem.</li>
                <li>Pelanggaran dicatat sistem secara otomatis. Batas maksimum pelanggaran adalah 3 kali; peserta otomatis keluar/selesai dari sesi ujian.</li>
                <li>Pastikan koneksi internet stabil sebelum menekan tombol mulai.</li>
              </ol>
            </div>

            <form onSubmit={handleMulaiUjian} className="pt-4 border-t border-gray-100 space-y-3">
              <label className="block text-xs font-bold text-gray-700">Masukkan Kode Token Ujian (Dari Pengawas/Admin)</label>
              <div className="flex space-x-3">
                <input 
                  type="text" 
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="CONTOH: A7XVC" 
                  className="flex-1 p-3 border border-gray-300 rounded-xl text-xs font-mono font-bold tracking-widest uppercase outline-none focus:ring-2 focus:ring-[#5E35B1]"
                />
                <button 
                  type="submit" 
                  className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-8 py-3 rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Mulai &gt;
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}