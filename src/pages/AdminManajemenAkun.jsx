import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminManajemenAkun() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [daftarUser, setDaftarUser] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nimUsername, setNimUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleUser, setRoleUser] = useState('peserta');
  const [showPassword, setShowPassword] = useState(false);

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
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['peserta', 'pengawas'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Gagal memuat users:", error);
    } else if (data) {
      setDaftarUser(data);
    }
  };

  const handleBukaModalTambah = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setNamaLengkap('');
    setNimUsername('');
    setRoleUser('peserta');
    setPassword('123456');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleBukaModalEdit = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setNamaLengkap(user.nama_lengkap);
    setNimUsername(user.nim_username);
    setPassword(user.password);
    setRoleUser(user.role || 'peserta');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSimpanUser = async (e) => {
    e.preventDefault();

    if (!namaLengkap || !nimUsername || !password) {
      alert('Nama lengkap, NIM/Username, dan Password wajib diisi!');
      return;
    }

    if (isEditMode) {
      const { error } = await supabase
        .from('users')
        .update({
          nama_lengkap: namaLengkap,
          nim_username: nimUsername,
          password: password,
          role: roleUser
        })
        .eq('id', selectedUserId);

      if (error) {
        alert('Gagal mengupdate akun: ' + error.message);
      } else {
        alert('Akun berhasil diperbarui!');
        setModalOpen(false);
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from('users')
        .insert([{
          nama_lengkap: namaLengkap,
          nim_username: nimUsername,
          password: password,
          role: roleUser,
          status_aktivitas: 'offline'
        }]);

      if (error) {
        alert('Gagal membuat akun: ' + error.message);
      } else {
        alert(`Akun berhasil dibuat!\nRole: ${roleUser.toUpperCase()}\nNIM/Username: ${nimUsername}\nPassword: ${password}`);
        setModalOpen(false);
        fetchUsers();
      }
    }
  };

  const handleDeleteUser = async (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun "${nama}"?`)) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Gagal menghapus akun: ' + error.message);
      } else {
        alert('Akun berhasil dihapus.');
        fetchUsers();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_cbt');
    navigate('/');
  };

  const filteredUser = daftarUser.filter(u => 
    u.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nim_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Link to="/admin/sesi-ujian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>🕒</span>
              <span>Sesi Ujian</span>
            </Link>
            <Link to="/admin/penilaian" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-purple-100 hover:bg-white/10 transition text-sm">
              <span>⭐</span>
              <span>Penilaian</span>
            </Link>
            <Link to="/admin/manajemen-akun" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-[#774ECA] text-white font-medium text-sm">
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
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Akun Pengguna</h1>
            <p className="text-xs text-gray-400">Kelola akun Peserta Ujian dan Pengawas Ruangan</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBukaModalTambah}
              className="bg-[#5E35B1] hover:bg-[#4b2a8e] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <span>➕</span>
              <span>Tambah Akun Baru</span>
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Daftar Pengguna ({filteredUser.length})</h2>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari nama atau NIM..."
              className="w-72 p-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-3">No</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">NIM / Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Password</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredUser.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">Belum ada akun terdaftar.</td>
                  </tr>
                ) : (
                  filteredUser.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-purple-50/50 transition">
                      <td className="p-3 font-medium">{idx + 1}</td>
                      <td className="p-3 font-bold text-gray-800">{user.nama_lengkap}</td>
                      <td className="p-3 font-mono text-[#5E35B1] font-semibold">{user.nim_username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'pengawas' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-[#5E35B1]'}`}>
                          {user.role || 'peserta'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-400">••••••••</td>
                      <td className="p-3 text-center space-x-2">
                        <button 
                          onClick={() => handleBukaModalEdit(user)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.nama_lengkap)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold transition"
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
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-800 text-base">
                  {isEditMode ? 'Edit Akun' : 'Tambah Akun Baru'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleSimpanUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Peran / Role</label>
                  <select 
                    value={roleUser}
                    onChange={(e) => setRoleUser(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1] bg-white font-semibold"
                  >
                    <option value="peserta">Peserta Ujian (Mahasiswa)</option>
                    <option value="pengawas">Pengawas Ruangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {roleUser === 'peserta' ? 'NIM Mahasiswa' : 'Username Login'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={nimUsername}
                    onChange={(e) => setNimUsername(e.target.value)}
                    placeholder={roleUser === 'peserta' ? 'Contoh: 2026001' : 'Contoh: pengawas01'}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono font-bold text-[#5E35B1] outline-none focus:ring-2 focus:ring-[#5E35B1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full p-2.5 pr-20 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5E35B1]"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-xs font-semibold text-[#5E35B1] hover:underline"
                    >
                      {showPassword ? "Sembunyikan" : "Lihat"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3">
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="py-2.5 bg-[#5E35B1] hover:bg-[#4b2a8e] text-white rounded-xl text-xs font-semibold transition shadow-md"
                  >
                    Simpan Akun
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