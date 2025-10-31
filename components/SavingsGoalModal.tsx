import React, { useState, useEffect, useRef } from 'react';
import { SavingsGoal } from '../types';
import { CameraIcon } from './icons';

interface SavingsGoalModalProps {
  onSave: (goal: SavingsGoal) => void;
  onCancel: () => void;
  existingGoal: SavingsGoal | null;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({ onSave, onCancel, existingGoal }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (existingGoal) {
      setName(existingGoal.name);
      setTargetAmount(existingGoal.targetAmount.toString());
      setImagePreview(existingGoal.imageUrl || null);
    }
  }, [existingGoal]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(targetAmount);

    if (!name.trim()) {
      setError('Vui lòng nhập tên mục tiêu.');
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Số tiền mục tiêu không hợp lệ.');
      return;
    }
    setError('');
    onSave({ name, targetAmount: numericAmount, imageUrl: imagePreview || undefined });
  };

  const handleDelete = () => {
    // Pass an "empty" goal to signal deletion
    onSave({ name: '', targetAmount: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-6 text-center">{existingGoal ? 'Chỉnh sửa' : 'Đặt'} Mục tiêu Tiết kiệm</h2>
        <form onSubmit={handleSave} className="space-y-4">
        
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ảnh đại diện mục tiêu</label>
            <div className="mt-2 flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover" />
                    ) : (
                        <CameraIcon className="w-8 h-8 text-gray-500" />
                    )}
                </div>
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                    >
                        Tải ảnh lên
                    </button>
                     {imagePreview && (
                        <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="text-red-400 hover:text-red-300 text-xs mt-2"
                        >
                            Xóa ảnh
                        </button>
                     )}
                </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium text-gray-300">Tên mục tiêu</label>
            <input
              type="text"
              id="goalName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Mua Macbook Pro mới"
              className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-300">Số tiền mục tiêu (VND)</label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0"
              className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Lưu
            </button>
          </div>
           {existingGoal && (
                <button
                type="button"
                onClick={handleDelete}
                className="w-full text-center text-red-400 hover:text-red-300 text-sm mt-2"
                >
                Xóa mục tiêu
                </button>
            )}
        </form>
      </div>
    </div>
  );
};