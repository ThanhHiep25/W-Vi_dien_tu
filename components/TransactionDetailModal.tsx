import React from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import { ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon, SparklesIcon, BanknotesIcon, CreditCardIcon, ArrowPathIcon, GiftIcon, ReceiptPercentIcon } from './icons';

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
  currency: Currency;
  onSetupRecurring: (transaction: Transaction) => void;
}

const ICONS_CONFIG: Record<string, { Icon: React.FC<{ className?: string }>, color: string, title: string }> = {
    [TransactionType.OUTGOING]: { Icon: ArrowUpRightIcon, color: 'bg-expense', title: 'Chi tiết Giao dịch Gửi tiền' },
    [TransactionType.INCOMING]: { Icon: ArrowDownLeftIcon, color: 'bg-blue-500', title: 'Chi tiết Giao dịch Nhận tiền' },
    [TransactionType.TOPUP]: { Icon: PlusIcon, color: 'bg-green-500', title: 'Chi tiết Nạp tiền' },
    [TransactionType.PROFIT]: { Icon: SparklesIcon, color: 'bg-profit', title: 'Chi tiết Lợi nhuận' },
    [TransactionType.WITHDRAWAL]: { Icon: BanknotesIcon, color: 'bg-orange-500', title: 'Chi tiết Rút tiền' },
    [TransactionType.LOAN]: { Icon: CreditCardIcon, color: 'bg-purple-500', title: 'Chi tiết Khoản vay' },
    [TransactionType.LUCKY_MONEY]: { Icon: GiftIcon, color: 'bg-red-500', title: 'Chi tiết Giao dịch Lì xì' },
    [TransactionType.BILL_PAYMENT]: { Icon: ReceiptPercentIcon, color: 'bg-cyan-500', title: 'Chi tiết Thanh toán Hóa đơn' },
};

const DetailRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-3 border-b border-gray-700 last:border-b-0">
            <p className="text-gray-400">{label}</p>
            <p className="font-semibold text-white text-right pl-4">{value}</p>
        </div>
    );
};

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose, currency, onSetupRecurring }) => {
  const { type, description, date, amount, sender, recipient, id } = transaction;

  const config = ICONS_CONFIG[type];
  const { Icon, color, title } = config;

  const isPositive = type === TransactionType.INCOMING || type === TransactionType.PROFIT || type === TransactionType.TOPUP || type === TransactionType.LOAN;
  const formattedAmount = `${isPositive ? '+' : '-'}${formatCurrency(amount, currency)}`;
  const amountColor = isPositive ? 'text-profit' : 'text-expense';
  
  const formattedDate = new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
  });

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
        case TransactionType.INCOMING: return 'Tiền vào';
        case TransactionType.OUTGOING: return 'Tiền ra';
        case TransactionType.PROFIT: return 'Lợi nhuận';
        case TransactionType.TOPUP: return 'Nạp tiền';
        case TransactionType.WITHDRAWAL: return 'Rút tiền';
        case TransactionType.LOAN: return 'Giải ngân khoản vay';
        case TransactionType.LUCKY_MONEY: return 'Lì xì';
        case TransactionType.BILL_PAYMENT: return 'Thanh toán Hóa đơn';
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center">
            <div className={`p-3 ${color} rounded-full mb-4`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className={`font-extrabold text-3xl my-2 ${amountColor}`}>{formattedAmount}</p>
            <p className="text-sm text-gray-500">Hoàn thành</p>
        </div>

        <div className="my-6 bg-gray-900/50 p-4 rounded-lg">
            <DetailRow label="Lời nhắn" value={description} />
            {recipient && <DetailRow label="Tới người nhận" value={recipient} />}
            {sender && <DetailRow label="Từ người gửi" value={sender} />}
            <DetailRow label="Thời gian" value={formattedDate} />
            <DetailRow label="Loại giao dịch" value={getTransactionTypeLabel(type)} />
            <DetailRow label="Mã giao dịch" value={id} />
        </div>
        
        <div className="flex flex-col gap-3">
          {transaction.type === TransactionType.OUTGOING && (
            <button
              onClick={() => onSetupRecurring(transaction)}
              className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Tạo giao dịch định kỳ
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};