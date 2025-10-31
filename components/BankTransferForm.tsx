import React, { useState, useMemo } from 'react';
import { Currency, LinkedBankAccount } from '../types';
import { SpinnerIcon, ArrowLeftIcon, SearchIcon, BanknotesIcon, CheckCircleIcon } from './icons';

// Data moved from App.tsx for co-location
const PREDEFINED_BANKS = [
  { name: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png', bin: '970436' },
  { name: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png', bin: '970407' },
  { name: 'MB Bank', logo: 'https://api.vietqr.io/img/MBBANK.png', bin: '970422' },
  { name: 'Vietinbank', logo: 'https://api.vietqr.io/img/VIETINBANK.png', bin: '970415' },
  { name: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png', bin: '970418' },
  { name: 'Agribank', logo: 'https://api.vietqr.io/img/AGRIBANK.png', bin: '970405' },
  { name: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png', bin: '970416' },
  { name: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png', bin: '970432' },
  { name: 'Sacombank', logo: 'https://api.vietqr.io/img/STB.png', bin: '970403' },
  { name: 'TPBank', logo: 'https://api.vietqr.io/img/TPB.png', bin: '970423' },
];


interface BankTransferDetails {
    amount: number;
    bankInfo: string; // "Bank Name, Account Number, Account Holder"
    message: string;
}

interface BankTransferFormProps {
  balance: number;
  onSend: (details: BankTransferDetails) => void;
  onBack: () => void;
  currency: Currency;
  linkedAccounts: LinkedBankAccount[];
  isBiometricEnabled: boolean;
  transactionLimits: { daily: number; perTransaction: number; };
  spentToday: number;
  onRequestBiometricAuth: (onConfirm: () => void, title: string) => void;
  onRequestOtpVerification: (onConfirm: () => Promise<void>, title: string) => void;
}

type Step = 'selectRecipient' | 'enterAmount' | 'confirm';
type RecipientInfo = {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    logoUrl: string;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const BankSelectionModal: React.FC<{onSelect: (bank: {name: string, logo: string}) => void, onClose: () => void}> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const filteredBanks = PREDEFINED_BANKS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="absolute inset-0 bg-gray-900 z-10 flex flex-col p-4 animate-fade-in-up">
            <h3 className="text-xl font-bold text-center mb-4">Chọn ngân hàng</h3>
            <div className="relative mb-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên ngân hàng..." className="w-full bg-gray-800 rounded-md p-3 pl-10 border border-gray-700" />
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex-grow overflow-y-auto space-y-2">
                {filteredBanks.map(bank => (
                    <button key={bank.name} onClick={() => onSelect(bank)} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left">
                        <img src={bank.logo} alt={bank.name} className="w-10 h-10 rounded-full bg-white p-1 object-contain" />
                        <span className="font-semibold">{bank.name}</span>
                    </button>
                ))}
            </div>
            <button onClick={onClose} className="mt-4 w-full bg-gray-600 font-bold py-3 rounded-lg">Đóng</button>
        </div>
    );
};

export const BankTransferForm: React.FC<BankTransferFormProps> = ({ balance, onSend, onBack, currency, linkedAccounts, isBiometricEnabled, transactionLimits, spentToday, onRequestBiometricAuth, onRequestOtpVerification }) => {
  const [step, setStep] = useState<Step>('selectRecipient');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // New recipient form state
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);
  const [isSelectingBank, setIsSelectingBank] = useState(false);
  const [selectedBank, setSelectedBank] = useState<{name: string, logo: string} | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);


  const handleSelectNewRecipient = () => {
    if (!selectedBank || !accountNumber || !accountHolder) {
        setError('Vui lòng điền đủ thông tin.');
        return;
    }
    setError('');
    setIsVerifying(true);
    setTimeout(() => { // Simulate verification
        setIsVerifying(false);
        const newRecipient = {
            bankName: selectedBank.name,
            accountNumber,
            accountHolder,
            logoUrl: selectedBank.logo,
        };
        setRecipient(newRecipient);
        setStep('enterAmount');
        // Reset form
        setShowNewRecipientForm(false);
        setSelectedBank(null);
        setAccountNumber('');
        setAccountHolder('');
    }, 1000);
  };

  const handleSelectLinkedAccount = (acc: LinkedBankAccount) => {
    setRecipient({
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        accountHolder: acc.accountHolder,
        logoUrl: acc.logoUrl,
    });
    setStep('enterAmount');
  };

  const handleConfirm = () => {
    const performSend = async () => {
        if (!recipient) return;
        setIsProcessing(true);
        return new Promise<void>(resolve => {
            setTimeout(() => {
                onSend({
                    amount: parseFloat(amount),
                    bankInfo: `${recipient.bankName}, ${recipient.accountNumber}, ${recipient.accountHolder}`,
                    message,
                });
                // Parent handles closing, etc.
                setIsProcessing(false);
                resolve();
            }, 1500);
        });
    };
    
    const startOtpFlow = () => {
        onRequestOtpVerification(performSend, `Xác thực chuyển ${formatCurrency(numericAmount, currency)}`);
    };

    if (isBiometricEnabled) {
        onRequestBiometricAuth(startOtpFlow, `Chuyển ${formatCurrency(numericAmount, currency)}`);
    } else {
        startOtpFlow();
    }
  };

  // --- Keypad Logic ---
  const numericAmount = parseFloat(amount || '0');
  const displayAmount = numericAmount.toLocaleString('vi-VN');

  const handleKeyPress = (key: string) => {
    setError('');
    if (key === 'del') {
        setAmount(prev => prev.slice(0, -1));
    } else if (amount.length < 12) {
        setAmount(prev => prev + key);
    }
  };

  const handleProceed = () => {
    if (numericAmount <= 0) { setError('Vui lòng nhập số tiền.'); return; }
    if (numericAmount > balance) { setError('Số dư không đủ.'); return; }
    if (numericAmount > transactionLimits.perTransaction) {
        setError(`Số tiền vượt hạn mức mỗi giao dịch (${formatCurrency(transactionLimits.perTransaction, currency)}).`);
        return;
    }
    const remainingDailyLimit = transactionLimits.daily - spentToday;
    if (numericAmount > remainingDailyLimit) {
        setError(`Vượt hạn mức hàng ngày. Hạn mức còn lại: ${formatCurrency(remainingDailyLimit, currency)}.`);
        return;
    }
    setError('');
    setStep('confirm');
  };

  const renderHeader = (title: string, onBackAction: () => void) => (
    <div className="p-4 flex items-center gap-4 border-b border-gray-700 flex-shrink-0">
        <button onClick={onBackAction} className="p-2 -ml-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
  
  const renderSelectRecipient = () => (
    <div className="flex flex-col h-full w-full">
        {renderHeader('Chuyển khoản Ngân hàng', onBack)}
        <div className="p-4 flex-grow overflow-y-auto">
             {linkedAccounts.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Người nhận đã lưu</h3>
                    <div className="space-y-2">
                    {linkedAccounts.map(acc => (
                        <button key={acc.id} onClick={() => handleSelectLinkedAccount(acc)} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left">
                           <img src={acc.logoUrl} alt={acc.bankName} className="w-10 h-10 rounded-full bg-white p-1 object-contain" />
                           <div>
                               <p className="font-semibold">{acc.accountHolder}</p>
                               <p className="text-xs text-gray-400">{acc.bankName} - ...{acc.accountNumber.slice(-4)}</p>
                           </div>
                        </button>
                    ))}
                    </div>
                </div>
             )}
             <button onClick={() => setShowNewRecipientForm(true)} className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-primary-300 border border-dashed border-gray-600">
                + Thêm người nhận mới
             </button>

             {showNewRecipientForm && (
                <div className="mt-4 space-y-4 pt-4 border-t border-gray-700">
                     <h3 className="font-bold text-lg">Thông tin người nhận</h3>
                     <div>
                        <label className="text-sm text-gray-400">Ngân hàng</label>
                        <button onClick={() => setIsSelectingBank(true)} className="mt-1 w-full flex items-center gap-3 p-3 bg-gray-700 rounded-lg text-left">
                            {selectedBank ? (
                                <>
                                  <img src={selectedBank.logo} alt={selectedBank.name} className="w-8 h-8 rounded-full bg-white p-1 object-contain" />
                                  <span className="font-semibold">{selectedBank.name}</span>
                                </>
                            ) : (
                                <span className="text-gray-400">Chọn ngân hàng</span>
                            )}
                        </button>
                     </div>
                     <div>
                        <label htmlFor="accNum" className="text-sm text-gray-400">Số tài khoản</label>
                        <input id="accNum" type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1 w-full bg-gray-700 p-3 rounded-lg" />
                     </div>
                      <div>
                        <label htmlFor="accHolder" className="text-sm text-gray-400">Tên chủ tài khoản</label>
                        <input id="accHolder" type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="mt-1 w-full bg-gray-700 p-3 rounded-lg" />
                     </div>
                     {error && <p className="text-red-400 text-sm">{error}</p>}
                     <button onClick={handleSelectNewRecipient} disabled={isVerifying} className="w-full bg-primary-600 font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50">
                        {isVerifying ? <SpinnerIcon className="animate-spin w-5 h-5"/> : 'Tiếp tục'}
                     </button>
                </div>
             )}
        </div>
        {isSelectingBank && <BankSelectionModal onSelect={(bank) => { setSelectedBank(bank); setIsSelectingBank(false); }} onClose={() => setIsSelectingBank(false)} />}
    </div>
  );
  
  const renderEnterAmount = () => {
    if (!recipient) return null;
    const quickAmounts = [100000, 500000, 1000000, 2000000];
    return (
        <div className="flex flex-col h-full w-full">
            {renderHeader('Nhập số tiền', () => setStep('selectRecipient'))}

            <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                <img src={recipient.logoUrl} alt={recipient.bankName} className="w-10 h-10 rounded-full bg-white p-1 object-contain" />
                <div>
                    <p className="font-bold">{recipient.accountHolder}</p>
                    <p className="text-xs text-gray-400">{recipient.bankName} - {recipient.accountNumber}</p>
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <p className={`text-5xl font-bold break-all ${numericAmount > balance ? 'text-red-500' : 'text-white'}`}>{displayAmount || '0'}</p>
                    <p className="text-lg text-gray-400 font-semibold">{currency}</p>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    {!error && <p className="text-gray-500 text-sm mt-2">Số dư: {formatCurrency(balance, currency)}</p>}
                </div>
                 <div className="flex gap-2 mt-6">
                    {quickAmounts.map(qa => (
                        <button key={qa} onClick={() => setAmount(qa.toString())} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full text-sm transition-colors">
                            {qa.toLocaleString('vi-VN')}
                        </button>
                    ))}
                </div>
            </div>
            
             <div className="flex-shrink-0">
                 <div className="px-4 pb-2">
                     <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Thêm lời nhắn..." className="w-full bg-gray-700 rounded-md p-3 text-center" />
                </div>
                <div className="grid grid-cols-3 gap-px bg-gray-700">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(key => (
                        <button key={key} onClick={() => handleKeyPress(key)} className="h-16 text-2xl font-semibold bg-gray-800 hover:bg-gray-700/50">
                            {key === 'del' ? '⌫' : key}
                        </button>
                    ))}
                </div>
                <div className="p-4 bg-gray-800">
                     <button onClick={handleProceed} disabled={numericAmount <= 0 || numericAmount > balance} className="w-full bg-primary-600 font-bold py-4 rounded-lg text-lg disabled:opacity-50">
                        Tiếp tục
                    </button>
                </div>
            </div>
        </div>
    );
  };
  
  const renderConfirmStep = () => {
    if (!recipient) return null;
    return (
        <div className="flex flex-col h-full w-full p-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center mb-6">Xác nhận Giao dịch</h2>
            
            <div className="flex flex-col items-center text-center mb-6">
                 <img src={recipient.logoUrl} alt={recipient.bankName} className="w-20 h-20 rounded-full mb-3 border-4 border-gray-600 bg-white p-1 object-contain" />
                 <p className="text-lg font-semibold">{recipient.accountHolder}</p>
                 <p className="text-sm text-gray-400">{recipient.bankName} - {recipient.accountNumber}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Số tiền chuyển</span>
                    <span className="font-bold text-2xl text-white">{formatCurrency(numericAmount, currency)}</span>
                </div>
                 <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Phí giao dịch</span>
                    <span className="font-semibold text-white">Miễn phí</span>
                </div>
                 {message && (
                    <div className="flex justify-between items-start pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Lời nhắn</span>
                        <p className="font-semibold text-white text-right pl-4">"{message}"</p>
                    </div>
                )}
            </div>
            
            <div className="my-4 border-t border-dashed border-gray-600"></div>

            <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Nguồn tiền</span>
                    <span className="font-semibold text-white">Ví điện tử</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Số dư sau GD</span>
                    <span className="font-semibold text-white">{formatCurrency(balance - numericAmount, currency)}</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto pt-6">
                <button onClick={handleConfirm} disabled={isProcessing} className="w-full bg-primary-600 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center disabled:opacity-50">
                  {isProcessing ? <><SpinnerIcon className="w-6 h-6 mr-2 animate-spin" />Đang xử lý...</> : 'Xác nhận & Chuyển'}
                </button>
                 <button onClick={() => setStep('enterAmount')} disabled={isProcessing} className="w-full bg-gray-600 text-white font-bold py-3 rounded-lg disabled:opacity-50">
                  Quay lại
                </button>
            </div>
        </div>
    );
  };


  switch(step) {
      case 'enterAmount': return renderEnterAmount();
      case 'confirm': return renderConfirmStep();
      case 'selectRecipient':
      default: return renderSelectRecipient();
  }
};
