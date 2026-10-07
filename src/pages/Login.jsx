import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('nim_username', username.trim())
        .eq('password', password.trim())
        .single();

      if (error || !data) {
        setErrorMessage('ID atau Password salah!');
        setLoading(false);
        return;
      }

      // Update status_aktivitas menjadi 'online' jika yang login adalah peserta
      if (data.role === 'peserta') {
        await supabase
          .from('users')
          .update({ status_aktivitas: 'online' })
          .eq('id', data.id);
      }

      localStorage.setItem('user_cbt', JSON.stringify(data));

      // Redirect berdasarkan role dari database
      if (data.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.role === 'pengawas') {
        navigate('/pengawas/dashboard');
      } else {
        navigate('/peserta/dashboard');
      }

    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan pada sistem koneksi database.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#5E35B1] rounded-full flex items-center justify-center mb-4 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-wider">ELCRIT</h1>
          <p className="text-xs text-gray-500 mt-1">EFL Literary Response–Based Critical Thinking Test</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ID</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan ID Anda" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E35B1] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E35B1] text-sm"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-semibold text-center">
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#5E35B1] hover:bg-[#4b2a8e] text-white font-semibold py-2.5 px-4 rounded-md transition duration-200 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Memeriksa Database...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}