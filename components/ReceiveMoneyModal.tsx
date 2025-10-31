import React, { useState, useMemo } from 'react';
import { User, Currency } from '../types';
import { ArrowLeftIcon, ShareIcon, DocumentDuplicateIcon, CheckIcon } from './icons';

interface ReceiveMoneyViewProps {
  user: User;
  currency: Currency;
  onBack: () => void;
}

const formatCurrencyInput = (value: string) => {
    return value.replace(/[^0-9]/g, '');
};

const formatDisplayCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

export const ReceiveMoneyView: React.FC<ReceiveMoneyViewProps> = ({ user, currency, onBack }) => {
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  
  const qrData = useMemo(() => {
    const baseData = { walletId: user.walletId, name: user.name };
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      return JSON.stringify({ ...baseData, amount: numericAmount });
    }
    return JSON.stringify(baseData);
  }, [user.walletId, user.name, amount]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=256x256&qzone=1&bgcolor=ffffff`;

  const handleCopy = () => {
    navigator.clipboard.writeText(user.walletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR_Nhan_Tien_${user.walletId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white animate-fade-in-up">
        {/* Header */}
        <div className="p-4 flex items-center gap-4 flex-shrink-0">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-700 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">Nhận tiền</h2>
        </div>

        {/* Main Content */}
        <div className="flex-grow overflow-y-auto flex flex-col items-center p-4">
            {/* QR Card */}
            <div className="w-full max-w-sm bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 flex flex-col items-center shadow-lg border border-gray-700">
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-4 border-gray-700 mb-4"/>
                <h3 className="font-bold text-xl">{user.name}</h3>
                <p className="text-sm text-gray-400">({user.walletId})</p>
                <div className="bg-white p-3 rounded-lg mt-4 shadow-md">
                    <img src={qrCodeUrl} alt="Mã QR nhận tiền" className="w-48 h-48"/>
                </div>
            </div>

            {/* Amount Input */}
            <div className="w-full max-w-sm mt-6">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Số tiền (tùy chọn)</label>
                <div className="relative mt-1">
                    <input
                      type="text"
                      id="amount"
                      value={amount ? parseInt(amount, 10).toLocaleString('vi-VN') : ''}
                      onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                      placeholder="Để trống nếu muốn người gửi tự nhập"
                      className="w-full bg-gray-800 border-gray-700 rounded-md py-3 px-4 focus:ring-primary-400 focus:border-primary-400 placeholder:text-gray-500"
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400">{currency}</span>
                </div>
                 {amount && (
                     <p className="text-center text-xs text-yellow-300 mt-2 animate-fade-in">Mã QR đã được cập nhật với số tiền {formatDisplayCurrency(parseFloat(amount), currency)}</p>
                )}
            </div>

            {/* Spacer to push actions to bottom */}
            <div className="flex-grow"></div>

            {/* Actions */}
            <div className="w-full max-w-sm space-y-3 mt-6">
                <button onClick={handleDownload} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    <ShareIcon className="w-5 h-5" />
                    <span>Lưu & Chia sẻ QR</span>
                </button>
                 <button onClick={handleCopy} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    {copied ? <CheckIcon className="w-5 h-5" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                    <span>{copied ? 'Đã sao chép mã ví!' : 'Sao chép mã ví'}</span>
                 </button>
            </div>
        </div>
    </div>
  );
};
