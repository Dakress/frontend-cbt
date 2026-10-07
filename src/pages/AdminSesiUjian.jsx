import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminSesiUjian() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [daftarSesi, setDaftarSesi] = useState([]);
  const [daftarPaket, setDaftarPaket] = useState([]);
  
  // State Modal & Form Mode (Tambah / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSesiId, setSelectedSesiId] = useState(null);

  const [namaSesi, setNamaSesi] = useState('');
  const [paketId, setPaketId] = useState('');
  const [durasiMenit, setDurasiMenit] = useState('60');
  const [jadwalMulai, setJadwalMulai] = useState('');
  const [jadwalSelesai, setJadwalSelesai] = useState('');
  const [kodeToken, setKodeToken] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    if (!storedUser) {
      navigate('/');
      return;
    }

    const parsed = JSON.parse(storedUser);
    if (parsed.role !== 'admin') {
      alert('Akses Ditolak! Anda terdeteksi sebagai Peserta.');
      navigate('/peserta/dashboard');
      return;
    }

    setAdminName(parsed.nama_lengkap || 'Admin');
    fetchSesi();
    fetchPaket();
  }, [navigate]);

  const fetchSesi = async () => {
    const { data, error } = await supabase
      .from('sesi_ujian')
      .select('*, paket_soal(nama_paket)');

    if (error) {
      console.error("Error Fetch Sesi Ujian:", error);
    } else if (data) {
      setDaftarSesi(data);
    }
  };

  const fetchPaket = async () => {
    const { data, error } = await supabase.from('paket_soal').select('*');
    if (!error && data) {
      setDaftarPaket(data);
      if (data.length > 0 && !paketId) setPaketId(data[0].id);
    }
  };

  const generateTokenRandom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 5; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setKodeToken(token);
  };

  // Helper konversi ISO UTC ke format lokal input datetime-local (YYYY-MM-DDTHH:mm)
  const formatIsoToInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleBukaModalTambah = () => {
    setIsEditMode(false);
    setSelectedSesiId(null);
    setNamaSesi('');
    if (daftarPaket.length > 0) setPaketId(daftarPaket[0].id);
    setDurasiMenit('60');
    setJadwalMulai('');
    setJadwalSelesai('');
    generateTokenRandom();
    setModalOpen(true);
  };

  const handleBukaModalEdit = (sesi) => {
    setIsEditMode(true);
    setSelectedSesiId(sesi.id);
    setNamaSesi(sesi.nama_sesi || '');
    setPaketId(sesi.paket_id || (daftarPaket.length > 0 ? daftarPaket[0].id : ''));
    setDurasiMenit(String(sesi.durasi_menit || 60));
    setJadwalMulai(formatIsoToInput(sesi.jadwal_mulai));
    setJadwalSelesai(formatIsoToInput(sesi.jadwal_selesai));
    setKodeToken(sesi.kode_token || '');
    setModalOpen(true);
  };

  const handleSimpanSesi = async (e) => {
    e.preventDefault();
    if (!namaSesi || !paketId || !kodeToken) return;

    const formatWaktuLokal = (val) => {
      if (!val) return null;
      return new Date(val).toISOString();
    };

    const payload = {
      nama_sesi: namaSesi,
      paket_id: paketId,
      durasi_menit: parseInt(durasiMenit) || 60,
      jadwal_mulai: formatWaktuLokal(jadwalMulai),
      jadwal_selesai: formatWaktuLokal(jadwalSelesai),
      kode_token: kodeToken.toUpperCase()
    };

    if (isEditMode) {
      // Update sesi yang sudah ada
      const { error } = await supabase
        .from('sesi_ujian')
        .update(payload)
        .eq('id', selectedSesiId);

      if (!error) {
        alert('Sesi ujian berhasil diperbarui!');
        setModalOpen(false);
        fetchSesi();
      } else {
        alert('Gagal mengupdate sesi ujian: ' + error.message);
      }
    } else {
      // Buat sesi ujian baru
      const { error } = await supabase
        .from('sesi_ujian')
        .insert([payload]);

      if (!error) {
        alert('Sesi ujian baru berhasil dibuat!');
        setModalOpen(false);
        fetchSesi();
      } else {
        alert('Gagal membuat sesi ujian: ' + error.message);
      }
    }
  };

  const handleHapusSesi = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus sesi ujian "${nama}"?`)) {
      const { error } = await supabase.from('sesi_ujian').delete().eq('id', id);
      if (!error) {
        fetchSesi();
      } else {
        alert('Gagal menghapus sesi: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  // Helper tampilan jadwal waktu yang rapi (Mulai s/d Selesai)
  const renderFormatJadwal = (mulai, selesai) => {
    if (!mulai && !selesai) {
      return <span className="text-gray-400 italic">Bebas / Kapan Saja</span>;
    }

    const formatTgl = (iso) => {
      if (!iso) return '-';
      return new Date(iso).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    };

    return (
      <div className="space-y-0.5">
        <div className="text-emerald-700 font-semibold">
          <span className="text-[10px] text-gray-400 font-normal mr-1">Mulai:</span>
          {mulai ? formatTgl(mulai) : 'Langsung Buka'}
        </div>
        <div className="text-rose-600 font-semibold">
          <span className="text-[10px] text-gray-400 font-normal mr-1">Sampai:</span>
          {selesai ? formatTgl(selesai) : 'Tanpa Batas'}
        </div>
      </div>
    );
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
            <Link to="/admin/dashboard" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/bank-soal" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>📁</span>
              <span>Bank Soal</span>
            </Link>
            <Link to="/admin/sesi-ujian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-[#774ECA] text-white font-medium text-sm">
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

      {/* Content Utama */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sesi Ujian & Manajemen Token</h1>
            <p className="text-xs text-gray-400">Atur jadwal pelaksanaan dan token unik untuk akses ujian peserta</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBukaModalTambah}
              className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-2"
            >
              <span>+ Buat Sesi Baru</span>
            </button>

            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-[#5E35B1] text-white flex items-center justify-center font-bold text-sm">
                {adminName ? adminName.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{adminName}</p>
                <p className="text-[10px] text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabel Sesi Ujian */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-bold">Nama Sesi</th>
                <th className="p-4 font-bold">Paket Soal</th>
                <th className="p-4 font-bold">Durasi</th>
                <th className="p-4 font-bold">Jadwal Akses (Mulai s/d Selesai)</th>
                <th className="p-4 font-bold">Kode Token</th>
                <th className="p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {daftarSesi.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-400">Belum ada sesi ujian yang dibuat.</td>
                </tr>
              ) : (
                daftarSesi.map((sesi) => (
                  <tr key={sesi.id} className="hover:bg-purple-50/40 transition">
                    <td className="p-4 font-semibold text-gray-800">{sesi.nama_sesi}</td>
                    <td className="p-4 font-medium text-[#5E35B1]">{sesi.paket_soal?.nama_paket || 'Paket Umum'}</td>
                    <td className="p-4 font-semibold text-gray-700">{sesi.durasi_menit || 60} Menit</td>
                    <td className="p-4">
                      {renderFormatJadwal(sesi.jadwal_mulai, sesi.jadwal_selesai)}
                    </td>
                    <td className="p-4 font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded w-fit">{sesi.kode_token}</td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => handleBukaModalEdit(sesi)} 
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleHapusSesi(sesi.id, sesi.nama_sesi)} 
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Tambah / Edit Sesi Ujian */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-gray-800 text-base">
                  {isEditMode ? 'Edit Sesi Ujian' : 'Buat Sesi Ujian Baru'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
              </div>
              
              <form onSubmit={handleSimpanSesi} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Sesi</label>
                  <input 
                    type="text" 
                    required
                    value={namaSesi}
                    onChange={(e) => setNamaSesi(e.target.value)}
                    placeholder="Contoh: Sesi 1 - Gelombang 1" 
                    className="w-full p-2.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Paket Soal</label>
                  <select 
                    value={paketId}
                    onChange={(e) => setPaketId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1] bg-white"
                  >
                    {daftarPaket.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama_paket}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Durasi Ujian (Menit)</label>
                  <input 
                    type="number" 
                    required
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(e.target.value)}
                    placeholder="Contoh: 90" 
                    className="w-full p-2.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Jadwal Mulai</label>
                    <input 
                      type="datetime-local" 
                      value={jadwalMulai}
                      onChange={(e) => setJadwalMulai(e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Jadwal Selesai</label>
                    <input 
                      type="datetime-local" 
                      value={jadwalSelesai}
                      onChange={(e) => setJadwalSelesai(e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode Token Ujian</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      required
                      value={kodeToken}
                      onChange={(e) => setKodeToken(e.target.value.toUpperCase())}
                      className="flex-1 p-2.5 border rounded-lg text-xs font-mono font-bold tracking-widest text-center uppercase focus:ring-2 focus:ring-[#5E35B1]"
                    />
                    <button 
                      type="button" 
                      onClick={generateTokenRandom}
                      className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-xs font-semibold transition"
                    >
                      Acak Ulang
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-[#5E35B1] text-white rounded-lg text-xs font-semibold shadow-md">
                    {isEditMode ? 'Simpan Perubahan' : 'Simpan & Buat Sesi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}