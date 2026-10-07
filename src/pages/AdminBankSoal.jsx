import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminBankSoal() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin'); // State untuk nama Admin
  const [daftarPaket, setDaftarPaket] = useState([]);
  const [paketAktif, setPaketAktif] = useState(null);
  const [daftarSoal, setDaftarSoal] = useState([]);
  
  const [namaPaketBaru, setNamaPaketBaru] = useState('');
  const [penjelasanBaru, setPenjelasanBaru] = useState('');
  const [linkVideoBaru, setLinkVideoBaru] = useState('');

  const [editVideoInput, setEditVideoInput] = useState('');
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [tipeSoalBaru, setTipeSoalBaru] = useState('pg');
  const [pertanyaanBaru, setPertanyaanBaru] = useState('');
  const [opsiA, setOpsiA] = useState('');
  const [opsiB, setOpsiB] = useState('');
  const [opsiC, setOpsiC] = useState('');
  const [opsiD, setOpsiD] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    if (!storedUser) {
      navigate('/'); // Belum login, tendang ke halaman awal
      return;
    }
    
    const parsed = JSON.parse(storedUser);
    // SATPAM: Cek apakah yang login benar-benar admin!
    if (parsed.role !== 'admin') {
      alert('Akses Ditolak! Anda terdeteksi sebagai Peserta.');
      navigate('/peserta/dashboard'); // Tendang kembali ke dashboard peserta
      return;
    }
    
    setAdminName(parsed.nama_lengkap || 'Admin');
    fetchPaket(); // Lanjut muat data jika aman
  }, [navigate]);

  const fetchPaket = async () => {
    const { data, error } = await supabase.from('paket_soal').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setDaftarPaket(data);
      if (data.length > 0 && !paketAktif) {
        setPaketAktif(data[0]);
        setEditVideoInput(data[0].link_video || '');
        fetchSoal(data[0].id);
      } else if (paketAktif) {
        const updated = data.find(p => p.id === paketAktif.id);
        if (updated) {
          setPaketAktif(updated);
          setEditVideoInput(updated.link_video || '');
        }
      }
    }
  };

  const fetchSoal = async (paketId) => {
    const { data, error } = await supabase
      .from('soal')
      .select('*')
      .eq('paket_id', paketId)
      .order('nomor_soal', { ascending: true });

    if (!error && data) {
      setDaftarSoal(data);
    }
  };

  const handlePilihPaket = (paket) => {
    setPaketAktif(paket);
    setEditVideoInput(paket.link_video || '');
    setIsEditingVideo(false);
    fetchSoal(paket.id);
  };

  const handleTambahPaket = async (e) => {
    e.preventDefault();
    if (!namaPaketBaru) return;

    const { error } = await supabase.from('paket_soal').insert([
      { nama_paket: namaPaketBaru, penjelasan: penjelasanBaru, link_video: linkVideoBaru }
    ]);

    if (!error) {
      setNamaPaketBaru('');
      setPenjelasanBaru('');
      setLinkVideoBaru('');
      fetchPaket();
    } else {
      alert('Gagal menambahkan paket.');
    }
  };

  const handleHapusPaket = async (id) => {
    if (window.confirm('Yakin ingin menghapus paket ini beserta seluruh soal di dalamnya?')) {
      await supabase.from('paket_soal').delete().eq('id', id);
      fetchPaket();
    }
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!paketAktif) return;

    const { error } = await supabase
      .from('paket_soal')
      .update({ link_video: editVideoInput })
      .eq('id', paketAktif.id);

    if (!error) {
      alert('Link video berhasil diperbarui!');
      setIsEditingVideo(false);
      fetchPaket();
    } else {
      alert('Gagal memperbarui video.');
    }
  };

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    if (!paketAktif || !pertanyaanBaru) return;

    const nomorBaru = daftarSoal.length + 1;
    const { error } = await supabase.from('soal').insert([
      {
        paket_id: paketAktif.id,
        nomor_soal: nomorBaru,
        tipe_soal: tipeSoalBaru,
        pertanyaan: pertanyaanBaru,
        opsi_a: tipeSoalBaru === 'pg' ? opsiA : null,
        opsi_b: tipeSoalBaru === 'pg' ? opsiB : null,
        opsi_c: tipeSoalBaru === 'pg' ? opsiC : null,
        opsi_d: tipeSoalBaru === 'pg' ? opsiD : null,
      }
    ]);

    if (!error) {
      setModalOpen(false);
      setPertanyaanBaru('');
      setOpsiA('');
      setOpsiB('');
      setOpsiC('');
      setOpsiD('');
      fetchSoal(paketAktif.id);
    } else {
      alert('Gagal menyimpan soal.');
    }
  };

  const handleHapusSoal = async (id) => {
    if (window.confirm('Hapus soal ini?')) {
      await supabase.from('soal').delete().eq('id', id);
      fetchSoal(paketAktif.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex">
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
            <Link to="/admin/dashboard" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm"><span>📊</span><span>Dashboard</span></Link>
            <Link to="/admin/bank-soal" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-[#774ECA] text-white font-medium text-sm"><span>📁</span><span>Bank Soal</span></Link>
            <Link to="/admin/sesi-ujian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm"><span>🕒</span><span>Sesi Ujian</span></Link>
            <Link to="/admin/penilaian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm"><span>⭐</span><span>Penilaian</span></Link>
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
          <div className="text-xs text-purple-300"><p>ELCRIT CBT v1.0</p></div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Bank Soal & Paket</h1>
          
          {/* Header Profil Dinamis */}
          <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#5E35B1] text-white flex items-center justify-center font-bold text-sm">
              {adminName ? adminName.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">{adminName}</p>
              <p className="text-[10px] text-gray-500">Admin</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit space-y-4">
            <h2 className="text-sm font-bold text-gray-800">Daftar Paket Ujian</h2>
            
            <div className="space-y-2">
              {daftarPaket.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada paket soal.</p>
              ) : (
                daftarPaket.map((paket) => (
                  <div 
                    key={paket.id} 
                    className={`p-3 rounded-lg border flex justify-between items-center transition cursor-pointer ${paketAktif?.id === paket.id ? 'bg-purple-50 border-[#5E35B1]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <span onClick={() => handlePilihPaket(paket)} className="font-semibold text-xs text-gray-700 flex-1">{paket.nama_paket}</span>
                    <button onClick={() => handleHapusPaket(paket.id)} className="text-red-500 hover:text-red-700 text-xs p-1">🗑️</button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleTambahPaket} className="pt-4 border-t border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-800">+ Tambah Paket Baru</h3>
              <input 
                type="text" 
                required
                value={namaPaketBaru}
                onChange={(e) => setNamaPaketBaru(e.target.value)}
                placeholder="Nama Paket (cth: Paket C)" 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
              />
              <input 
                type="text" 
                value={penjelasanBaru}
                onChange={(e) => setPenjelasanBaru(e.target.value)}
                placeholder="Penjelasan Singkat Paket" 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
              />
              <input 
                type="text" 
                value={linkVideoBaru}
                onChange={(e) => setLinkVideoBaru(e.target.value)}
                placeholder="Link Video Embed YouTube" 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
              />
              <button type="submit" className="w-full bg-[#5E35B1] hover:bg-[#4b2a8e] text-white py-2 rounded-lg text-xs font-semibold shadow-sm transition">
                Simpan Paket
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {paketAktif ? (
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-bold text-gray-800">Kelola Paket: {paketAktif.nama_paket}</h2>
                      <p className="text-xs text-gray-400">{paketAktif.penjelasan || 'Atur video analisis dan soal ujian'}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditingVideo(!isEditingVideo)}
                      className="text-xs bg-purple-100 text-[#5E35B1] px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition"
                    >
                      {isEditingVideo ? 'Tutup Edit Video' : '⚙️ Ubah Link Video'}
                    </button>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
                    <p className="font-semibold text-gray-700">Link Video Saat Ini:</p>
                    <p className="font-mono text-gray-500 truncate">{paketAktif.link_video || 'Belum ada link video yang diatur.'}</p>
                    
                    {isEditingVideo && (
                      <form onSubmit={handleUpdateVideo} className="pt-2 flex space-x-2">
                        <input 
                          type="text" 
                          required
                          value={editVideoInput}
                          onChange={(e) => setEditVideoInput(e.target.value)}
                          placeholder="Masukkan link embed YouTube baru..."
                          className="flex-1 p-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                        />
                        <button type="submit" className="bg-[#5E35B1] text-white px-4 py-2 rounded-lg font-semibold">Simpan</button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800">Daftar Soal dalam Paket Ini</h3>
                    <div className="space-x-2">
                      <button 
                        onClick={() => { setTipeSoalBaru('pg'); setModalOpen(true); }} 
                        className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        + PG
                      </button>
                      <button 
                        onClick={() => { setTipeSoalBaru('uraian'); setModalOpen(true); }} 
                        className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        + Uraian
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {daftarSoal.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">Belum ada soal pada paket ini. Silakan tambahkan soal.</p>
                    ) : (
                      daftarSoal.map((soal, idx) => (
                        <div key={soal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold bg-purple-100 text-[#5E35B1] px-2 py-0.5 rounded uppercase">
                              {soal.tipe_soal}
                            </span>
                            <p className="text-xs font-semibold text-gray-800 mt-2">
                              {idx + 1}. {soal.pertanyaan}
                            </p>
                            {soal.tipe_soal === 'pg' && (
                              <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-gray-600">
                                <p>A. {soal.opsi_a}</p>
                                <p>B. {soal.opsi_b}</p>
                                <p>C. {soal.opsi_c}</p>
                                <p>D. {soal.opsi_d}</p>
                              </div>
                            )}
                          </div>
                          <button onClick={() => handleHapusSoal(soal.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs">🗑️</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center py-12 bg-white rounded-xl">Pilih paket di sebelah kiri terlebih dahulu.</p>
            )}
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-gray-800 text-base">Tambah Soal {tipeSoalBaru === 'pg' ? 'Pilihan Ganda' : 'Uraian'}</h3>
              
              <form onSubmit={handleSimpanSoal} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pertanyaan Soal</label>
                  <textarea 
                    rows="3"
                    required
                    value={pertanyaanBaru}
                    onChange={(e) => setPertanyaanBaru(e.target.value)}
                    placeholder="Tuliskan pertanyaan analisis..."
                    className="w-full p-2.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                  ></textarea>
                </div>

                {tipeSoalBaru === 'pg' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required value={opsiA} onChange={(e) => setOpsiA(e.target.value)} placeholder="Opsi A" className="p-2 border rounded-lg text-xs" />
                    <input type="text" required value={opsiB} onChange={(e) => setOpsiB(e.target.value)} placeholder="Opsi B" className="p-2 border rounded-lg text-xs" />
                    <input type="text" required value={opsiC} onChange={(e) => setOpsiC(e.target.value)} placeholder="Opsi C" className="p-2 border rounded-lg text-xs" />
                    <input type="text" required value={opsiD} onChange={(e) => setOpsiD(e.target.value)} placeholder="Opsi D" className="p-2 border rounded-lg text-xs" />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-[#5E35B1] text-white rounded-lg text-xs font-semibold">Simpan Soal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}