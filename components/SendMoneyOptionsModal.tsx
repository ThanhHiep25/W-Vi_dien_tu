import React from 'react';
import { XMarkIcon, BanknotesIcon, QrCodeIcon, GiftIcon, DevicePhoneMobileIcon } from './icons';

type SendOption = 'wallet' | 'bank' | 'qr' | 'luckyMoney';

interface SendMoneyOptionsModalProps {
  onSelectOption: (option: SendOption) => void;
  onClose: () => void;
}

const OptionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
}> = ({ icon, label, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 bg-gray-700 rounded-xl text-left transition-all duration-200 transform hover:bg-gray-600 hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
    >
        <div className="p-3 bg-gray-800 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="font-bold text-lg text-white">{label}</p>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </button>
);


export const SendMoneyOptionsModal: React.FC<SendMoneyOptionsModalProps> = ({ onSelectOption, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Chọn hình thức chuyển tiền</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="space-y-4">
            <OptionButton
                icon={<DevicePhoneMobileIcon className="w-7 h-7 text-primary-400" />}
                label="Chuyển đến Ví"
                description="Gửi tiền nhanh chóng đến tài khoản ví khác"
                onClick={() => onSelectOption('wallet')}
            />
            <OptionButton
                icon={<BanknotesIcon className="w-7 h-7 text-green-400" />}
                label="Chuyển khoản Ngân hàng"
                description="Gửi tiền đến tài khoản ngân hàng bất kỳ"
                onClick={() => onSelectOption('bank')}
            />
            <OptionButton
                icon={<QrCodeIcon className="w-7 h-7 text-cyan-400" />}
                label="Quét mã QR"
                description="Dùng máy ảnh để thanh toán tiện lợi"
                onClick={() => onSelectOption('qr')}
            />
             <OptionButton
                icon={<GiftIcon className="w-7 h-7 text-red-400" />}
                label="Gửi Lì xì"
                description="Trao may mắn đến bạn bè và người thân"
                onClick={() => onSelectOption('luckyMoney')}
            />
        </div>
      </div>
    </div>
  );
};
