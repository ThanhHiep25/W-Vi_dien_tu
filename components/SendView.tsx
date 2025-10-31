import React, { useState, useEffect } from 'react';
import { User, Currency, DefaultMessage, LinkedBankAccount, LuckyMoneyPacket } from '../types';
import { SendMoneyForm } from './SendMoneyForm';
import { BankTransferForm } from './BankTransferForm';
import { LuckyMoneyForm } from './LuckyMoneyForm';
import { ReceiveMoneyView } from './ReceiveMoneyModal';
import { SearchIcon, QrCodeIcon, BanknotesIcon, ArrowDownLeftIcon, GiftIcon, ChevronRightIcon } from './icons';

interface SendMoneyDetails {
    recipientId: string;
    amount: number;
    message: string;
}

interface BankTransferDetails {
    amount: number;
    bankInfo: string;
    message: string;
}

interface LuckyMoneyCreationDetails {
    totalAmount: number;
    quantity: number;
    type: 'equal' | 'random';
    message: string;
    isAnonymous: boolean;
}

interface Recipient {
  id: string;
  name?: string;
  avatarUrl?: string;
}

interface SendViewProps {
    user: User;
    balance: number;
    currency: Currency;
    defaultMessages: DefaultMessage[];
    isBiometricEnabled: boolean;
    frequentRecipients: Recipient[];
    linkedAccounts: LinkedBankAccount[];
    transactionLimits: { daily: number; perTransaction: number; };
    spentToday: number;
    onSendMoney: (details: SendMoneyDetails) => Promise<void>;
    onBankTransfer: (details: BankTransferDetails) => void;
    onCreateLuckyMoneyPacket: (details: LuckyMoneyCreationDetails) => Promise<LuckyMoneyPacket | null>;
    onRequestBiometricAuth: (onConfirm: () => void, title: string) => void;
    onRequestOtpVerification: (onConfirm: () => Promise<void>, title: string) => void;
    setModal: (modal: any) => void; 
}

type ActiveAction = 'main' | 'wallet' | 'bank' | 'lucky' | 'receive';

const MainView: React.FC<{
    frequentRecipients: Recipient[];
    onActionSelect: (action: ActiveAction) => void;
    onRecipientSelect: (recipient: Recipient) => void;
    onManualSubmit: (id: string) => void;
    setModal: (modal: any) => void;
}> = ({ frequentRecipients, onActionSelect, onRecipientSelect, onManualSubmit, setModal }) => {
  const [manualRecipientId, setManualRecipientId] = useState('');

  const handleManualSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualRecipientId.trim()) {
        onManualSubmit(manualRecipientId.trim());
    }
  };
  
  const ServiceButton: React.FC<{
    label: string;
    description: string;
    icon: React.ReactNode;
    iconBgClass: string;
    onClick: () => void;
  }> = ({ label, description, icon, iconBgClass, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 bg-gray-800 rounded-xl text-left transition-all duration-200 transform hover:bg-gray-700/70 hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
    >
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
            {icon}
        </div>
        <div className="flex-grow">
            <p className="font-bold text-lg text-white">{label}</p>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <ChevronRightIcon className="w-6 h-6 text-gray-500" />
    </button>
  );

  return (
    <div className="p-4 md:p-6 text-white animate-fade-in-up">
      <h1 className="text-3xl font-bold">Chuyển & Nhận Tiền</h1>
      <p className="text-gray-400 mt-1">Gửi tiền tới bạn bè một cách an toàn và nhanh chóng.</p>
      
      <form onSubmit={handleManualSend} className="relative my-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          value={manualRecipientId}
          onChange={(e) => setManualRecipientId(e.target.value)}
          placeholder="Nhập SĐT hoặc ID Ví để chuyển đến Ví..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-28 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        />
        {manualRecipientId.trim() && (
             <button type="submit" className="absolute inset-y-0 right-0 flex items-center px-4 font-semibold text-primary-400 hover:text-primary-300">
                Tiếp tục
             </button>
        )}
      </form>
      
       <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Dịch vụ khác</h2>
            <div className="space-y-3">
                <ServiceButton
                    label="Chuyển khoản Ngân hàng"
                    description="Gửi tiền đến tài khoản ngân hàng bất kỳ"
                    icon={<BanknotesIcon className="w-7 h-7 text-green-300"/>}
                    iconBgClass="bg-green-500/20"
                    onClick={() => onActionSelect('bank')}
                />
                 <ServiceButton
                    label="Gửi Lì xì"
                    description="Trao may mắn đến bạn bè và người thân"
                    icon={<GiftIcon className="w-7 h-7 text-red-300"/>}
                    iconBgClass="bg-red-500/20"
                    onClick={() => onActionSelect('lucky')}
                />
                 <ServiceButton
                    label="Nhận tiền qua QR"
                    description="Tạo mã QR để người khác chuyển tiền cho bạn"
                    icon={<ArrowDownLeftIcon className="w-7 h-7 text-blue-300"/>}
                    iconBgClass="bg-blue-500/20"
                    onClick={() => onActionSelect('receive')}
                />
                 <ServiceButton
                    label="Quét mã QR"
                    description="Dùng máy ảnh để thanh toán hoặc gửi tiền"
                    icon={<QrCodeIcon className="w-7 h-7 text-cyan-300"/>}
                    iconBgClass="bg-cyan-500/20"
                    onClick={() => setModal('qrScan')}
                />
            </div>
        </div>

      {frequentRecipients.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Gửi lại (đến Ví)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {frequentRecipients.map(rec => (
                    <button 
                        key={rec.id} 
                        onClick={() => onRecipientSelect(rec)}
                        className="w-full flex items-center gap-4 p-3 bg-gray-800 rounded-lg text-left hover:bg-gray-700 transition-colors"
                    >
                        <img src={rec.avatarUrl} alt={rec.name} className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
                        <div className="truncate">
                            <p className="font-semibold text-white truncate">{rec.name}</p>
                            <p className="text-xs text-gray-400 truncate">{rec.id}</p>
                        </div>
                    </button>
                ))}
            </div>
          </div>
      )}
    </div>
  );
};


