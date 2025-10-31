import React, { useState } from 'react';

interface CreateWalletFormProps {
  onCreateWallet: (name: string, gender: 'Nam' | 'Nữ' | 'Khác', avatarUrl: string) => void;
}

const avatars = [
  'adventurer', 'avataaars', 'big-ears', 'big-smile', 
  'bottts', 'croodles', 'fun-emoji', 'micah', 'miniavs',
  'open-peeps', 'personas', 'pixel-art'
].map(seed => `https://api.dicebear.com/8.x/${seed}/svg?seed=${Math.random()}`);


export const CreateWalletForm: React.FC<CreateWalletFormProps> = ({ onCreateWallet }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!selectedAvatar) {
      setError('Vui lòng chọn một ảnh đại diện.');
      return;
    }
    setError('');
    onCreateWallet(name, gender, selectedAvatar);
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-lg shadow-lg animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center mb-2">Tạo Ví Mới</h1>
        <p className="text-center text-gray-400 mb-8">Bắt đầu hành trình tài chính của bạn.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chọn ảnh đại diện
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {avatars.map(avatar => (
                <img
                  key={avatar}
                  src={avatar}
                  alt="Avatar"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-16 h-16 rounded-full cursor-pointer transition-transform transform hover:scale-110 ${selectedAvatar === avatar ? 'ring-4 ring-primary-500' : 'ring-2 ring-gray-600'}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Họ và Tên
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="NGUYEN VAN A"
              className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500 transition"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
              Giới tính
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ' | 'Khác')}
              className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500 transition"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Tạo Ví
          </button>
        </form>
      </div>
    </div>
  );
};