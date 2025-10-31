import React, { useState } from 'react';
import { Transaction, RecurringTransaction, TransactionType } from '../types';
import { ArrowPathIcon } from './icons';

interface SetupRecurringTransactionModalProps {
  templateTransaction: Transaction;
  onSave: (config: Omit<RecurringTransaction, 'id'>) => void;
  onCancel: () => void;
}

const getNextDueDate = (startDate: Date, frequency: 'daily' | 'weekly' | 'monthly'): Date => {
  const now = new Date();
  let nextDate = new Date(startDate);
  
  if (nextDate < now) {
    switch (frequency) {
        case 'daily':
            const daysDiff = Math.ceil((now.getTime() - nextDate.getTime()) / (1000 * 3600 * 24));
            nextDate.setDate(nextDate.getDate() + daysDiff);
            break;
        case 'weekly':
            const weeksDiff = Math.ceil((now.getTime() - nextDate.getTime()) / (1000 * 3600 * 24 * 7));
            nextDate.setDate(nextDate.getDate() + weeksDiff * 7);
            break;
        case 'monthly':
             const monthDiff = (now.getFullYear() - nextDate.getFullYear()) * 12 + (now.getMonth() - nextDate.getMonth());
             if(now.getDate() > nextDate.getDate()){
                 nextDate.setMonth(nextDate.getMonth() + monthDiff + 1);
             } else {
                 nextDate.setMonth(nextDate.getMonth() + monthDiff);
             }
             if (nextDate < now) { // Final check if we are still behind
                 nextDate.setMonth(nextDate.getMonth() + 1);
             }
            break;
    }
  }
  
  return nextDate;
};


export const SetupRecurringTransactionModal: React.FC<SetupRecurringTransactionModalProps> = ({ templateTransaction, onSave, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
        setError('Vui lòng chọn ngày bắt đầu.');
        return;
    }
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (end && end < start) {
        setError('Ngày kết thúc không thể trước ngày bắt đầu.');
        return;
    }
    
    setError('');

    const nextDueDate = getNextDueDate(start, frequency);

    onSave({
        templateTransactionId: templateTransaction.id,
        frequency,
        startDate: start.toISOString(),
        endDate: end?.toISOString(),
        nextDueDate: nextDueDate.toISOString(),
        isActive: true,
        amount: templateTransaction.amount,
        description: templateTransaction.description,
        recipient: templateTransaction.recipient,
        // FIX: Corrected the type assignment for recurring transactions.
        type: TransactionType.OUTGOING,
        category: templateTransaction.category,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-6 text-center">Thiết lập Giao dịch Định kỳ</h2>
        
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-400">Giao dịch mẫu:</p>
            <p className="font-semibold text-lg">{templateTransaction.description}</p>
            <p className="text-gray-300">Gửi tới: {templateTransaction.recipient}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-300">Tần suất</label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Ngày bắt đầu</label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today}
                      className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2.5 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                 <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">Ngày kết thúc (tùy chọn)</label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-2.5 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
                >
                  Lưu Lịch trình
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
