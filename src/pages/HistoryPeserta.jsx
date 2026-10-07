import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function HistoryPeserta() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ nama_lengkap: '', nim_username: '' });
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_cbt');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchHistory(parsed.id);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchHistory = async (userId) => {
    const { data, error } = await supabase
      .from('hasil_ujian')
      .select('*, paket_soal(nama_paket, penjelasan)')
      .eq('user_id', userId)
      .order('waktu_selesai', { ascending: false });

    if (!error && data) {
      setHistoryList(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="bg-[#5E35B1] text-white px-8 py-4 flex justify-between items-center shadow-md">
        {/* Perbaikan Logo dan Teks ELCRIT */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <span className="font-bold tracking-wider text-lg text-white">ELCRIT</span>
        </div>
        
        <Link to="/peserta/dashboard" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold transition border border-white/10">
          &lt; Kembali ke Dashboard
        </Link>
      </header>

      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Riwayat & Nilai Ujian</h1>
        <p className="text-xs text-gray-500 mb-8">Daftar paket ujian yang telah Anda selesaikan beserta rekap nilai dari penilai.</p>

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-10">Memuat riwayat...</p>
        ) : historyList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-gray-200 shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-gray-500 font-medium">Anda belum pernah menyelesaikan ujian apapun.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyList.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-bold text-gray-800 text-base">{item.paket_soal?.nama_paket || 'Paket Ujian'}</h3>
                    {/* Badge Status */}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${item.status === 'Dinilai' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.status === 'Dinilai' ? 'Dinilai' : 'Menunggu'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{item.paket_soal?.penjelasan}</p>
                  <p className="text-[10px] text-gray-500 font-medium bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-100">
                    Waktu Selesai: {new Date(item.waktu_selesai).toLocaleString('id-ID')}
                  </p>
                </div>
                
                <div className="text-right w-full md:w-auto flex flex-col md:items-end">
                  <span className="text-xs font-semibold text-gray-400 block mb-2">Total Nilai Akhir:</span>
                  <div className="flex items-center justify-between md:justify-end space-x-3 w-full">
                    {/* Breakdown Nilai */}
                    {item.status === 'Dinilai' && (
                      <div className="text-[10px] text-gray-400 text-right">
                        <p>PG: <span className="font-bold text-gray-600">{item.nilai_pg || 0}</span></p>
                        <p>Uraian: <span className="font-bold text-gray-600">{item.nilai_uraian || 0}</span></p>
                      </div>
                    )}
                    
                    {/* Skor Besar */}
                    {item.status === 'Dinilai' ? (
                      <span className="text-2xl font-black text-[#5E35B1] bg-purple-50 px-5 py-2.5 rounded-xl border border-purple-100 shadow-sm">
                        {item.total_nilai}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-gray-400 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100">
                        Diproses
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}