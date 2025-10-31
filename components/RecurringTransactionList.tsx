import React from 'react';
import { RecurringTransaction, Currency } from '../types';
import { ArrowPathIcon, TrashIcon } from './icons';

interface RecurringTransactionListProps {
  recurringTransactions: RecurringTransaction[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  currency: Currency;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const getFrequencyText = (frequency: 'daily' | 'weekly' | 'monthly') => {
    switch (frequency) {
        case 'daily': return 'Hàng ngày';
        case 'weekly': return 'Hàng tuần';
        case 'monthly': return 'Hàng tháng';
    }
};

export const RecurringTransactionList: React.FC<RecurringTransactionListProps> = ({ recurringTransactions, onDelete, onToggleActive, currency }) => {
  if (recurringTransactions.length === 0) {
    return (
      <div className="text-center text-gray-500 p-8 bg-gray-800 rounded-lg animate-fade-in-up">
        <ArrowPathIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <h3 className="font-bold text-lg text-white">Chưa có giao dịch định kỳ nào</h3>
        <p className="mt-1">Bạn có thể thiết lập giao dịch định kỳ từ chi tiết của một giao dịch đã gửi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recurringTransactions.map((rt, index) => (
         <div
            key={rt.id}
            className={`bg-gray-800 p-4 rounded-lg flex items-center justify-between transition-opacity animate-fade-in-up ${!rt.isActive ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-700 rounded-full">
                    <ArrowPathIcon className={`w-6 h-6 transition-colors ${rt.isActive ? 'text-primary-400' : 'text-gray-500'}`} />
                </div>
                <div>
                    <p className="font-semibold text-white">{rt.description}</p>
                    <p className="text-sm text-expense font-bold">{formatCurrency(rt.amount, currency)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {getFrequencyText(rt.frequency)} - Lần kế tiếp: {rt.isActive ? formatDate(rt.nextDueDate) : 'Đã tạm dừng'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    role="switch"
                    aria-checked={rt.isActive}
                    onClick={() => onToggleActive(rt.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        rt.isActive ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                    aria-label={rt.isActive ? 'Deactivate recurring transaction' : 'Activate recurring transaction'}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            rt.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
                <button 
                    onClick={() => onDelete(rt.id)}
                    aria-label="Xóa giao dịch định kỳ"
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
         </div>
      ))}
    </div>
  );
};