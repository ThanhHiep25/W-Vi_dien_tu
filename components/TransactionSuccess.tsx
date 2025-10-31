import React from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import { CheckCircleIcon, ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon, SparklesIcon, BanknotesIcon, CreditCardIcon, GiftIcon, ReceiptPercentIcon } from './icons';

interface TransactionSuccessProps {
  transaction: Transaction;
  onDone: () => void;
  currency: Currency;
}

const ICONS_CONFIG: Record<string, { Icon: React.FC<{ className?: string }>, color: string }> = {
    [TransactionType.OUTGOING]: { Icon: ArrowUpRightIcon, color: 'text-expense' },
    [TransactionType.INCOMING]: { Icon: ArrowDownLeftIcon, color: 'text-blue-400' },
    [TransactionType.TOPUP]: { Icon: PlusIcon, color: 'text-green-400' },
    [TransactionType.PROFIT]: { Icon: SparklesIcon, color: 'text-profit' },
    [TransactionType.WITHDRAWAL]: { Icon: BanknotesIcon, color: 'text-orange-400' },
    [TransactionType.LOAN]: { Icon: CreditCardIcon, color: 'text-purple-400' },
    [TransactionType.LUCKY_MONEY]: { Icon: GiftIcon, color: 'text-red-400' },
    [TransactionType.BILL_PAYMENT]: { Icon: ReceiptPercentIcon, color: 'text-cyan-400' },
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

export const TransactionSuccess: React.FC<TransactionSuccessProps> = ({ transaction, onDone, currency }) => {
    const { type, description, date, amount, recipient, sender, id } = transaction;

    const config = ICONS_CONFIG[type];
    const { Icon, color } = config;

    const isPositive = type === TransactionType.INCOMING || type === TransactionType.PROFIT || type === TransactionType.TOPUP || type === TransactionType.LOAN;
    const formattedAmount = `${isPositive ? '+' : '-'}${formatCurrency(amount, currency)}`;
    const amountColor = isPositive ? 'text-profit' : 'text-expense';

    const formattedDate = new Date(date).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const getTransactionTitle = (type: TransactionType) => {
        switch (type) {
            case TransactionType.INCOMING: return 'Nhận tiền thành công';
            case TransactionType.OUTGOING: return 'Chuyển tiền thành công';
            case TransactionType.PROFIT: return 'Nhận lợi nhuận';
            case TransactionType.TOPUP: return 'Nạp tiền thành công';
            case TransactionType.WITHDRAWAL: return 'Rút tiền thành công';
            case TransactionType.LOAN: return 'Đăng ký vay thành công';
            case TransactionType.LUCKY_MONEY: return 'Gửi Lì xì thành công';
            case TransactionType.BILL_PAYMENT: return 'Thanh toán thành công';
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-white animate-fade-in-up p-4">
            <div className="w-full max-w-md text-center">
                <div className="animate-scale-in">
                    <CheckCircleIcon className="w-24 h-24 text-green-400 mx-auto" />
                </div>
                <h1 className="text-3xl font-bold mt-6">{getTransactionTitle(type)}</h1>
                <p className={`font-extrabold text-4xl my-4 ${amountColor}`}>{formattedAmount}</p>

                <div className="my-8 bg-gray-800 p-4 rounded-lg text-left">
                    <DetailRow label="Lời nhắn" value={description} />
                    {recipient && <DetailRow label="Tới" value={recipient} />}
                    {sender && <DetailRow label="Từ" value={sender} />}
                    <DetailRow label="Thời gian" value={formattedDate} />
                    <DetailRow label="Mã giao dịch" value={id} />
                </div>

                <button
                    onClick={onDone}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                    Hoàn tất
                </button>
            </div>
        </div>
    );
};