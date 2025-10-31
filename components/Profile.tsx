import React, { useState, useEffect } from 'react';
import { User, DefaultMessage, Currency } from '../types';
import { themes } from '../themes';
import { SparklesIcon, PencilIcon, TrashIcon, CheckCircleIcon, FingerPrintIcon, CheckIcon, ArrowPathIcon } from './icons';

interface ProfileProps {
  user: User;
  profitRate: number;
  defaultMessages: DefaultMessage[];
  currency: Currency;
  theme: string;
  isBiometricEnabled: boolean;
  transactionLimits: { daily: number; perTransaction: number; };
  onSetDefaultMessages: (messages: DefaultMessage[]) => void;
  onSetCurrency: (currency: Currency) => void;
  onSetTheme: (theme: string) => void;
  onSetBiometricEnabled: (enabled: boolean) => void;
  onSetTransactionLimits: (limits: { daily: number; perTransaction: number; }) => void;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const ProfileItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="font-semibold text-white text-lg">{value}</p>
    </div>
);

const ProfitPolicy: React.FC<{
    currentRate: number;
}> = ({ currentRate }) => {
    // Calculation for display purposes. This is a simple interest calculation for a yearly estimate.
    const periodsPerDay = (24 * 60 * 60) / 30; // Number of 30-second intervals in a day
    const dailyRate = currentRate * periodsPerDay;
    const annualRate = dailyRate * 365;
    const annualRatePercentage = (annualRate * 100).toFixed(2);

    return (
        <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="w-6 h-6 text-primary-400" />
                <h3 className="text-xl font-bold">Chính sách Lợi nhuận</h3>
            </div>
            <div className="space-y-3 text-gray-300 text-sm">
                <p>
                    Ví Điện Tử Sinh Lời tự động cộng lợi nhuận vào số dư của bạn dựa trên cơ chế linh hoạt.
                </p>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400">Chu kỳ cộng lợi nhuận:</p>
                    <p className="font-semibold text-white">Mỗi 30 giây</p>
                </div>
                 <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400">Tỷ lệ tham khảo (ước tính):</p>
                    <p className="font-semibold text-lg text-profit">~{annualRatePercentage}% / năm</p>
                    <p className="text-xs text-gray-400 mt-1">Tỷ lệ này được tính toán dựa trên lãi suất cơ bản và có thể thay đổi. Lợi nhuận thực tế được cộng sau mỗi 30 giây.</p>
                </div>
                <p className="text-xs text-gray-500 italic pt-2">
                    Đây là một tính năng mô phỏng để minh họa. Các tỷ lệ không phản ánh lãi suất thị trường thực tế.
                </p>
            </div>
        </div>
    );
};


