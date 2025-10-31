import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CreateWalletForm } from './components/CreateWalletForm';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { SendView } from './components/SendView';
import { Profile } from './components/Profile';
import { Rewards } from './components/Rewards';
import { WithdrawMoneyForm } from './components/WithdrawMoneyForm';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { SavingsGoalModal } from './components/SavingsGoalModal';
import { AddToSavingsModal } from './components/AddToSavingsModal';
import { Notification } from './components/Notification';
import { TransactionSuccess } from './components/TransactionSuccess';
import { Chatbot } from './components/Chatbot';
import { BiometricPrompt } from './components/BiometricPrompt';
import { OtpVerificationModal } from './components/OtpVerificationModal';


// New Components
import { BillPaymentView, BillDetails } from './components/BillPaymentView';
import { LoanApplicationModal } from './components/LoanApplicationModal';
import { SetupRecurringTransactionModal } from './components/SetupRecurringTransactionModal';


import { HomeIcon, HistoryIcon, ProfileIcon, SendIcon, ChatBubbleBottomCenterTextIcon, SpinnerIcon, XMarkIcon, GiftIcon, TicketIcon, WalletIcon } from './components/icons';
import { User, Transaction, TransactionType, SavingsGoal, DefaultMessage, Currency, Loan, LinkedBankAccount, RecurringTransaction, LuckyMoneyPacket, RewardTask, Voucher, UserVoucher } from './types';
import { themes } from './themes';


// --- New CameraScanModal Component ---
const CameraScanModal: React.FC<{
  onScanSuccess: (data: string) => void;
  onClose: () => void;
  scanType?: 'card' | 'paymentQR'
}> = ({ onScanSuccess, onClose, scanType = 'card' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState('Đang khởi tạo máy ảnh...');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported on this browser.');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setScanMessage(scanType === 'card' ? 'Đưa thẻ của bạn vào trong khung hình...' : 'Đưa mã QR thanh toán vào trong khung hình...');
        
        // Simulate scanning process
        setTimeout(() => {
            setScanMessage('Đang quét thông tin...');
            setTimeout(() => {
                // Generate a fake card number or payment QR for simulation
                let fakeData;
                if (scanType === 'paymentQR') {
                    // Simulate a VietQR code for a bank account
                    const fakeBankBin = '970436'; // Vietcombank
                    const fakeAccountNo = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
                    fakeData = JSON.stringify({
                        bankBin: fakeBankBin,
                        accountNo: fakeAccountNo,
                        accountName: "NGUYEN VAN SIMULATED"
                    });
                } else { // card
                    fakeData = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
                }
                onScanSuccess(fakeData);
            }, 2000); // Simulate processing time
        }, 2500); // Simulate focus time

      } catch (err) {
        console.error("Camera access error:", err);
        setError('Không thể truy cập máy ảnh. Vui lòng kiểm tra quyền truy cập trong trình duyệt của bạn.');
        setScanMessage('');
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop video stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess, scanType]);

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center" onClick={onClose}>
      <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white p-4">
        
        <div className={`w-full max-w-md ${scanType === 'card' ? 'aspect-[1.586]' : 'aspect-square'} border-4 border-dashed border-white/70 rounded-2xl bg-black/20 relative flex items-center justify-center p-4`}>
           <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-white"></div>
           <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-white"></div>
           <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-white"></div>
           <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-white"></div>
        </div>

        <div className="mt-8 p-4 bg-black/50 rounded-lg text-center">
            {error ? (
                <p className="text-lg font-semibold text-red-400">{error}</p>
            ) : scanMessage ? (
                 <div className="flex items-center gap-3">
                    <SpinnerIcon className="w-6 h-6 animate-spin" />
                    <p className="text-lg font-semibold">{scanMessage}</p>
                </div>
            ) : null}
        </div>
        
        <button onClick={onClose} className="absolute top-6 right-6 bg-black/50 p-3 rounded-full">
            <XMarkIcon className="w-7 h-7"/>
        </button>
      </div>
    </div>
  );
};