export const SendView: React.FC<SendViewProps> = (props) => {
  const [activeAction, setActiveAction] = useState<ActiveAction>('main');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    const qrRecipientData = localStorage.getItem('qr_scanned_recipient');
    if (qrRecipientData) {
        try {
            const recipient = JSON.parse(qrRecipientData);
            setSelectedRecipient(recipient);
            setActiveAction('wallet');
        } catch (e) { console.error("Failed to parse QR recipient data"); }
        localStorage.removeItem('qr_scanned_recipient');
    }
  }, []);
  
  const handleRecipientSelect = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setActiveAction('wallet');
  };

  const handleManualSubmit = (id: string) => {
    setSelectedRecipient({
        id,
        name: `Ví ${id}`,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(id)}`
    });
    setActiveAction('wallet');
  };
  
  const handleBack = () => {
    setActiveAction('main');
    setSelectedRecipient(null);
  };
  
  const handleSuccess = async (sendAction: (details: any) => Promise<any>, details: any) => {
      await sendAction(details);
      handleBack();
  };

  switch(activeAction) {
    case 'wallet':
        if (!selectedRecipient) {
            // This case can happen if QR scan fails to set recipient but sets action.
            // Default back to main view.
            setActiveAction('main');
            return null;
        }
        return <SendMoneyForm 
          recipient={selectedRecipient}
          balance={props.balance}
          currency={props.currency}
          defaultMessages={props.defaultMessages}
          isBiometricEnabled={props.isBiometricEnabled}
          onSend={(details) => handleSuccess(props.onSendMoney, details)}
          onBack={handleBack}
          onRequestBiometricAuth={props.onRequestBiometricAuth}
          onRequestOtpVerification={props.onRequestOtpVerification}
          transactionLimits={props.transactionLimits}
          spentToday={props.spentToday}
        />
    case 'bank':
        return <BankTransferForm
            balance={props.balance}
            currency={props.currency}
            linkedAccounts={props.linkedAccounts}
            isBiometricEnabled={props.isBiometricEnabled}
            onSend={(details) => {
                props.onBankTransfer(details);
                handleBack();
            }}
            onBack={handleBack}
            onRequestBiometricAuth={props.onRequestBiometricAuth}
            onRequestOtpVerification={props.onRequestOtpVerification}
            transactionLimits={props.transactionLimits}
            spentToday={props.spentToday}
        />
    case 'lucky':
        return <LuckyMoneyForm
             balance={props.balance}
             currency={props.currency}
             onCreatePacket={props.onCreateLuckyMoneyPacket}
             onBack={handleBack}
             isBiometricEnabled={props.isBiometricEnabled}
             onRequestBiometricAuth={props.onRequestBiometricAuth}
             onRequestOtpVerification={props.onRequestOtpVerification}
             transactionLimits={props.transactionLimits}
             spentToday={props.spentToday}
        />
    case 'receive':
        return <ReceiveMoneyView 
            user={props.user}
            currency={props.currency}
            onBack={handleBack}
        />
    case 'main':
    default:
        return <MainView
            frequentRecipients={props.frequentRecipients}
            onActionSelect={setActiveAction}
            onRecipientSelect={handleRecipientSelect}
            onManualSubmit={handleManualSubmit}
            setModal={props.setModal}
        />
  }
};