const ThemeSelector: React.FC<{ currentTheme: string; onSetTheme: (theme: string) => void }> = ({ currentTheme, onSetTheme }) => {
    const themeNames: Record<string, string> = {
        blue: 'Xanh Lam',
        green: 'Xanh Lá',
        purple: 'Tím',
        orange: 'Cam',
        red: 'Đỏ',
        yellow: 'Vàng',
        cyan: 'Lục Lam',
    };
    
    return (
        <div className="bg-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">Chủ đề Giao diện</h3>
            <p className="text-sm text-gray-400 mb-4">Chọn màu chủ đạo yêu thích cho ứng dụng.</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-x-4 gap-y-6 pt-2">
                {Object.keys(themes).map((themeKey) => {
                    const themeColor = `rgb(${themes[themeKey]['500']})`;
                    const isActive = currentTheme === themeKey;
                    return (
                        <div key={themeKey} className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => onSetTheme(themeKey)}
                                aria-label={`Chọn chủ đề ${themeNames[themeKey] || themeKey}`}
                                className="w-12 h-12 rounded-full border-4 transition-all duration-200 flex items-center justify-center transform hover:scale-110"
                                style={{
                                    backgroundColor: themeColor,
                                    borderColor: isActive ? `rgba(${themes[themeKey]['300']}, 0.8)` : 'transparent',
                                }}
                            >
                                {isActive && <CheckIcon className="w-6 h-6 text-white" />}
                            </button>
                            <span className={`text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                {themeNames[themeKey] || themeKey}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const GeneralSettings: React.FC<{
    defaultMessages: DefaultMessage[];
    currency: Currency;
    onSetDefaultMessages: (messages: DefaultMessage[]) => void;
    onSetCurrency: (currency: Currency) => void;
}> = ({ defaultMessages, currency, onSetDefaultMessages, onSetCurrency }) => {
    const [activeTab, setActiveTab] = useState<'messages' | 'currency'>('messages');
    
    // State for managing default messages
    const [newMessageText, setNewMessageText] = useState('');
    const [newMessageIcon, setNewMessageIcon] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const [editingIcon, setEditingIcon] = useState('');
    const [feedback, setFeedback] = useState('');

    const showFeedback = (message: string, isError: boolean) => {
        setFeedback(message);
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleAddMessage = () => {
        const trimmedText = newMessageText.trim();
        if (trimmedText) {
            if (defaultMessages.some(m => m.text.toLowerCase() === trimmedText.toLowerCase())) {
                showFeedback('Tin nhắn này đã tồn tại.', true);
                return;
            }
            onSetDefaultMessages([...defaultMessages, { text: trimmedText, icon: newMessageIcon.trim() }]);
            setNewMessageText('');
            setNewMessageIcon('');
            showFeedback('Đã thêm tin nhắn mới!', false);
        }
    };

    const handleUpdateMessage = (index: number) => {
        const trimmedText = editingText.trim();
        if (trimmedText) {
            const updatedMessages = [...defaultMessages];
            updatedMessages[index] = { text: trimmedText, icon: editingIcon.trim() };
            onSetDefaultMessages(updatedMessages);
        }
        setEditingIndex(null);
        setEditingText('');
        setEditingIcon('');
    };

    const handleDeleteMessage = (index: number) => {
        onSetDefaultMessages(defaultMessages.filter((_, i) => i !== index));
    };

    const TabButton: React.FC<{ tabId: 'messages' | 'currency', label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabId
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">Cài đặt chung</h3>
            <div className="flex gap-2 border-b border-gray-700 mb-4">
                <TabButton tabId="messages" label="Tin nhắn mặc định" />
                <TabButton tabId="currency" label="Tiền tệ" />
            </div>

            {activeTab === 'messages' && (
                <div className="space-y-4 animate-fade-in-up">
                    <p className="text-sm text-gray-400">Quản lý các tin nhắn nhanh để sử dụng khi chuyển tiền.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessageIcon}
                            onChange={(e) => setNewMessageIcon(e.target.value)}
                            placeholder="😀"
                            maxLength={2}
                            className="w-12 text-center bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <input
                            type="text"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                            placeholder="Thêm tin nhắn mới..."
                            className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button onClick={handleAddMessage} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-all">Thêm</button>
                    </div>
                    {feedback && <p className={`text-sm mt-2 ${feedback.includes('tồn tại') ? 'text-yellow-400' : 'text-green-400'}`}>{feedback}</p>}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {defaultMessages.map((msg, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                                {editingIndex === index ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editingIcon}
                                            onChange={(e) => setEditingIcon(e.target.value)}
                                            maxLength={2}
                                            className="w-12 text-center bg-gray-600 rounded-md p-1"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="flex-grow bg-gray-600 rounded-md p-1 mx-2"
                                            onBlur={() => handleUpdateMessage(index)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateMessage(index)}
                                        />
                                    </>
                                ) : (
                                    <div className="flex items-center flex-grow truncate mr-2">
                                        {msg.icon && <span className="mr-2 text-lg">{msg.icon}</span>}
                                        <p className="text-white truncate">{msg.text}</p>
                                    </div>
                                )}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => { setEditingIndex(index); setEditingText(msg.text); setEditingIcon(msg.icon || ''); }} className="text-gray-400 hover:text-white">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteMessage(index)} className="text-gray-400 hover:text-red-400">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                         {defaultMessages.length === 0 && <p className="text-center text-gray-500 p-4">Chưa có tin nhắn nào.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'currency' && (
                <div className="space-y-4 animate-fade-in-up">
                    <p className="text-sm text-gray-400">Chọn loại tiền tệ mặc định hiển thị trong ứng dụng.</p>
                    <div className="space-y-2">
                        <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                            <input
                                type="radio"
                                name="currency"
                                value="VND"
                                checked={currency === 'VND'}
                                onChange={() => onSetCurrency('VND')}
                                className="w-4 h-4 text-primary-600 bg-gray-900 border-gray-500 focus:ring-primary-600"
                            />
                            <span className="ml-3 font-semibold text-white">Việt Nam Đồng (VND)</span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                            <input
                                type="radio"
                                name="currency"
                                value="USD"
                                checked={currency === 'USD'}
                                onChange={() => onSetCurrency('USD')}
                                className="w-4 h-4 text-primary-600 bg-gray-900 border-gray-500 focus:ring-primary-600"
                            />
                            <span className="ml-3 font-semibold text-white">US Dollar (USD)</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

const SecuritySettings: React.FC<{
    isBiometricEnabled: boolean;
    onSetBiometricEnabled: (enabled: boolean) => void;
}> = ({ isBiometricEnabled, onSetBiometricEnabled }) => {
    return (
        <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
                <FingerPrintIcon className="w-6 h-6 text-primary-400" />
                <h3 className="text-xl font-bold">Bảo mật</h3>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <p className="font-semibold text-white">Xác thực sinh trắc học</p>
                    <p className="text-sm text-gray-400 mt-1">Sử dụng vân tay hoặc khuôn mặt để xác nhận giao dịch nhanh hơn.</p>
                </div>
                <button
                    role="switch"
                    aria-checked={isBiometricEnabled}
                    onClick={() => onSetBiometricEnabled(!isBiometricEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        isBiometricEnabled ? 'bg-primary-600' : 'bg-gray-600'
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isBiometricEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
};

const TransactionLimitSettings: React.FC<{
    limits: { daily: number; perTransaction: number; };
    onSetLimits: (limits: { daily: number; perTransaction: number; }) => void;
    currency: Currency;
}> = ({ limits, onSetLimits, currency }) => {
    const [currentLimits, setCurrentLimits] = useState(limits);
    const [feedback, setFeedback] = useState('');
    const MAX_LIMIT = 100_000_000;
    const MIN_LIMIT = 100_000;
    const DEFAULT_LIMITS = { daily: 50_000_000, perTransaction: 20_000_000 };

    useEffect(() => {
        setCurrentLimits(limits);
    }, [limits]);

    const handleLimitChange = (type: 'daily' | 'perTransaction', value: number) => {
        let newPerTx = type === 'perTransaction' ? value : currentLimits.perTransaction;
        let newDaily = type === 'daily' ? value : currentLimits.daily;

        // Enforce logic: daily >= perTransaction
        if (type === 'perTransaction' && value > newDaily) {
            newDaily = value;
        }
        if (type === 'daily' && value < newPerTx) {
            newPerTx = value;
        }

        setCurrentLimits({ daily: newDaily, perTransaction: newPerTx });
    };

    const handleSave = () => {
        onSetLimits(currentLimits);
        setFeedback('Đã lưu hạn mức thành công!');
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleReset = () => {
        setCurrentLimits(DEFAULT_LIMITS);
        onSetLimits(DEFAULT_LIMITS);
        setFeedback('Đã khôi phục hạn mức mặc định.');
        setTimeout(() => setFeedback(''), 3000);
    }
    
    return (
        <div className="bg-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">Cài đặt Hạn mức Giao dịch</h3>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-medium text-gray-300">Hạn mức mỗi giao dịch</label>
                        <span className="font-bold text-lg text-white">{formatCurrency(currentLimits.perTransaction, currency)}</span>
                    </div>
                    <input
                        type="range"
                        min={MIN_LIMIT}
                        max={MAX_LIMIT}
                        step={100000}
                        value={currentLimits.perTransaction}
                        onChange={(e) => handleLimitChange('perTransaction', Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-primary"
                    />
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-medium text-gray-300">Hạn mức hàng ngày</label>
                        <span className="font-bold text-lg text-white">{formatCurrency(currentLimits.daily, currency)}</span>
                    </div>
                    <input
                        type="range"
                        min={MIN_LIMIT}
                        max={MAX_LIMIT}
                        step={100000}
                        value={currentLimits.daily}
                        onChange={(e) => handleLimitChange('daily', Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-primary"
                    />
                </div>
                 {feedback && <p className="text-sm text-center text-green-400 animate-fade-in">{feedback}</p>}
                <div className="flex gap-4 pt-2">
                     <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all">
                        <ArrowPathIcon className="w-5 h-5"/> Mặc định
                    </button>
                    <button onClick={handleSave} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};


export const Profile: React.FC<ProfileProps> = ({ user, profitRate, defaultMessages, currency, theme, isBiometricEnabled, transactionLimits, onSetDefaultMessages, onSetCurrency, onSetTheme, onSetBiometricEnabled, onSetTransactionLimits }) => {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN');
  }
  
  const formatCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <div className="max-w-3xl mx-auto text-white space-y-8">
      <h1 className="text-3xl font-bold text-center">Hồ Sơ Của Tôi</h1>
      <div className="bg-gray-800 rounded-2xl p-8">
        <div className="flex flex-col items-center space-y-4">
            <img src={user.avatarUrl} alt={user.name} className="w-28 h-28 rounded-full border-4 border-primary-500" />
            <h2 className="text-2xl font-bold">{user.name}</h2>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-4">Thông tin ví</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileItem label="Mã thẻ" value={formatCardNumber(user.walletId)} />
            <ProfileItem label="Giới tính" value={user.gender} />
            <ProfileItem label="Ngày phát hành" value={formatDate(user.issueDate)} />
            <ProfileItem label="Ngày hết hạn" value={formatDate(user.expiryDate)} />
        </div>
      </div>

      <SecuritySettings isBiometricEnabled={isBiometricEnabled} onSetBiometricEnabled={onSetBiometricEnabled} />
      
      <TransactionLimitSettings limits={transactionLimits} onSetLimits={onSetTransactionLimits} currency={currency} />

      <ThemeSelector currentTheme={theme} onSetTheme={onSetTheme} />
      
      <ProfitPolicy currentRate={profitRate} />

      <GeneralSettings 
        defaultMessages={defaultMessages}
        currency={currency}
        onSetDefaultMessages={onSetDefaultMessages}
        onSetCurrency={onSetCurrency}
      />

       <div className="pt-4">
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
                Đăng xuất
            </button>
        </div>
    </div>
  );
};