// --- New AddFundsForm Component ---
const AddFundsForm: React.FC<{
  onAdd: (amount: number, sourceDescription: string) => void;
  onCancel: () => void;
  onLinkAccount: (accountDetails: Omit<LinkedBankAccount, 'id' | 'logoUrl'>) => Promise<LinkedBankAccount>;
  linkedAccounts: LinkedBankAccount[];
}> = ({ onAdd, onCancel, onLinkAccount, linkedAccounts }) => {
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
  const E_WALLETS = [
    { name: 'MoMo', logo: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png' },
    { name: 'VNPay', logo: 'https://vnpay.vn/s1/statics.vnpay.vn/logo-vnpay-qr-1.png' },
  ];

  type Step = 'selectSource' | 'selectBank' | 'addCard' | 'enterAmount';
  type SourceInfo = { name: string; number?: string; logoUrl: string };

  const [step, setStep] = useState<Step>('selectSource');
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // State for adding a new card
  const [selectedBank, setSelectedBank] = useState<{ name: string; logo: string } | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isQrScanning, setIsQrScanning] = useState(false);

  const handleSelectEWallet = (ewallet: { name: string; logo: string }) => {
    setSourceInfo({ name: ewallet.name, logoUrl: ewallet.logo });
    setStep('enterAmount');
  };

  const handleSelectLinkedAccount = (account: LinkedBankAccount) => {
    setSourceInfo({ name: account.bankName, number: account.accountNumber, logoUrl: account.logoUrl });
    setStep('enterAmount');
  };

  const handleSelectBank = (bank: { name: string; logo: string }) => {
    setSelectedBank(bank);
    setStep('addCard');
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || !accountNumber || !accountHolder) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setError('');
    setIsLinking(true);
    try {
      const newAccount = await onLinkAccount({ bankName: selectedBank.name, accountNumber, accountHolder });
      handleSelectLinkedAccount(newAccount);
    } catch (err) {
      setError('Không thể liên kết tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Số tiền không hợp lệ.');
      return;
    }
    setError('');
    let sourceDescription = `Nạp tiền từ ${sourceInfo?.name}`;
    if (sourceInfo?.number) {
        sourceDescription += ` (...${sourceInfo.number.slice(-4)})`;
    }
    onAdd(numericAmount, sourceDescription);
  };
  
  const handleScanSuccess = (scannedNumber: string) => {
    setAccountNumber(scannedNumber);
    setIsScanning(false);
  };

  const handleQrScanSuccess = (data: string) => {
    setIsQrScanning(false);
    try {
        const parsed = JSON.parse(data);
        if (parsed.bankBin && parsed.accountNo) {
            const bank = PREDEFINED_BANKS.find(b => b.bin === parsed.bankBin);
            if (bank) {
                setSelectedBank(bank);
                setAccountNumber(parsed.accountNo);
                if (parsed.accountName) {
                    setAccountHolder(parsed.accountName);
                }
                setStep('addCard');
            } else {
                setError('Không nhận dạng được ngân hàng từ mã QR.');
                setStep('selectBank');
            }
        } else {
            setError('Mã QR không hợp lệ.');
            setStep('selectBank');
        }
    } catch (e) {
        console.error("QR Parse error", e);
        setError('Không thể đọc mã QR. Vui lòng thử lại.');
        setStep('selectBank');
    }
  };


  const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const SourceButton: React.FC<{ logo: string; name: string; subtext?: string; onClick: () => void }> = ({ logo, name, subtext, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
      <img src={logo} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=fff&color=111827`; }} alt={name} className="w-10 h-10 rounded-full bg-white object-contain p-1" />
      <div>
        <p className="font-semibold text-white">{name}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </button>
  );

  const renderSelectSource = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">Nạp Tiền vào Ví</h2>
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <FormSection title="VÍ ĐIỆN TỬ">
          {E_WALLETS.map(ew => (
            <SourceButton key={ew.name} logo={ew.logo} name={ew.name} onClick={() => handleSelectEWallet(ew)} />
          ))}
        </FormSection>

        {linkedAccounts.length > 0 && (
          <FormSection title="TÀI KHOẢN ĐÃ LIÊN KẾT">
            {linkedAccounts.map(acc => (
              <SourceButton 
                key={acc.id} 
                logo={acc.logoUrl} 
                name={acc.bankName} 
                subtext={`${acc.accountHolder} (...${acc.accountNumber.slice(-4)})`}
                onClick={() => handleSelectLinkedAccount(acc)} 
              />
            ))}
          </FormSection>
        )}

        <div className="mt-6 border-t border-gray-700 pt-6">
             <button 
                onClick={() => setStep('selectBank')} 
                className="w-full flex items-center justify-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-center font-semibold text-primary-300 border border-dashed border-gray-600 hover:border-primary-400"
             >
                 <span className="w-5 h-5">+</span>
                 <span>Liên kết thẻ/tài khoản mới</span>
             </button>
        </div>

      </div>
      <button onClick={onCancel} className="w-full mt-6 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all">Hủy</button>
    </div>
  );
  
  const renderSelectBank = () => {
    const filteredBanks = PREDEFINED_BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Chọn ngân hàng</h2>
            
             <button 
                type="button" 
                onClick={() => setIsQrScanning(true)}
                className="w-full flex items-center justify-center gap-3 p-3 mb-4 bg-primary-600/20 hover:bg-primary-600/30 rounded-lg transition-colors text-center font-semibold text-primary-300 border border-dashed border-primary-500 hover:border-primary-400"
            >
                <span className="w-5 h-5">📷</span>
                <span>Quét mã VietQR để điền nhanh</span>
            </button>

             <div className="relative mb-4">
                <input type="text" value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Hoặc tìm tên ngân hàng..." className="w-full bg-gray-700 rounded-md p-3 pl-10" />
                <span className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🏦</span>
             </div>
             <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {filteredBanks.map(bank => (
                    <SourceButton key={bank.name} logo={bank.logo} name={bank.name} onClick={() => handleSelectBank(bank)} />
                ))}
             </div>
             <div className="flex gap-4 pt-4 mt-4 border-t border-gray-700">
                <button type="button" onClick={() => setStep('selectSource')} className="w-full bg-gray-600 font-bold py-3 rounded-lg">Quay lại</button>
             </div>
        </div>
    );
  };

  const renderAddCard = () => (
     <form onSubmit={handleAddCard} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Liên kết tài khoản</h2>
        <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg mb-4">
            <img src={selectedBank?.logo} alt={selectedBank?.name} className="w-10 h-10 rounded-full bg-white object-contain p-1" />
            <p className="font-semibold text-white">{selectedBank?.name}</p>
        </div>
        <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300">Số tài khoản/thẻ</label>
            <div className="relative mt-1">
              <input type="text" id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Nhập số tài khoản" className="w-full bg-gray-700 rounded-md p-3 pr-12" autoFocus/>
              <button type="button" onClick={() => setIsScanning(true)} className="absolute inset-y-0 right-0 flex items-center px-3 text-primary-400 hover:text-primary-300">
                  <span className="w-6 h-6">📷</span>
              </button>
            </div>
        </div>
        <div>
            <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-300">Tên chủ tài khoản</label>
            <input type="text" id="accountHolder" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="NGUYEN VAN A" className="mt-1 w-full bg-gray-700 rounded-md p-3"/>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setStep('selectBank')} className="w-full bg-gray-600 font-bold py-3 rounded-lg">Quay lại</button>
            <button type="submit" disabled={isLinking} className="w-full bg-primary-600 font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50">
                {isLinking ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Liên kết'}
            </button>
        </div>
     </form>
  );
  
  const renderEnterAmount = () => (
    <form onSubmit={handleAddFunds} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Nhập số tiền</h2>
        <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg mb-4">
            <img src={sourceInfo?.logoUrl} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${sourceInfo?.name}&background=fff&color=111827`; }} alt={sourceInfo?.name} className="w-10 h-10 rounded-full bg-white object-contain p-1" />
            <div className="text-left">
              <p className="font-semibold text-white">{sourceInfo?.name}</p>
              {sourceInfo?.number && <p className="text-sm text-gray-400">(...{sourceInfo.number.slice(-4)})</p>}
            </div>
        </div>
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Số tiền (VND)</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="mt-1 w-full bg-gray-700 rounded-md p-3" autoFocus/>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => { setStep('selectSource'); setError(''); }} className="w-full bg-gray-600 font-bold py-3 rounded-lg">Đổi nguồn tiền</button>
            <button type="submit" className="w-full bg-primary-600 font-bold py-3 rounded-lg">Nạp tiền</button>
        </div>
    </form>
  );

  const renderStep = () => {
    switch(step) {
      case 'selectBank': return renderSelectBank();
      case 'addCard': return renderAddCard();
      case 'enterAmount': return renderEnterAmount();
      case 'selectSource':
      default: return renderSelectSource();
    }
  }

  return (
    <>
      {isQrScanning && <CameraScanModal onScanSuccess={handleQrScanSuccess} onClose={() => setIsQrScanning(false)} scanType='paymentQR' />}
      {isScanning && <CameraScanModal onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} scanType='card' />}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up">
          {renderStep()}
        </div>
      </div>
    </>
  );
};

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// --- New LuckyMoneyClaimModal Component ---
const LuckyMoneyClaimModal: React.FC<{
  packet: LuckyMoneyPacket;
  claimAmount: number;
  currentUser: User;
  onClose: () => void;
  currency: Currency;
}> = ({ packet, claimAmount, currentUser, onClose, currency }) => {
    const fromUser = packet.isAnonymous ? 'Một người bạn ẩn danh' : packet.creatorName;
    const fromAvatar = packet.isAnonymous ? `https://api.dicebear.com/8.x/initials/svg?seed=ẩn%20danh` : packet.creatorAvatar;
    const isPacketEmpty = packet.claims.length >= packet.quantity;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="w-full max-w-sm text-center animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="relative bg-gradient-to-b from-red-600 to-red-800 rounded-t-2xl p-6 border-b-4 border-yellow-400">
                    <img src={fromAvatar} alt={fromUser} className="w-16 h-16 rounded-full border-2 border-yellow-300 mx-auto -mb-8" />
                </div>
                <div className="bg-gray-800 rounded-b-2xl p-6 pt-12">
                     <p className="text-lg font-semibold text-gray-300">{fromUser} đã gửi</p>
                    <p className="text-2xl font-bold text-white my-2">"{packet.message}"</p>
                    <p className="text-4xl font-bold text-yellow-400 my-4">{formatCurrency(claimAmount, currency)}</p>

                    <div className="my-6 border-t border-gray-700">
                        <p className="text-xs text-gray-500 pt-2">{packet.claims.length}/{packet.quantity} lì xì đã được nhận</p>
                        <div className="max-h-32 overflow-y-auto space-y-2 mt-2 pr-2">
                            {packet.claims.map(claim => (
                                <div key={claim.userId} className="flex items-center justify-between text-sm bg-gray-700/50 p-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <img src={claim.userAvatar} alt={claim.userName} className="w-6 h-6 rounded-full" />
                                        <span className={claim.userId === currentUser.walletId ? 'font-bold text-white' : 'text-gray-300'}>{claim.userName}</span>
                                    </div>
                                    <span className="font-semibold text-yellow-500">{formatCurrency(claim.amount, currency)}</span>
                                </div>
                            ))}
                        </div>
                         {isPacketEmpty && <p className="text-yellow-400 text-sm font-bold mt-3">Lì xì đã được nhận hết!</p>}
                    </div>

                    <button onClick={onClose} className="w-full bg-primary-600 font-bold py-3 rounded-lg">Đóng</button>
                </div>
            </div>
        </div>
    );
};


type AppNotification = Transaction & { notifId: number };

type View = 'dashboard' | 'history' | 'send' | 'profile' | 'rewards' | 'billPayment';
type Modal = 'add' | 'withdraw' | 'setGoal' | 'addToSavings' | 'qrScan' | 'loanApplication' | 'setupRecurring' | null;
type HistoryViewMode = 'compact' | 'detailed';

