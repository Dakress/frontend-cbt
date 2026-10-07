import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminPenilaian() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [daftarHasil, setDaftarHasil] = useState([]);
  const [hasilAktif, setHasilAktif] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  const [daftarSoalPaket, setDaftarSoalPaket] = useState([]);
  const [nilaiPerSoal, setNilaiPerSoal] = useState({});

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
    fetchHasilUjian();
  }, [navigate]);

  const fetchHasilUjian = async () => {
    const { data, error } = await supabase
      .from('hasil_ujian')
      .select('*, users(nama_lengkap, nim_username), paket_soal(id, nama_paket)')
      .order('waktu_selesai', { ascending: false });

    if (error) {
      console.error("Error Fetch Supabase:", error);
      alert("Terjadi kesalahan saat memuat data dari database.");
    } else if (data) {
      setDaftarHasil(data);
      if (data.length > 0 && !hasilAktif) {
        handlePilihPeserta(data[0]);
      } else if (hasilAktif) {
        // Pertahankan peserta aktif yang sedang dipilih saat refresh data
        const updatedActive = data.find(item => item.id === hasilAktif.id);
        if (updatedActive) setHasilAktif(updatedActive);
      }
    }
  };

  const fetchSoalByPaket = async (paketId, currentHasilItem) => {
    const { data, error } = await supabase
      .from('soal')
      .select('*')
      .eq('paket_id', paketId)
      .order('nomor_soal', { ascending: true });

    if (!error && data) {
      setDaftarSoalPaket(data);
      
      // Inisialisasi nilai: Jika sudah pernah dinilai/tersimpan, ambil dari total atau set 0
      const inisialNilai = {};
      data.forEach(soal => {
        // Default 0 jika belum ada rincian tersimpan
        inisialNilai[soal.id] = 0;
      });
      setNilaiPerSoal(inisialNilai);
    }
  };

  const handlePilihPeserta = (item) => {
    setHasilAktif(item);
    if (item.paket_soal?.id) {
      fetchSoalByPaket(item.paket_soal.id, item);
    }
  };

  const handleUbahNilaiSoal = (idSoal, nilai) => {
    setNilaiPerSoal(prev => ({
      ...prev,
      [idSoal]: parseInt(nilai) || 0
    }));
  };

  const handleSimpanNilai = async () => {
    if (!hasilAktif) return;

    let totalPg = 0;
    let totalUraian = 0;

    daftarSoalPaket.forEach(soal => {
      const perolehan = nilaiPerSoal[soal.id] || 0;
      if (soal.tipe_soal === 'pg') {
        totalPg += perolehan;
      } else if (soal.tipe_soal === 'uraian') {
        totalUraian += perolehan;
      }
    });

    const totalAkhir = totalPg + totalUraian;

    const { error } = await supabase
      .from('hasil_ujian')
      .update({
        nilai_pg: totalPg,
        nilai_uraian: totalUraian,
        total_nilai: totalAkhir,
        status: 'Dinilai'
      })
      .eq('id', hasilAktif.id);

    if (!error) {
      alert(`Nilai berhasil disimpan ke Database!\nTotal PG: ${totalPg}\nTotal Uraian: ${totalUraian}\nNilai Akhir: ${totalAkhir}`);
      fetchHasilUjian();
    } else {
      console.error("Gagal simpan nilai:", error);
      alert('Gagal menyimpan nilai ke database.');
    }
  };

  const getJawabanPgPeserta = (soalId) => {
    if (!hasilAktif?.jawaban_pg) return '';
    try {
      let pgData = hasilAktif.jawaban_pg;
      if (typeof pgData === 'string') {
        pgData = JSON.parse(pgData);
      }
      return pgData[soalId] || '';
    } catch (e) {
      return '';
    }
  };

  const getJawabanUraianPeserta = (soalId) => {
    if (!hasilAktif?.jawaban_uraian) return '';
    try {
      let uraianData = hasilAktif.jawaban_uraian;
      if (typeof uraianData === 'string') {
        uraianData = JSON.parse(uraianData);
      }
      return uraianData[soalId] || '';
    } catch (e) {
      return hasilAktif.jawaban_uraian;
    }
  };

  const handleExportSemuaExcel = () => {
    if (daftarHasil.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    let csvContent = "\uFEFF";
    csvContent += "No;Nama Peserta;Paket Ujian;Total Nilai\r\n";

    daftarHasil.forEach((item, index) => {
      const nama = item.users?.nama_lengkap || '-';
      const paket = item.paket_soal?.nama_paket || '-';
      const nilai = item.total_nilai || 0;

      csvContent += `${index + 1};"${nama}";"${paket}";${nilai}\r\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Rekap_Nilai_Peserta.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPerAkunExcel = () => {
    if (!hasilAktif) {
      alert('Pilih akun peserta terlebih dahulu!');
      return;
    }

    let csvContent = "\uFEFF";
    csvContent += "Laporan Hasil Ujian Peserta\r\n";
    csvContent += `Nama Peserta;${hasilAktif.users?.nama_lengkap || '-'}\r\n`;
    csvContent += `NIM / Username;${hasilAktif.users?.nim_username || '-'}\r\n`;
    csvContent += `Paket Ujian;${hasilAktif.paket_soal?.nama_paket || '-'}\r\n`;
    csvContent += `Total Nilai Akhir;${hasilAktif.total_nilai || 0}\r\n\r\n`;
    
    csvContent += "No;Tipe Soal;Pertanyaan;Jawaban Peserta\r\n";

    daftarSoalPaket.forEach((soal, index) => {
      let jawabanDisplay = 'TIDAK MENJAWAB';

      if (soal.tipe_soal === 'pg') {
        const p = getJawabanPgPeserta(soal.id);
        if (p) jawabanDisplay = p.toUpperCase();
      } else if (soal.tipe_soal === 'uraian') {
        const u = getJawabanUraianPeserta(soal.id);
        if (u) jawabanDisplay = u;
      }
      
      const row = [
        index + 1,
        soal.tipe_soal.toUpperCase(),
        `"${soal.pertanyaan.replace(/"/g, '""')}"`,
        `"${jawabanDisplay.replace(/"/g, '""')}"`
      ];
      csvContent += row.join(";") + "\r\n";
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Detail_Nilai_${hasilAktif.users?.nama_lengkap || 'Peserta'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  const filteredHasil = daftarHasil.filter(item => {
    const nama = String(item.users?.nama_lengkap || '').toLowerCase();
    const nim = String(item.users?.nim_username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchSearch = nama.includes(query) || nim.includes(query);

    if (filterStatus === 'Semua') {
      return matchSearch;
    } else if (filterStatus === 'Menunggu') {
      return matchSearch && item.status !== 'Dinilai';
    } else if (filterStatus === 'Dinilai') {
      return matchSearch && item.status === 'Dinilai';
    }
    return matchSearch;
  });

  const hitungTotalRealtime = () => {
    return Object.values(nilaiPerSoal).reduce((acc, curr) => acc + curr, 0);
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
            <Link to="/admin/dashboard" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
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
            <Link to="/admin/penilaian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-[#774ECA] text-white font-medium text-sm">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Koreksi & Penilaian Ujian</h1>
            <p className="text-xs text-gray-400">Pilih akun peserta untuk memberikan nilai manual per soal secara terpisah</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleExportSemuaExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <span>📊</span>
              <span>Export Semua ke Excel</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit space-y-4">
            <h2 className="text-sm font-bold text-gray-800">Pilih Akun Peserta</h2>
            
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari nama atau NIM..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
            />

            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
              {['Semua', 'Menunggu', 'Dinilai'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`py-1.5 text-[11px] font-bold rounded-md transition ${filterStatus === status ? 'bg-[#5E35B1] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredHasil.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Tidak ada data peserta ditemukan.</p>
              ) : (
                filteredHasil.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handlePilihPeserta(item)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex justify-between items-center ${hasilAktif?.id === item.id ? 'bg-purple-50 border-[#5E35B1]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <div>
                      <h3 className="font-bold text-xs text-gray-800">{item.users?.nama_lengkap || 'Peserta'}</h3>
                      <p className="text-[10px] text-gray-500">NIM: {item.users?.nim_username || '-'} | {item.paket_soal?.nama_paket || 'Paket'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${item.status === 'Dinilai' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.status === 'Dinilai' ? 'Dinilai' : 'Menunggu'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            {hasilAktif ? (
              <>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 pt-2">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Menilai: {hasilAktif.users?.nama_lengkap} ({hasilAktif.users?.nim_username})</h2>
                    <p className="text-xs text-gray-400">Mengerjakan: {hasilAktif.paket_soal?.nama_paket} | Status: <span className="font-bold text-purple-600">{hasilAktif.status}</span> (Total Nilai Tersimpan: {hasilAktif.total_nilai || 0})</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={handleExportPerAkunExcel}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1"
                    >
                      <span>📥</span>
                      <span>Export Akun Ini</span>
                    </button>

                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total Realtime</p>
                      <p className="text-xl font-black text-[#5E35B1] leading-none">{hitungTotalRealtime()}</p>
                    </div>
                    <button onClick={handleSimpanNilai} className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition">
                      💾 Simpan Penilaian Akhir
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-bold text-gray-800">Lembar Jawaban Per Soal (Pilihan Ganda & Uraian)</h3>
                    <span className="text-[11px] bg-purple-50 text-[#5E35B1] px-2.5 py-1 rounded-lg font-medium">
                      💡 Berikan poin lalu klik "Simpan Penilaian Akhir" agar tersimpan permanen
                    </span>
                  </div>
                  
                  {daftarSoalPaket.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Tidak ada soal ditemukan pada paket ini.</p>
                  ) : (
                    daftarSoalPaket.map((soal, index) => {
                      const pilihanPgPeserta = getJawabanPgPeserta(soal.id);
                      const teksUraianPeserta = getJawabanUraianPeserta(soal.id);

                      return (
                        <div key={soal.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 hover:border-purple-300 transition">
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${soal.tipe_soal === 'pg' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {soal.tipe_soal === 'pg' ? 'Pilihan Ganda' : 'Uraian / Analisis'}
                              </span>
                              <span className="text-xs font-bold text-gray-700">Soal No. {index + 1}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <label className="text-[10px] font-bold text-gray-600">Poin / Nilai:</label>
                              <input 
                                type="number"
                                min="0"
                                value={nilaiPerSoal[soal.id] ?? 0}
                                onChange={(e) => handleUbahNilaiSoal(soal.id, e.target.value)}
                                className="w-20 p-1.5 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white outline-none focus:ring-2 focus:ring-[#5E35B1]"
                              />
                            </div>
                          </div>

                          <p className="text-xs text-gray-800 font-semibold">{soal.pertanyaan}</p>
                          
                          {soal.tipe_soal === 'pg' && (
                            <div className="space-y-2 pt-1">
                              <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600">
                                {['a', 'b', 'c', 'd'].map((opt) => {
                                  const isDipilihPeserta = pilihanPgPeserta === opt;
                                  return (
                                    <div 
                                      key={opt} 
                                      className={`p-1.5 rounded border ${isDipilihPeserta ? 'bg-purple-100 border-[#5E35B1] font-bold text-[#5E35B1]' : 'border-gray-200 bg-white'}`}
                                    >
                                      {opt.toUpperCase()}. {soal[`opsi_${opt}`]} {isDipilihPeserta && ' ✓ (Pilihan Peserta)'}
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-gray-500 italic">
                                * Jawaban peserta yang dipilih: <span className="font-bold uppercase text-[#5E35B1]">{pilihanPgPeserta || 'Tidak Menjawab'}</span>
                              </p>
                            </div>
                          )}

                          {soal.tipe_soal === 'uraian' && (
                            <div className="pt-1 space-y-1">
                              <p className="text-[10px] font-bold text-gray-600">Jawaban / Esai Peserta untuk soal ini:</p>
                              <div className="p-3 bg-white border border-yellow-300 rounded-lg text-xs text-gray-700 font-serif whitespace-pre-wrap">
                                {teksUraianPeserta || <span className="italic text-gray-400">Peserta tidak menuliskan jawaban untuk soal ini.</span>}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <span className="text-4xl mb-4">👈</span>
                <p className="text-sm font-medium">Pilih salah satu peserta di sebelah kiri</p>
                <p className="text-xs mt-1">untuk mulai memberikan penilaian manual per soal secara terpisah.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}