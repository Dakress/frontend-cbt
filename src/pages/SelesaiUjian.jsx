import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SelesaiUjian() {
  const [ringkasan, setRingkasan] = useState(null);

  useEffect(() => {
    const storedRingkasan = localStorage.getItem('ringkasan_selesai_ujian');
    const storedUser = localStorage.getItem('user_cbt');

    if (storedRingkasan) {
      setRingkasan(JSON.parse(storedRingkasan));
    } else {
      const user = storedUser ? JSON.parse(storedUser) : {};
      
      const sekarang = new Date();
      const tgl = String(sekarang.getDate()).padStart(2, '0');
      const bln = String(sekarang.getMonth() + 1).padStart(2, '0');
      const thn = sekarang.getFullYear();
      const jam = String(sekarang.getHours()).padStart(2, '0');
      const menit = String(sekarang.getMinutes()).padStart(2, '0');
      
      setRingkasan({
        nama_paket: 'Paket Ujian',
        nama_lengkap: user.nama_lengkap || '-',
        nim_username: user.nim_username || '-',
        waktu_selesai: `${tgl}-${bln}-${thn} pukul ${jam}.${menit} WIB`
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8 text-center">
        {/* Ikon Centang Ungu */}
        <div className="w-20 h-20 bg-[#5E35B1] text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-md">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Terima Kasih!</h1>
        <p className="text-xs text-gray-500 mb-6">Jawaban Anda telah direkam dengan baik.</p>

        {/* Kotak Ringkasan */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-left space-y-3 mb-6">
          <h3 className="font-bold text-gray-800 text-sm border-b border-gray-200 pb-2">
            {ringkasan?.nama_paket || 'Paket Ujian'}
          </h3>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Nama</span>
              <span className="font-semibold text-gray-800">{ringkasan?.nama_lengkap || '-'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">ID</span>
              <span className="font-semibold text-gray-800">{ringkasan?.nim_username || '-'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-500">Waktu Selesai</span>
              <span className="font-semibold text-gray-800">{ringkasan?.waktu_selesai || '-'}</span>
            </div>
          </div>
        </div>

        <Link 
          to="/peserta/dashboard" 
          className="block w-full bg-[#5E35B1] hover:bg-[#4b2a8e] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}