// Mock data for loans
const availableLoans: Loan[] = [
    {
        id: 'loan-001',
        name: 'Vay Tiêu Dùng Nhanh',
        description: 'Giải pháp tài chính linh hoạt cho các nhu cầu chi tiêu cá nhân, thủ tục đơn giản, giải ngân trong 24h.',
        interestRate: 0.15, // 15%
        maxAmount: 50000000,
        minTerm: 6,
        maxTerm: 36,
        minCreditScore: 450,
        provider: 'Tài chính Tốc độ Vay',
        criteria: [
            'Công dân Việt Nam, độ tuổi từ 20-60.',
            'Có thu nhập hàng tháng tối thiểu 5,000,000 VND.',
            'Không có nợ xấu tại các tổ chức tín dụng khác.',
        ],
        terms: [
            'Lãi suất được tính trên dư nợ giảm dần.',
            'Phí trả nợ trước hạn là 2% trên số tiền gốc còn lại.',
            'Lãi suất quá hạn là 150% lãi suất trong hạn.',
            'Tất cả các tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền.',
        ]
    },
    {
        id: 'loan-002',
        name: 'Vay Mua Sắm Trả Góp 0%',
        description: 'Hợp tác với các sàn TMĐT lớn, mua sắm thả ga với lãi suất 0% trong 6 tháng đầu.',
        interestRate: 0.12, // 12% after first 6 months
        maxAmount: 20000000,
        minTerm: 3,
        maxTerm: 24,
        minCreditScore: 600,
        provider: 'Đối tác Mua sắm thông minh',
        criteria: [
            'Là khách hàng thân thiết của Ví Điện Tử Sinh Lời (hạng Bạc trở lên).',
            'Lịch sử tín dụng tốt, không có nợ quá hạn.',
            'Chứng minh được mục đích mua sắm (cung cấp link sản phẩm, hóa đơn tạm tính).',
        ],
        terms: [
            'Miễn lãi 6 tháng đầu cho các khoản vay dưới 10,000,000 VND.',
            'Áp dụng lãi suất 12%/năm từ tháng thứ 7.',
            'Chương trình chỉ áp dụng tại các đối tác liên kết.',
        ]
    },
    {
        id: 'loan-003',
        name: 'Vay Hỗ Trợ Học Phí',
        description: 'Đầu tư cho tương lai với gói vay ưu đãi dành riêng cho học sinh, sinh viên và người đi làm muốn nâng cao kiến thức.',
        interestRate: 0.08, // 8%
        maxAmount: 100000000,
        minTerm: 12,
        maxTerm: 60,
        minCreditScore: 680,
        provider: 'Quỹ khuyến học Tương Lai',
        criteria: [
            'Là học sinh, sinh viên các trường Đại học, Cao đẳng, hoặc học viên các khóa học được công nhận.',
            'Cung cấp được giấy báo nhập học hoặc thẻ sinh viên/học viên.',
            'Yêu cầu người bảo lãnh nếu dưới 22 tuổi hoặc không có thu nhập.',
        ],
        terms: [
            'Ân hạn trả gốc trong suốt thời gian học, chỉ trả lãi.',
            'Bắt đầu trả gốc và lãi sau 6 tháng kể từ ngày tốt nghiệp.',
            'Lãi suất ưu đãi cố định trong suốt thời gian vay.',
        ]
    },
    {
        id: 'loan-004',
        name: 'Vay Nóng Trong Ngày',
        description: 'Cần tiền gấp? Giải ngân siêu tốc trong vòng 2 giờ. Phù hợp cho các nhu cầu khẩn cấp.',
        interestRate: 0.35, // 35%
        maxAmount: 10000000,
        minTerm: 1,
        maxTerm: 3,
        minCreditScore: 400,
        provider: 'Tài chính Tia Chớp',
        criteria: ['CMND/CCCD còn hiệu lực.', 'Trên 18 tuổi.', 'Là người dùng đã xác thực của Ví.'],
        terms: ['Lãi suất tính theo ngày.', 'Phí phạt trễ hạn cao.', 'Không yêu cầu chứng minh thu nhập.'],
        tag: 'Trong Ngày',
    },
    {
        id: 'loan-005',
        name: 'Vay Tạm Ứng Nhanh 7-30 ngày',
        description: 'Giải pháp tạm ứng chi tiêu ngắn hạn, linh hoạt. Trả nợ một lần khi đến hạn.',
        interestRate: 0.25, // 25%
        maxAmount: 5000000,
        minTerm: 1,
        maxTerm: 1,
        minCreditScore: 500,
        provider: 'Dịch vụ Tài chính Linh hoạt',
        criteria: ['Có tối thiểu 3 giao dịch trong tháng gần nhất.', 'Độ tuổi 18-50.'],
        terms: ['Trả cả gốc và lãi một lần vào cuối kỳ hạn (7, 15 hoặc 30 ngày).', 'Có thể gia hạn một lần có tính phí.'],
        tag: 'Ngắn Hạn',
    }
];

// Mock data for rewards system
const initialTasks: RewardTask[] = [
    {
        id: 'task-001',
        title: 'Chuyển tiền 5 lần',
        description: 'Thực hiện 5 giao dịch chuyển tiền đến Ví khác để nhận thưởng.',
        coins: 50,
        targetCount: 5,
        currentCount: 0,
        lastResetDate: '',
    },
    {
        id: 'task-002',
        title: 'Tiết kiệm lần đầu',
        description: 'Thêm tiền vào mục tiêu tiết kiệm lần đầu tiên.',
        coins: 100,
        targetCount: 1,
        currentCount: 0,
        lastResetDate: '',
    }
];

const initialVouchers: Voucher[] = [
    { id: 'v-01', merchantName: 'Highlands Coffee', merchantLogo: 'https://cdn.iconscout.com/icon/free/png-256/free-highlands-coffee-3442222-2878220.png', description: 'Giảm 20K cho đơn từ 50K', coinCost: 200 },
    { id: 'v-02', merchantName: 'The Coffee House', merchantLogo: 'https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-The-Coffee-House-H.png', description: 'Mua 1 tặng 1 (dòng trà)', coinCost: 350 },
    { id: 'v-03', merchantName: 'Phúc Long', merchantLogo: 'https://static.ybox.vn/2022/4/5/1649124976495-200.png', description: 'Giảm 15% tổng hóa đơn', coinCost: 300 },
    { id: 'v-04', merchantName: 'KFC', merchantLogo: 'https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/2048px-KFC_logo.svg.png', description: 'Miễn phí 1 lon Pepsi', coinCost: 50 },
];

const viewOrder: Record<string, number> = {
  dashboard: 0,
  history: 1,
  send: 2, // Central button is conceptually in the middle
  rewards: 3,
  profile: 4,
};

const modalViews: View[] = ['send', 'billPayment'];
const tabViews: View[] = ['dashboard', 'history', 'rewards', 'profile'];

const CHATBOT_TIPS = [
    "Bạn có muốn xem tóm tắt chi tiêu không?",
    "Hỏi tôi về các gói vay nhé!",
    "Làm sao để tăng điểm tín dụng?",
    "Tôi có thể phân tích giao dịch giúp bạn.",
];

const ChatbotTip: React.FC<{ tipText: string; onOpenChatbot: () => void; onDismiss: (e: React.MouseEvent) => void; }> = ({ tipText, onOpenChatbot, onDismiss }) => (
    <div className="absolute bottom-20 right-0 w-64 mb-2 animate-fade-in-up" onClick={onOpenChatbot}>
        <div className="bg-gray-700 p-3 rounded-lg shadow-lg relative cursor-pointer">
            <button
                onClick={onDismiss}
                className="absolute -top-2 -right-2 bg-gray-600 rounded-full p-0.5 text-white z-10"
                aria-label="Đóng mẹo"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
            <p className="text-sm text-white">{tipText}</p>
            {/* Speech bubble pointer */}
            <div className="absolute right-6 -bottom-2 w-4 h-4 bg-gray-700 transform rotate-45"></div>
        </div>
    </div>
);

