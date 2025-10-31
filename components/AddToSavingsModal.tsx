import React, { useState } from 'react';
import { CheckCircleIcon } from './icons';
import { Currency } from '../types';

interface AddToSavingsModalProps {
  onAdd: (amount: number) => void;
  onCancel: () => void;
  balance: number;
  goalName: string;
  currency: Currency;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

export const AddToSavingsModal: React.FC<AddToSavingsModalProps> = ({ onAdd, onCancel, balance, goalName, currency }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Số tiền không hợp lệ.');
      return;
    }
    if (numericAmount > balance) {
        setError('Số dư không đủ.');
        return;
    }
    setError('');
    onAdd(numericAmount);
    setIsSuccess(true);
  };

  const renderSuccessView = () => (
    <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="animate-scale-in">
             <CheckCircleIcon className="w-24 h-24 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mt-6">Thêm thành công!</h2>
        <p className="text-gray-400 mt-2">
            Đã thêm {formatCurrency(parseFloat(amount), currency)} vào mục tiêu "{goalName}".
        </p>
    </div>
  );

  const renderInputForm = () => (
    <>
      <h2 className="text-2xl font-bold mb-2 text-center">Thêm vào Tiết kiệm</h2>
      <p className="text-center text-gray-400 mb-6">Mục tiêu: {goalName}</p>
      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Số tiền cần thêm ({currency})</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">Số dư khả dụng: {formatCurrency(balance, currency)}</p>
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
            Thêm
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up">
        {isSuccess ? renderSuccessView() : renderInputForm()}
      </div>
    </div>
  );
};