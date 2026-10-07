import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Ujian() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ nama_lengkap: 'Peserta Ujian', nim_username: '' });
  const [sesiAktif, setSesiAktif] = useState(null);
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [jawaban, setJawaban] = useState({});
  const [sisaWaktu, setSisaWaktu] = useState(60 * 60);
  const [loading, setLoading] = useState(true);
  const [modalKonfirmasi, setModalKonfirmasi] = useState(false);
  const [peringatanKeluar, setPeringatanKeluar] = useState(false);
  const [jumlahPeringatan, setJumlahPeringatan] = useState(0);
  const [isZoomVideo, setIsZoomVideo] = useState(false);

  const sesiAktifRef = useRef(null);
  const daftarSoalRef = useRef([]);
  const jawabanRef = useRef({});
  const userRef = useRef({});

  const isBlockingRef = useRef(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    const storedSesi = localStorage.getItem('sesi_ujian_aktif');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      userRef.current = parsedUser;

      // Update status aktivitas peserta menjadi 'proses' saat mulai ujian
      if (parsedUser.id) {
        supabase
          .from('users')
          .update({ status_aktivitas: 'proses' })
          .eq('id', parsedUser.id);
      }
    }
    if (storedSesi) {
      const sesi = JSON.parse(storedSesi);
      setSesiAktif(sesi);
      sesiAktifRef.current = sesi;
      const durasiMenit = sesi.durasi_menit || 60;
      setSisaWaktu(durasiMenit * 60);

      fetchSoalDanPaket(sesi.paket_id);
    } else {
      navigate('/peserta/dashboard');
    }

    const requestLockFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    requestLockFullscreen();

    const catatPelanggaran = (alasan) => {
      if (isBlockingRef.current) return;
      isBlockingRef.current = true;

      setJumlahPeringatan(prev => {
        const nextCount = prev + 1;
        if (nextCount >= 3) {
          alert(`Peringatan Keras! Anda terdeteksi melakukan pelanggaran (${alasan}) sebanyak 3 kali. Ujian Anda akan diserahkan otomatis.`);
          simpanHasilKeDatabaseDirect();
        } else {
          setPeringatanKeluar(true);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        catatPelanggaran('pindah tab / minimize');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        catatPelanggaran('keluar dari mode layar penuh / split screen');
      }
    };

    const handleResize = () => {
      const isSplit = window.innerWidth < window.screen.width * 0.95 || window.innerHeight < window.screen.height * 0.95;
      if (isSplit && !document.fullscreenElement) {
        catatPelanggaran('membagi layar / split screen');
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        e.key === 'Escape' ||
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 't' || e.key === 'w' || e.key === 'r' || e.key === 'n')) ||
        e.altKey ||
        e.metaKey
      ) {
        e.preventDefault();
        catatPelanggaran('menekan tombol pintasan dilarang');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  useEffect(() => {
    daftarSoalRef.current = daftarSoal;
  }, [daftarSoal]);

  useEffect(() => {
    jawabanRef.current = jawaban;
  }, [jawaban]);

  useEffect(() => {
    if (sisaWaktu <= 0) {
      handleKirimUjianOtomatis();
      return;
    }
    const timer = setInterval(() => {
      setSisaWaktu(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sisaWaktu]);

  const fetchSoalDanPaket = async (paketId) => {
    const { data, error } = await supabase
      .from('soal')
      .select('*')
      .eq('paket_id', paketId)
      .order('nomor_soal', { ascending: true });

    if (!error && data) {
      setDaftarSoal(data);
      daftarSoalRef.current = data;
    }
    setLoading(false);
  };

  const formatWaktu = (detik) => {
    const m = Math.floor(detik / 60);
    const s = detik % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getEmbedUrl = (url) => {
    if (!url) return "https://www.youtube.com/embed/dQw4w9WgXcQ";
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1]?.split('&')[0];
      } else if (url.includes('embed/')) {
        return url;
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('drive.google.com')) {
      let fileId = '';
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1]?.split('/')[0];
      } else if (url.includes('id=')) {
        fileId = url.split('id=')[1]?.split('&')[0];
      }
      if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const handlePilihJawaban = (soalId, val) => {
    setJawaban(prev => ({ ...prev, [soalId]: val }));
  };

  const handleKirimUjianOtomatis = async () => {
    alert('Waktu ujian telah habis! Jawaban Anda akan dikirim otomatis oleh sistem.');
    await simpanHasilKeDatabaseDirect();
  };

  const simpanHasilKeDatabaseDirect = async () => {
    const activeSesi = sesiAktifRef.current || sesiAktif;
    const activeUser = userRef.current || user;
    const activeSoal = daftarSoalRef.current;
    const activeJawaban = jawabanRef.current;

    if (!activeSesi) {
      alert('Sesi ujian tidak ditemukan!');
      return;
    }

    try {
      const dataJawabanPg = {};
      const dataJawabanUraian = {};

      activeSoal.forEach((soal) => {
        const jawabPeserta = activeJawaban[soal.id];
        if (jawabPeserta !== undefined && jawabPeserta !== '') {
          if (soal.tipe_soal === 'pg') {
            dataJawabanPg[soal.id] = jawabPeserta.toLowerCase();
          } else if (soal.tipe_soal === 'uraian') {
            dataJawabanUraian[soal.id] = jawabPeserta;
          }
        }
      });

      const waktuSelesaiStr = new Date().toISOString();

      const payload = {
        paket_id: activeSesi.paket_id,
        nilai_pg: 0,
        nilai_uraian: 0,
        total_nilai: 0,
        jawaban_pg: dataJawabanPg,
        jawaban_uraian: JSON.stringify(dataJawabanUraian),
        status: 'Menunggu',
        waktu_selesai: waktuSelesaiStr
      };

      if (activeSesi.id) payload.sesi_id = activeSesi.id;
      if (activeUser && activeUser.id) payload.user_id = activeUser.id;

      const { error } = await supabase.from('hasil_ujian').insert([payload]);

      if (error) {
        console.error('Error Supabase detail:', error);
        if (error.code === '23503' || error.message.includes('foreign key constraint')) {
          delete payload.user_id;
          const retry = await supabase.from('hasil_ujian').insert([payload]);
          if (retry.error) {
            alert(`Gagal menyimpan ke database: ${retry.error.message}`);
            return;
          }
        } else {
          alert(`Gagal menyerahkan ujian: ${error.message}`);
          return;
        }
      }

      // Update status_aktivitas peserta menjadi 'selesai' setelah ujian diserahkan
      if (activeUser && activeUser.id) {
        await supabase
          .from('users')
          .update({ status_aktivitas: 'selesai' })
          .eq('id', activeUser.id);
      }

      const sekarang = new Date();
      const tgl = String(sekarang.getDate()).padStart(2, '0');
      const bln = String(sekarang.getMonth() + 1).padStart(2, '0');
      const thn = sekarang.getFullYear();
      const jam = String(sekarang.getHours()).padStart(2, '0');
      const menit = String(sekarang.getMinutes()).padStart(2, '0');
      const waktuFormatted = `${tgl}-${bln}-${thn} pukul ${jam}.${menit} WIB`;

      const dataSelesai = {
        nama_paket: activeSesi?.paket_soal?.nama_paket || activeSesi?.nama_paket || 'Paket Ujian',
        nama_lengkap: activeUser.nama_lengkap || 'Peserta Ujian',
        nim_username: activeUser.nim_username || '-',
        waktu_selesai: waktuFormatted
      };
      localStorage.setItem('ringkasan_selesai_ujian', JSON.stringify(dataSelesai));

      localStorage.removeItem('sesi_ujian_aktif');
      setModalKonfirmasi(false);
      navigate('/peserta/selesai-ujian');

    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Terjadi kesalahan sistem saat menyerahkan ujian.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] text-xs text-gray-500">Memuat lembar ujian...</div>;
  }

  const soalAktif = daftarSoal[currentIndex];
  const isSoalTerakhir = currentIndex === daftarSoal.length - 1;

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col select-none relative">
      <header className="bg-[#5E35B1] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <span className="font-bold tracking-wider text-lg text-white">ELCRIT</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-white/10 px-4 py-1.5 rounded-xl border border-white/10 text-center">
            <p className="text-[10px] text-purple-200">Sisa Waktu Ujian</p>
            <p className="text-sm font-mono font-bold text-white">{formatWaktu(sisaWaktu)}</p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <div className="w-7 h-7 rounded-full bg-white text-[#5E35B1] flex items-center justify-center font-bold text-xs">
              {user.nama_lengkap ? user.nama_lengkap.substring(0, 2).toUpperCase() : 'BU'}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user.nama_lengkap}</p>
              <p className="text-[10px] text-purple-200">ID: {user.nim_username}</p>
            </div>
          </div>

          <button 
            onClick={() => setModalKonfirmasi(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition border border-red-400 flex items-center space-x-1"
          >
            <span>Selesai Ujian</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-fit space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-gray-700 flex items-center space-x-1">
              <span>🎥</span>
              <span>Video Analisis Penelitian:</span>
            </p>
            <button
              type="button"
              onClick={() => setIsZoomVideo(true)}
              className="text-xs bg-purple-100 hover:bg-purple-200 text-[#5E35B1] font-semibold px-3 py-1.5 rounded-lg transition"
            >
              🔍 Perbesar Video
            </button>
          </div>

          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner">
            <iframe 
              src={getEmbedUrl(sesiAktif?.paket_soal?.link_video)} 
              title="Video Penelitian" 
              className="w-full h-full border-0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {daftarSoal.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center text-gray-400 text-xs shadow-sm">
              Belum ada soal pada paket ini.
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs font-bold bg-purple-100 text-[#5E35B1] px-3 py-1 rounded-lg uppercase">
                  Soal No. {currentIndex + 1} / {daftarSoal.length} ({soalAktif?.tipe_soal})
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-gray-800 leading-relaxed">
                  {soalAktif?.pertanyaan}
                </h2>

                {soalAktif?.tipe_soal === 'pg' && (
                  <div className="space-y-2 pt-1">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const teksOpsi = soalAktif[`opsi_${opt.toLowerCase()}`];
                      if (!teksOpsi) return null;
                      const isSelected = jawaban[soalAktif.id] === opt;
                      return (
                        <div 
                          key={opt}
                          onClick={() => handlePilihJawaban(soalAktif.id, opt)}
                          className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'bg-purple-50 border-[#5E35B1] text-[#5E35B1] font-semibold' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-[#5E35B1] text-white' : 'bg-gray-200 text-gray-700'}`}>{opt}</span>
                          <span className="text-xs">{teksOpsi}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {soalAktif?.tipe_soal === 'uraian' && (
                  <div className="pt-1">
                    <textarea 
                      rows="5"
                      value={jawaban[soalAktif.id] || ''}
                      onChange={(e) => handlePilihJawaban(soalAktif.id, e.target.value)}
                      placeholder="Tuliskan jawaban analisis Anda di sini..."
                      className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                    ></textarea>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button 
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-40 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  &lt; Sebelumnya
                </button>

                {isSoalTerakhir ? (
                  <button 
                    onClick={() => setModalKonfirmasi(true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
                  >
                    Selesai Ujian
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-5 py-2 bg-[#5E35B1] hover:bg-[#4b2a8e] text-white rounded-xl text-xs font-semibold shadow-md transition"
                  >
                    Selanjutnya &gt;
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-3">Navigasi Nomor Soal:</p>
            <div className="flex flex-wrap gap-2">
              {daftarSoal.map((soal, idx) => {
                const isTerjawab = jawaban[soal.id] && jawaban[soal.id].trim() !== '';
                const isAktif = currentIndex === idx;

                let styleKelas = "bg-gray-100 text-gray-600 border-gray-200";
                
                if (isAktif) {
                  styleKelas = "bg-[#5E35B1] text-white border-[#5E35B1] ring-2 ring-purple-300 font-bold";
                } else if (isTerjawab) {
                  styleKelas = "bg-green-500 text-white border-green-600 font-bold shadow-sm";
                }

                return (
                  <button
                    key={soal.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-9 h-9 rounded-xl border text-xs transition flex items-center justify-center ${styleKelas}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* POPUP MODAL / OVERLAY ZOOM VIDEO */}
      {isZoomVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-gray-800 flex justify-between items-center border-b border-gray-700">
              <span className="text-white text-xs font-bold">Mode Tampilan Luas Video Stimulus</span>
              <button
                onClick={() => setIsZoomVideo(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                ✕ Kembalikan / Kecilkan
              </button>
            </div>
            <div className="w-full h-[70vh] bg-black">
              <iframe
                src={getEmbedUrl(sesiAktif?.paket_soal?.link_video)}
                className="w-full h-full border-0"
                allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Video Stimulus Perbesar"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* LAYAR BLOKIR TOTAL (CURTAIN) JIKA KELUAR TAB ATAU SPLIT SCREEN */}
      {peringatanKeluar && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-5 text-center animate-bounce-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">🚨</div>
            <h3 className="font-bold text-gray-800 text-lg">Peringatan Pelanggaran Ujian!</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Anda terdeteksi melakukan pelanggaran (keluar Fullscreen / split-screen / pindah tab). Ini adalah pelanggaran ke-<strong>{jumlahPeringatan}</strong> dari batas maksimal 3 kali. Jika mencapai 3 kali, ujian Anda akan otomatis diserahkan ke sistem!
            </p>
            <button 
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
                isBlockingRef.current = false;
                setPeringatanKeluar(false);
              }}
              className="w-full py-3 bg-[#5E35B1] hover:bg-[#4b2a8e] text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              Saya Mengerti & Kembali ke Layar Penuh (Fullscreen)
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai Ujian */}
      {modalKonfirmasi && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
            <h3 className="font-bold text-gray-800 text-base">Konfirmasi Akhir Ujian</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri ujian dan menyerahkan seluruh jawaban? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setModalKonfirmasi(false)}
                className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                Periksa Lagi
              </button>
              <button 
                onClick={simpanHasilKeDatabaseDirect}
                className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition shadow-md"
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}