const SplashScreen: React.FC = () => (
    <div className="bg-gray-900 h-screen flex flex-col items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-4">
            <WalletIcon className="w-20 h-20 text-primary-500 animate-scale-in" style={{ animationDelay: '200ms' }} />
            <h1 className="text-3xl font-bold text-white animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                Ví Điện Tử Sinh Lời
            </h1>
        </div>
    </div>
);


const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('wallet-user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  });
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('wallet-balance');
    return saved ? parseFloat(saved) : 0;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('wallet-transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
   const [linkedAccounts, setLinkedAccounts] = useState<LinkedBankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('wallet-linkedAccounts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
   const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => {
    try {
        const saved = localStorage.getItem('wallet-recurringTransactions');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        return [];
    }
  });
  const [luckyMoneyPackets, setLuckyMoneyPackets] = useState<LuckyMoneyPacket[]>(() => {
    try {
        const saved = localStorage.getItem('wallet-luckyMoneyPackets');
        return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });
  const [profitRate, setProfitRate] = useState<number>(() => {
    const saved = localStorage.getItem('wallet-profitRate');
    return saved ? parseFloat(saved) : 0.0001; // Default 0.01%
  });
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(() => {
    try {
      const saved = localStorage.getItem('wallet-savingsGoal');
      return saved ? JSON.parse(saved) : null;
    } catch (error) { return null; }
  });
  const [savingsProgress, setSavingsProgress] = useState<number>(() => {
    const saved = localStorage.getItem('wallet-savingsProgress');
    return saved ? parseFloat(saved) : 0;
  });
  const [defaultMessages, setDefaultMessages] = useState<DefaultMessage[]>(() => {
    const saved = localStorage.getItem('wallet-defaultMessages');
    const defaultData = [
        { text: 'Chuyển tiền ăn trưa', icon: '🥪' },
        { text: 'Gửi bạn tiền cafe', icon: '☕️' },
        { text: 'Chúc mừng sinh nhật!', icon: '🎉' },
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check: if old data is just an array of strings
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed.map((text: string) => ({ text, icon: '' }));
        }
        return parsed;
      } catch (e) {
        return defaultData;
      }
    }
    return defaultData;
  });
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('wallet-currency') as Currency | null;
    return saved || 'VND';
  });
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('wallet-theme');
    return saved || 'blue';
  });
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('wallet-biometricEnabled');
    return saved === 'true';
  });
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('wallet-balanceVisible');
    return saved ? JSON.parse(saved) : true;
  });
  const [transactionLimits, setTransactionLimits] = useState<{ daily: number; perTransaction: number; }>(() => {
      const saved = localStorage.getItem('wallet-transactionLimits');
      return saved ? JSON.parse(saved) : { daily: 50_000_000, perTransaction: 20_000_000 };
  });
  
  // Rewards state
  const [rewardTasks, setRewardTasks] = useState<RewardTask[]>(() => {
    const saved = localStorage.getItem('wallet-rewardTasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });
  const [availableVouchers] = useState<Voucher[]>(initialVouchers);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>(() => {
    const saved = localStorage.getItem('wallet-userVouchers');
    return saved ? JSON.parse(saved) : [];
  });


  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [recurringTemplate, setRecurringTemplate] = useState<Transaction | null>(null);
  const [successfulTransaction, setSuccessfulTransaction] = useState<Transaction | null>(null);
  const [historyViewMode, setHistoryViewMode] = useState<HistoryViewMode>('detailed');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [biometricRequest, setBiometricRequest] = useState<{ onConfirm: () => void; onCancel: () => void; title: string } | null>(null);
  const [otpRequest, setOtpRequest] = useState<{ onConfirm: () => Promise<void>; title: string } | null>(null);
  const [claimedLuckyMoneyInfo, setClaimedLuckyMoneyInfo] = useState<{packet: LuckyMoneyPacket, amount: number} | null>(null);

  const [viewAnimationClass, setViewAnimationClass] = useState('animate-fade-in');
  const prevViewRef = useRef<View>(currentView);
  
  // State for floating chatbot tip
  const [showChatbotTip, setShowChatbotTip] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Splash screen effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const oldView = prevViewRef.current;
    const newView = currentView;

    if (oldView === newView) return;

    let inClass = 'animate-fade-in';
    
    const oldIsModal = modalViews.includes(oldView);
    const newIsModal = modalViews.includes(newView);
    const oldIndex = viewOrder[oldView];
    const newIndex = viewOrder[newView];
    
    if (newIsModal && !oldIsModal) {
      inClass = 'animate-slide-in-from-bottom';
    } else if (oldIsModal && !newIsModal) {
      inClass = 'animate-fade-in'; 
    } else if (oldIndex !== undefined && newIndex !== undefined) {
      if (newIndex > oldIndex) {
        inClass = 'animate-slide-in-from-right';
      } else if (newIndex < oldIndex) {
        inClass = 'animate-slide-in-from-left';
      }
    }
    
    setViewAnimationClass(inClass);
    prevViewRef.current = newView;
  }, [currentView]);

  const frequentRecipients = useMemo(() => {
    const recipientCounts = transactions
        .filter(tx => tx.type === TransactionType.OUTGOING && tx.recipient)
        // FIX: Explicitly typed the accumulator for the `reduce` function to prevent properties 'count' and 'name' from being treated as 'unknown' in subsequent operations.
        .reduce<Record<string, { count: number; name: string; }>>((acc, tx) => {
            const recipient = tx.recipient!;
            if (!acc[recipient]) {
                acc[recipient] = { count: 0, name: recipient };
            }
            acc[recipient].count++;
            return acc;
        }, {});

    return Object.entries(recipientCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 8)
        .map(([recipientId, data]) => ({
            id: recipientId,
            name: data.name,
            avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
        }));
  }, [transactions]);

  const userCreditScore = useMemo(() => {
    if (!user) return 0;

    let score = 300;

    // Account age
    const issueDate = new Date(user.issueDate);
    const now = new Date();
    const months = (now.getFullYear() - issueDate.getFullYear()) * 12 + (now.getMonth() - issueDate.getMonth());
    score += Math.min(months * 10, 120);

    // Balance
    if (balance > 20000000) score += 250;
    else if (balance > 5000000) score += 150;
    else if (balance > 1000000) score += 50;

    // Transaction volume
    if (transactions.length > 50) score += 150;
    else if (transactions.length > 10) score += 50;

    // Transaction behavior
    const { totalIn, totalOut } = transactions.reduce((acc, tx) => {
        if ([TransactionType.INCOMING, TransactionType.TOPUP, TransactionType.PROFIT, TransactionType.LOAN].includes(tx.type)) {
            acc.totalIn += tx.amount;
        } else if ([TransactionType.OUTGOING, TransactionType.WITHDRAWAL, TransactionType.BILL_PAYMENT, TransactionType.LUCKY_MONEY].includes(tx.type)) {
            acc.totalOut += tx.amount;
        }
        return acc;
    }, { totalIn: 0, totalOut: 0 });
    
    if (totalOut > 0) {
        const ratio = totalIn / totalOut;
        if (ratio > 1.2) score += 100;
        else if (ratio >= 0.8) score += 50;
    } else if (totalIn > 0) {
        score += 100; // Has income but no expenses, good sign
    }
    
    // Savings Goal
    if (savingsGoal && savingsProgress > 0) {
        score += 50;
    }

    return Math.min(Math.floor(score), 999); // Cap score at 999
  }, [user, balance, transactions, savingsGoal, savingsProgress]);

  const spentToday = useMemo(() => {
    if (!user) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions
        .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= today && 
                    [TransactionType.OUTGOING, TransactionType.WITHDRAWAL, TransactionType.BILL_PAYMENT, TransactionType.LUCKY_MONEY].includes(tx.type);
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, user]);


  // Show notification helper
  const showNotification = (transaction: Transaction) => {
    const newNotification: AppNotification = {
      ...transaction,
      notifId: Date.now(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (notifId: number) => {
    setNotifications(prev => prev.filter(n => n.notifId !== notifId));
  };


  // Persist state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('wallet-user', JSON.stringify(user));
      localStorage.setItem('wallet-balance', balance.toString());
      localStorage.setItem('wallet-transactions', JSON.stringify(transactions));
      localStorage.setItem('wallet-linkedAccounts', JSON.stringify(linkedAccounts));
      localStorage.setItem('wallet-recurringTransactions', JSON.stringify(recurringTransactions));
      localStorage.setItem('wallet-luckyMoneyPackets', JSON.stringify(luckyMoneyPackets));
      localStorage.setItem('wallet-profitRate', profitRate.toString());
      if (savingsGoal) {
        localStorage.setItem('wallet-savingsGoal', JSON.stringify(savingsGoal));
      } else {
        localStorage.removeItem('wallet-savingsGoal');
      }
      localStorage.setItem('wallet-savingsProgress', savingsProgress.toString());
      localStorage.setItem('wallet-defaultMessages', JSON.stringify(defaultMessages));
      localStorage.setItem('wallet-currency', currency);
      localStorage.setItem('wallet-theme', theme);
      localStorage.setItem('wallet-biometricEnabled', JSON.stringify(isBiometricEnabled));
      localStorage.setItem('wallet-balanceVisible', JSON.stringify(isBalanceVisible));
      localStorage.setItem('wallet-transactionLimits', JSON.stringify(transactionLimits));
      // Rewards
      localStorage.setItem('wallet-rewardTasks', JSON.stringify(rewardTasks));
      localStorage.setItem('wallet-userVouchers', JSON.stringify(userVouchers));

    } else {
        localStorage.removeItem('wallet-user');
        localStorage.removeItem('wallet-balance');
        localStorage.removeItem('wallet-transactions');
        localStorage.removeItem('wallet-linkedAccounts');
        localStorage.removeItem('wallet-recurringTransactions');
        localStorage.removeItem('wallet-luckyMoneyPackets');
        localStorage.removeItem('wallet-profitRate');
        localStorage.removeItem('wallet-savingsGoal');
        localStorage.removeItem('wallet-savingsProgress');
        localStorage.removeItem('wallet-defaultMessages');
        localStorage.removeItem('wallet-currency');
        localStorage.removeItem('wallet-theme');
        localStorage.removeItem('wallet-biometricEnabled');
        localStorage.removeItem('wallet-balanceVisible');
        localStorage.removeItem('wallet-transactionLimits');
        // Rewards
        localStorage.removeItem('wallet-rewardTasks');
        localStorage.removeItem('wallet-userVouchers');
    }
  }, [user, balance, transactions, linkedAccounts, recurringTransactions, luckyMoneyPackets, profitRate, savingsGoal, savingsProgress, defaultMessages, currency, theme, isBiometricEnabled, isBalanceVisible, transactionLimits, rewardTasks, userVouchers]);
  
  // Apply theme effect
  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = themes[theme] || themes.blue;
    for (const [key, value] of Object.entries(selectedTheme)) {
        root.style.setProperty(`--color-primary-${key}`, value);
    }
  }, [theme]);
  
   // Listen for lucky money claims from URL
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const claimId = urlParams.get('claim_li_xi');
      if (claimId && user) {
          handleClaimLuckyMoney(claimId);
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, [user]); // Rerun when user logs in

  // Profit generation effect
  useEffect(() => {
    const profitInterval = setInterval(() => {
      if (user && balance > 0 && profitRate > 0) {
        const profitAmount = Math.floor(balance * profitRate);
        if (profitAmount > 0) {
          const newTransaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: TransactionType.PROFIT,
            amount: profitAmount,
            description: `Lợi nhuận tự động`,
            date: new Date().toISOString(),
          };
          setBalance(prev => prev + profitAmount);
          setTransactions(prev => [newTransaction, ...prev]);
          showNotification(newTransaction);
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(profitInterval);
  }, [user, balance, profitRate]);
  
   // Recurring transaction processing effect
  useEffect(() => {
    const processRecurringTransactions = () => {
        if (!user) return;

        const now = new Date();
        let balanceChanged = false;
        let newBalance = balance;
        const newTransactions: Transaction[] = [];
        
        const updatedRecurring = recurringTransactions.map(rt => {
            if (!rt.isActive) return rt;

            const dueDate = new Date(rt.nextDueDate);
            if (dueDate > now) return rt;
            
            // Check balance before creating transaction
            if (newBalance < rt.amount) {
                console.warn(`Skipping recurring transaction ${rt.id} due to insufficient funds.`);
                return rt; // Skip this one for now
            }

            // Create new transaction
            const newTx: Transaction = {
                id: `tx-recurring-${rt.id}-${Date.now()}`,
                type: TransactionType.OUTGOING,
                amount: rt.amount,
                description: rt.description,
                date: new Date().toISOString(),
                recipient: rt.recipient,
                category: rt.category,
            };
            newTransactions.push(newTx);
            newBalance -= rt.amount;
            balanceChanged = true;

            // Calculate next due date
            let nextDate = new Date(rt.nextDueDate);
            if (rt.frequency === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (rt.frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (rt.frequency === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            
            // FIX: Corrected typo `newDate` to `nextDate` and fixed type issue by calculating isActive state directly.
            // Deactivate if past end date
            // Because of the `if (!rt.isActive)` guard, rt.isActive is `true` here. We only need to check if it should become `false`.
            const isActive = !(rt.endDate && nextDate > new Date(rt.endDate));

            return { ...rt, nextDueDate: nextDate.toISOString(), isActive };
        });

        if (newTransactions.length > 0) {
            setTransactions(prev => [...newTransactions, ...prev]);
            setRecurringTransactions(updatedRecurring);
            if(balanceChanged) setBalance(newBalance);
            newTransactions.forEach(showNotification);
        }
    };
    
    // Check every 5 seconds for demo purposes
    const recurringInterval = setInterval(processRecurringTransactions, 5000);
    return () => clearInterval(recurringInterval);

  }, [user, balance, transactions, recurringTransactions]);
  
    // This effect runs once on app load for a logged-in user to reset daily tasks.
    useEffect(() => {
        if (!user) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Check if any task needs resetting to avoid unnecessary state updates
        const needsReset = rewardTasks.some(task => task.lastResetDate !== todayStr);

        if (needsReset) {
            setRewardTasks(prevTasks => 
                prevTasks.map(task => 
                    task.lastResetDate !== todayStr 
                    ? { ...task, currentCount: 0, lastResetDate: todayStr } 
                    : task
                )
            );
        }
    }, [user]); // Run only when user object is available, effectively on app load for a user.
    
    // Effect for managing the floating chatbot tip
    useEffect(() => {
        if (isChatbotOpen) {
            setShowChatbotTip(false);
            return;
        }

        const tipInterval = setInterval(() => {
            if (!document.hidden) { // Don't show tips if tab is not active
                setShowChatbotTip(true);
                setCurrentTipIndex(prev => (prev + 1) % CHATBOT_TIPS.length);

                setTimeout(() => {
                    setShowChatbotTip(false);
                }, 8000); // Tip visible for 8 seconds
            }
        }, 15000); // Show a new tip every 15 seconds

        return () => clearInterval(tipInterval);
    }, [isChatbotOpen]);


  const handleCreateWallet = (name: string, gender: 'Nam' | 'Nữ' | 'Khác', avatarUrl: string) => {
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(issueDate.getFullYear() + 5);

    const newUser: User = {
      name: name.toUpperCase(),
      avatarUrl,
      gender,
      walletId: Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join(''),
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      coinBalance: 100, // Welcome gift
    };
    
    setUser(newUser);
    setBalance(500000); // Initial balance for demo
    setRewardTasks(initialTasks); // Set initial tasks for new user
    const welcomeTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: TransactionType.TOPUP,
      amount: 500000,
      description: 'Tiền chào mừng',
      date: new Date().toISOString(),
    };
    setTransactions([welcomeTransaction]);
    showNotification(welcomeTransaction);
  };
  
    const handleTaskProgress = (taskId: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        
        setRewardTasks(currentTasks => {
            let wasTaskCompleted = false;
            let completedTask: RewardTask | null = null;
            
            const updatedTasks = currentTasks.map(task => {
                // Check if this is the right task, for the right day, and not yet finished
                if (task.id === taskId && task.lastResetDate === todayStr && task.currentCount < task.targetCount) {
                    const newCount = task.currentCount + 1;
                    const updatedTask = { ...task, currentCount: newCount };
                    
                    // Check if this update completes the task
                    if (newCount >= task.targetCount) {
                        wasTaskCompleted = true;
                        completedTask = updatedTask;
                    }
                    return updatedTask;
                }
                return task;
            });
            
            // If a task was just completed, award coins.
            if (wasTaskCompleted && completedTask) {
                const finalCompletedTask = completedTask; // To satisfy TS null check
                setUser(currentUser => {
                    if (!currentUser) return null;
                    const newCoinBalance = currentUser.coinBalance + finalCompletedTask.coins;
                    
                    showNotification({
                        id: `notif-coin-${finalCompletedTask.id}`,
                        type: TransactionType.COIN,
                        amount: finalCompletedTask.coins,
                        description: `Hoàn thành: ${finalCompletedTask.title}`,
                        date: new Date().toISOString(),
                    });
                    
                    return { ...currentUser, coinBalance: newCoinBalance };
                });
            }

            return updatedTasks;
        });
    };

  const handleSendMoney = ({ recipientId, amount, message }: { recipientId: string; amount: number; message: string; }) => {
    return new Promise<void>((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: TransactionType.OUTGOING,
          amount: amount,
          description: message || 'Chuyển tiền',
          date: new Date().toISOString(),
          recipient: recipientId,
        };
        setBalance(prev => prev - amount);
        setTransactions(prev => [newTransaction, ...prev]);
        showNotification(newTransaction);
        setSuccessfulTransaction(newTransaction);
        
        handleTaskProgress('task-001');

        resolve();
      }, 1500); 
    });
  };
  
  const handleBankTransfer = ({ bankInfo, amount, message }: { bankInfo: string; amount: number; message: string; }) => {
     const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: TransactionType.OUTGOING,
      amount: amount,
      description: message || `Chuyển tiền tới ${bankInfo.split(',')[0]}`,
      date: new Date().toISOString(),
      recipient: bankInfo,
    };
    setBalance(prev => prev - amount);
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification(newTransaction);
    setSuccessfulTransaction(newTransaction);
  };
  
    const handleCreateLuckyMoneyPacket = (details: Omit<LuckyMoneyPacket, 'id' | 'shareId' | 'creatorUserId' | 'creatorName' | 'creatorAvatar' | 'claims' | 'creationDate'>): Promise<LuckyMoneyPacket | null> => {
        return new Promise((resolve) => {
            if (!user) {
                resolve(null);
                return;
            }
            if (balance < details.totalAmount) {
                // In a real app, you'd throw an error here for the form to catch
                alert('Số dư không đủ!');
                resolve(null);
                return;
            }

            // 1. Deduct balance and create transaction
            setBalance(prev => prev - details.totalAmount);
            const newTransaction: Transaction = {
                id: `tx-lixi-create-${Date.now()}`,
                type: TransactionType.LUCKY_MONEY,
                amount: details.totalAmount,
                description: `Tạo lì xì: ${details.message}`,
                date: new Date().toISOString(),
                recipient: `${details.quantity} người`,
            };
            setTransactions(prev => [newTransaction, ...prev]);
            showNotification(newTransaction);

            // 2. Create the packet
            const newPacket: LuckyMoneyPacket = {
                ...details,
                id: `lixi-${Date.now()}`,
                shareId: `lixi-share-${Math.random().toString(36).substring(2, 9)}`,
                creatorUserId: user.walletId,
                creatorName: user.name,
                creatorAvatar: user.avatarUrl,
                claims: [],
                creationDate: new Date().toISOString(),
            };

            // 3. Save packet to state
            setLuckyMoneyPackets(prev => [...prev, newPacket]);
            
            resolve(newPacket);
        });
    };

    const handleClaimLuckyMoney = (shareId: string) => {
        if (!user) return; // Should not happen, but a good guard

        setLuckyMoneyPackets(prevPackets => {
            const packetIndex = prevPackets.findIndex(p => p.shareId === shareId);
            if (packetIndex === -1) {
                alert('Lì xì không tồn tại!');
                return prevPackets;
            }

            const newPackets = [...prevPackets];
            const packet = { ...newPackets[packetIndex] };
            packet.claims = [...packet.claims];

            // Validations
            if (packet.claims.length >= packet.quantity) {
                alert('Lì xì đã được nhận hết!');
                 setClaimedLuckyMoneyInfo({ packet, amount: 0 }); // Show who claimed
                return newPackets;
            }
            if (packet.claims.some(c => c.userId === user.walletId)) {
                alert('Bạn đã nhận lì xì này rồi!');
                 setClaimedLuckyMoneyInfo({ packet, amount: 0 });
                return newPackets;
            }
             if (packet.creatorUserId === user.walletId) {
                alert('Bạn không thể nhận lì xì của chính mình!');
                 setClaimedLuckyMoneyInfo({ packet, amount: 0 });
                return newPackets;
            }

            // Calculate amount
            let claimAmount = 0;
            const totalClaimed = packet.claims.reduce((sum, c) => sum + c.amount, 0);
            const remainingAmount = packet.totalAmount - totalClaimed;
            const remainingClaims = packet.quantity - packet.claims.length;

            if (packet.type === 'equal') {
                claimAmount = Math.floor(packet.totalAmount / packet.quantity);
            } else { // Random
                if (remainingClaims === 1) {
                    claimAmount = remainingAmount;
                } else {
                    const minAmount = 1;
                    const maxForThisClaim = remainingAmount - (remainingClaims - 1) * minAmount;
                    claimAmount = Math.floor(Math.random() * (maxForThisClaim - minAmount)) + minAmount;
                }
            }
            claimAmount = Math.max(1, claimAmount); // Ensure at least 1

            // Update state
            setBalance(prev => prev + claimAmount);
            
            const newTransaction: Transaction = {
                id: `tx-lixi-claim-${Date.now()}`,
                type: TransactionType.LUCKY_MONEY,
                amount: claimAmount,
                description: `Nhận lì xì từ ${packet.isAnonymous ? 'Người ẩn danh' : packet.creatorName}`,
                date: new Date().toISOString(),
                sender: packet.creatorName,
            };
            setTransactions(prev => [newTransaction, ...prev]);
            
            packet.claims.push({
                userId: user.walletId,
                userName: user.name,
                userAvatar: user.avatarUrl,
                amount: claimAmount,
                claimDate: new Date().toISOString(),
            });

            newPackets[packetIndex] = packet;
            setClaimedLuckyMoneyInfo({ packet, amount: claimAmount });

            return newPackets;
        });
    };

  
  const handleLinkAccount = async (accountDetails: Omit<LinkedBankAccount, 'id' | 'logoUrl'>): Promise<LinkedBankAccount> => {
    await new Promise(res => setTimeout(res, 500)); // Simulate network delay
    const bankDomain = `${accountDetails.bankName.toLowerCase().replace(/\s/g, '').replace('bank','').trim()}`;
    const newAccount: LinkedBankAccount = {
        id: `acc-${Date.now()}`,
        ...accountDetails,
        logoUrl: `https://api.vietqr.io/img/${bankDomain.toUpperCase()}.png`,
    };
    setLinkedAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const handleAddFunds = (amount: number, sourceDescription: string) => {
    const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: TransactionType.TOPUP,
        amount,
        description: sourceDescription,
        date: new Date().toISOString(),
    };
    setBalance(prev => prev + amount);
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification(newTransaction);
    setModal(null);
    setSuccessfulTransaction(newTransaction);
  };

  const handleWithdrawMoney = ({ amount, bankInfo, message }: { amount: number; bankInfo: string; message: string; }) => {
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: TransactionType.WITHDRAWAL,
      amount: amount,
      description: message || `Rút tiền về ${bankInfo.split(',')[0]}`,
      date: new Date().toISOString(),
    };
    setBalance(prev => prev - amount);
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification(newTransaction);
    setModal(null);
    setSuccessfulTransaction(newTransaction);
  };

  const handleApplyForLoan = ({ loan, amount }: { loan: Loan, amount: number }) => {
    const newTransaction: Transaction = {
        id: `tx-loan-${Date.now()}`,
        type: TransactionType.LOAN,
        amount: amount,
        description: `Giải ngân khoản vay: ${loan.name}`,
        date: new Date().toISOString(),
    };
    setBalance(prev => prev + amount);
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification(newTransaction);
    setModal(null);
    setSuccessfulTransaction(newTransaction);
  };

    const handlePayBill = (provider: { name: string }, bill: BillDetails) => {
        const newTransaction: Transaction = {
            id: `tx-bill-${Date.now()}`,
            type: TransactionType.BILL_PAYMENT,
            amount: bill.amountDue,
            description: `Thanh toán ${provider.name} - ${bill.customerId}`,
            date: new Date().toISOString(),
            recipient: provider.name,
            category: 'Hóa đơn',
        };
        setBalance(prev => prev - bill.amountDue);
        setTransactions(prev => [newTransaction, ...prev]);
        showNotification(newTransaction);
        setSuccessfulTransaction(newTransaction);
    };
  
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseDetailModal = () => {
    setSelectedTransaction(null);
  };

  const handleSetSavingsGoal = (goal: SavingsGoal) => {
    if (goal.name === '' && goal.targetAmount === 0) {
        setSavingsGoal(null);
        setSavingsProgress(0); // Optionally reset progress when goal is deleted
    } else {
        setSavingsGoal(goal);
    }
    setModal(null);
  };
  
  const handleAddToSavings = (amount: number) => {
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: TransactionType.OUTGOING,
      amount: amount,
      description: `Tiết kiệm cho: ${savingsGoal?.name || 'Mục tiêu'}`,
      date: new Date().toISOString(),
      recipient: "Mục tiêu tiết kiệm",
    };
    setBalance(prev => prev - amount);
    setSavingsProgress(prev => prev + amount);
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification(newTransaction);
    
    // Show success message in modal instead of full-screen view
    setTimeout(() => {
        setModal(null);
    }, 2000);
    
    handleTaskProgress('task-002');
  };

  const handleDoneSuccess = () => {
    setSuccessfulTransaction(null);
    setCurrentView('dashboard');
  };
  
  const handleSetupRecurring = (transaction: Transaction) => {
    setRecurringTemplate(transaction);
    setSelectedTransaction(null); // Close detail modal
    setModal('setupRecurring');
  };
  
  const handleSaveRecurring = (config: Omit<RecurringTransaction, 'id'>) => {
    const newRecurring: RecurringTransaction = {
        id: `recurring-${Date.now()}`,
        ...config,
    };
    setRecurringTransactions(prev => [...prev, newRecurring]);
    setModal(null);
    setRecurringTemplate(null);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
  };

  const handleToggleRecurringActive = (id: string) => {
    setRecurringTransactions(prev =>
        prev.map(rt =>
            rt.id === id ? { ...rt, isActive: !rt.isActive } : rt
        )
    );
  };
  
  const handleRedeemVoucher = (voucherId: string) => {
    const voucher = availableVouchers.find(v => v.id === voucherId);
    if (!voucher || !user) return;

    if (user.coinBalance < voucher.coinCost) {
        showNotification({
            id: `notif-err-${Date.now()}`,
            type: TransactionType.OUTGOING,
            amount: voucher.coinCost,
            description: 'Không đủ Xu để đổi voucher này!',
            date: new Date().toISOString(),
        });
        return;
    }

    const updatedUser = { ...user, coinBalance: user.coinBalance - voucher.coinCost };
    setUser(updatedUser);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const newUserVoucher: UserVoucher = {
        id: `uv-${Date.now()}`,
        voucherId: voucher.id,
        merchantName: voucher.merchantName,
        merchantLogo: voucher.merchantLogo,
        description: voucher.description,
        code: `${voucher.merchantName.replace(/\s/g, '').toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        expiryDate: expiry.toISOString(),
        isUsed: false,
    };
    setUserVouchers(prev => [...prev, newUserVoucher]);

    showNotification({
        id: `notif-redeem-${Date.now()}`,
        type: TransactionType.COIN,
        amount: -voucher.coinCost,
        description: `Đổi voucher ${voucher.merchantName}`,
        date: new Date().toISOString(),
    });
  };

  const requestBiometricAuth = (onConfirm: () => void, title: string) => {
    setBiometricRequest({
        onConfirm,
        onCancel: () => setBiometricRequest(null),
        title
    });
  };
  
  const requestOtpVerification = (onConfirm: () => Promise<void>, title: string) => {
      setOtpRequest({ onConfirm, title });
  };
  
  const handleOtpConfirm = async () => {
      if (otpRequest) {
          await otpRequest.onConfirm();
          setOtpRequest(null); // Close OTP modal on success
          return true;
      }
      return false;
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <CreateWalletForm onCreateWallet={handleCreateWallet} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'history':
        return <History 
            transactions={transactions} 
            recurringTransactions={recurringTransactions}
            onViewTransaction={handleViewTransaction}
            onDeleteRecurring={handleDeleteRecurring}
            onToggleRecurringActive={handleToggleRecurringActive}
            viewMode={historyViewMode}
            onViewModeChange={setHistoryViewMode}
            currency={currency}
        />;
      case 'send':
        return <SendView 
            user={user}
            balance={balance}
            currency={currency}
            defaultMessages={defaultMessages}
            isBiometricEnabled={isBiometricEnabled}
            frequentRecipients={frequentRecipients}
            linkedAccounts={linkedAccounts}
            onSendMoney={handleSendMoney}
            onBankTransfer={handleBankTransfer}
            onCreateLuckyMoneyPacket={handleCreateLuckyMoneyPacket}
            onRequestBiometricAuth={requestBiometricAuth}
            onRequestOtpVerification={requestOtpVerification}
            setModal={setModal}
            transactionLimits={transactionLimits}
            spentToday={spentToday}
        />;
      case 'profile':
        return <Profile 
            user={user} 
            profitRate={profitRate} 
            defaultMessages={defaultMessages}
            currency={currency}
            theme={theme}
            isBiometricEnabled={isBiometricEnabled}
            onSetDefaultMessages={setDefaultMessages}
            onSetCurrency={setCurrency}
            onSetTheme={setTheme}
            onSetBiometricEnabled={setIsBiometricEnabled}
            transactionLimits={transactionLimits}
            onSetTransactionLimits={setTransactionLimits}
        />;
      case 'rewards':
        return <Rewards 
            user={user}
            tasks={rewardTasks}
            availableVouchers={availableVouchers}
            userVouchers={userVouchers}
            onRedeemVoucher={handleRedeemVoucher}
        />;
       case 'billPayment':
        return <BillPaymentView
            balance={balance}
            currency={currency}
            onPay={handlePayBill}
            onBack={() => setCurrentView('dashboard')}
            isBiometricEnabled={isBiometricEnabled}
            onRequestBiometricAuth={requestBiometricAuth}
            onRequestOtpVerification={requestOtpVerification}
            transactionLimits={transactionLimits}
            spentToday={spentToday}
        />;
      case 'dashboard':
      default:
        return <Dashboard 
          user={user} 
          balance={balance} 
          transactions={transactions} 
          savingsGoal={savingsGoal}
          savingsProgress={savingsProgress}
          currency={currency}
          isBalanceVisible={isBalanceVisible}
          onToggleBalanceVisibility={() => setIsBalanceVisible(prev => !prev)}
          onAddFunds={() => setModal('add')}
          onWithdrawMoney={() => setModal('withdraw')}
          onApplyForLoan={() => setModal('loanApplication')}
          onPayBills={() => setCurrentView('billPayment')}
          onViewTransaction={handleViewTransaction}
          onSetGoal={() => setModal('setGoal')}
          onAddToSavings={() => setModal('addToSavings')}
          onViewHistory={() => setCurrentView('history')}
        />;
    }
  };

  return (
    <div className="bg-gray-900 h-screen font-sans text-white flex flex-col overflow-hidden">
       <main className="flex-grow overflow-y-auto pb-28 no-scrollbar">
        {successfulTransaction ? (
            <div className="p-4 md:p-6">
                <TransactionSuccess transaction={successfulTransaction} onDone={handleDoneSuccess} currency={currency} />
            </div>
        ) : (
            <div key={currentView} className={`p-4 md:p-6 ${viewAnimationClass}`}>
                {renderView()}
            </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {claimedLuckyMoneyInfo && <LuckyMoneyClaimModal packet={claimedLuckyMoneyInfo.packet} claimAmount={claimedLuckyMoneyInfo.amount} currentUser={user} onClose={() => setClaimedLuckyMoneyInfo(null)} currency={currency} />}
      {modal === 'qrScan' && <CameraScanModal onScanSuccess={(data) => {
          // A bit of a hack to pass scanned data to the SendView flow
          // In a real app, this would use a router or state management library
          try {
            const parsed = JSON.parse(data);
            if (parsed.walletId) {
                const recipient = {
                    id: parsed.walletId,
                    name: parsed.name || parsed.walletId,
                    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(parsed.name || parsed.walletId)}`
                };
                // Temporarily store in localStorage for SendView to pick up
                localStorage.setItem('qr_scanned_recipient', JSON.stringify(recipient));
                setCurrentView('send');
            }
          } catch(e) { console.error("Invalid QR"); }
          setModal(null);
      }} onClose={() => setModal(null)} scanType="paymentQR" />}
      {modal === 'loanApplication' && <LoanApplicationModal user={user} userCreditScore={userCreditScore} availableLoans={availableLoans} balance={balance} currency={currency} onApply={handleApplyForLoan} onCancel={() => setModal(null)} isBiometricEnabled={isBiometricEnabled} onRequestBiometricAuth={requestBiometricAuth} onRequestOtpVerification={requestOtpVerification} />}
      
      {modal === 'add' && <AddFundsForm onAdd={handleAddFunds} onCancel={() => setModal(null)} onLinkAccount={handleLinkAccount} linkedAccounts={linkedAccounts} />}
      {modal === 'withdraw' && <WithdrawMoneyForm balance={balance} onWithdraw={handleWithdrawMoney} onCancel={() => setModal(null)} currency={currency} linkedAccounts={linkedAccounts} isBiometricEnabled={isBiometricEnabled} onRequestBiometricAuth={requestBiometricAuth} onRequestOtpVerification={requestOtpVerification} transactionLimits={transactionLimits} spentToday={spentToday} />}
      {modal === 'setGoal' && <SavingsGoalModal onSave={handleSetSavingsGoal} onCancel={() => setModal(null)} existingGoal={savingsGoal} />}
      {modal === 'addToSavings' && <AddToSavingsModal onAdd={handleAddToSavings} onCancel={() => setModal(null)} balance={balance} goalName={savingsGoal?.name || ''} currency={currency} />}
      {recurringTemplate && modal === 'setupRecurring' && (
        <SetupRecurringTransactionModal
          templateTransaction={recurringTemplate}
          onSave={handleSaveRecurring}
          onCancel={() => { setModal(null); setRecurringTemplate(null); }}
        />
      )}
      {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} onClose={handleCloseDetailModal} currency={currency} onSetupRecurring={handleSetupRecurring} />}
      
      {isChatbotOpen && (
        <Chatbot 
            user={user}
            balance={balance}
            transactions={transactions}
            loans={availableLoans}
            currency={currency}
            onClose={() => setIsChatbotOpen(false)}
            savingsGoal={savingsGoal}
            savingsProgress={savingsProgress}
            userCreditScore={userCreditScore}
        />
      )}
      
      {otpRequest && (
        <OtpVerificationModal
            title={otpRequest.title}
            onConfirm={handleOtpConfirm}
            onCancel={() => setOtpRequest(null)}
        />
      )}

      {biometricRequest && (
        <BiometricPrompt 
            title={biometricRequest.title}
            onSuccess={() => {
                biometricRequest.onConfirm();
                setBiometricRequest(null);
            }}
            onCancel={biometricRequest.onCancel}
        />
      )}

      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-3">
        {notifications.map(notif => (
          <Notification 
            key={notif.notifId} 
            transaction={notif} 
            onClose={() => removeNotification(notif.notifId)}
            currency={currency}
          />
        ))}
      </div>

      {!successfulTransaction && (
        <>
         <div className="fixed bottom-24 right-4 z-40">
             {showChatbotTip && !isChatbotOpen && (
                <ChatbotTip
                    tipText={CHATBOT_TIPS[currentTipIndex]}
                    onOpenChatbot={() => {
                        setIsChatbotOpen(true);
                        setShowChatbotTip(false);
                    }}
                    onDismiss={(e) => {
                        e.stopPropagation();
                        setShowChatbotTip(false);
                    }}
                />
            )}
            <button
                onClick={() => setIsChatbotOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
                aria-label="Open AI Assistant"
            >
                <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />
            </button>
         </div>
         {/* New Floating Navigation Bar */}
         <nav className="fixed bottom-0 inset-x-0 h-24 z-40 flex justify-center items-center">
            <div className="relative flex items-center justify-around w-full max-w-sm mx-auto bg-gray-800/70 backdrop-blur-lg rounded-full shadow-2xl border border-gray-700/80 h-16 px-3">
                
                {/* Left side buttons */}
                <button onClick={() => setCurrentView('dashboard')} className="flex flex-col items-center justify-center gap-1 w-1/5 h-full transition-colors duration-200 group" aria-current={currentView === 'dashboard' ? 'page' : undefined}>
                    <HomeIcon className={`w-6 h-6 transition-colors ${currentView === 'dashboard' ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className={`text-xs transition-colors ${currentView === 'dashboard' ? 'text-primary-400 font-semibold' : 'text-gray-500 group-hover:text-gray-300'}`}>Trang chủ</span>
                </button>
                <button onClick={() => setCurrentView('history')} className="flex flex-col items-center justify-center gap-1 w-1/5 h-full transition-colors duration-200 group" aria-current={currentView === 'history' ? 'page' : undefined}>
                    <HistoryIcon className={`w-6 h-6 transition-colors ${currentView === 'history' ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className={`text-xs transition-colors ${currentView === 'history' ? 'text-primary-400 font-semibold' : 'text-gray-500 group-hover:text-gray-300'}`}>Lịch sử</span>
                </button>

                {/* Central button placeholder */}
                <div className="w-1/5" aria-hidden="true"></div>

                {/* Right side buttons */}
                <button onClick={() => setCurrentView('rewards')} className="flex flex-col items-center justify-center gap-1 w-1/5 h-full transition-colors duration-200 group" aria-current={currentView === 'rewards' ? 'page' : undefined}>
                    <TicketIcon className={`w-6 h-6 transition-colors ${currentView === 'rewards' ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className={`text-xs transition-colors ${currentView === 'rewards' ? 'text-primary-400 font-semibold' : 'text-gray-500 group-hover:text-gray-300'}`}>Ưu đãi</span>
                </button>
                <button onClick={() => setCurrentView('profile')} className="flex flex-col items-center justify-center gap-1 w-1/5 h-full transition-colors duration-200 group" aria-current={currentView === 'profile' ? 'page' : undefined}>
                    <ProfileIcon className={`w-6 h-6 transition-colors ${currentView === 'profile' ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className={`text-xs transition-colors ${currentView === 'profile' ? 'text-primary-400 font-semibold' : 'text-gray-500 group-hover:text-gray-300'}`}>Cá nhân</span>
                </button>

                {/* Central Floating Action Button */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                     <button 
                        onClick={() => setCurrentView('send')} 
                        className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 transform shadow-lg hover:scale-110 active:scale-95 border-4 border-gray-900 ${currentView === 'send' ? 'bg-primary-500 ring-4 ring-primary-500/50' : 'bg-primary-600 hover:bg-primary-500'}`}
                        aria-label="Chuyển tiền"
                     >
                        <SendIcon className="w-8 h-8"/>
                     </button>
                </div>
            </div>
         </nav>
        </>
      )}
    </div>
  );
};

export default App;
