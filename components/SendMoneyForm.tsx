import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, SpinnerIcon, ArrowLeftIcon } from './icons';
import { DefaultMessage, Currency } from '../types';

interface SendMoneyDetails {
    recipientId: string;
    amount: number;
    message: string;
}

interface Recipient {
  id: string;
  name?: string;
  avatarUrl?: string;
}

interface SendMoneyFormProps {
  recipient: Recipient;
  balance: number;
  onSend: (details: SendMoneyDetails) => Promise<void>;
  onBack: () => void;
  defaultMessages: DefaultMessage[];
  currency: Currency;
  isBiometricEnabled: boolean;
  transactionLimits: { daily: number; perTransaction: number; };
  spentToday: number;
  onRequestBiometricAuth: (onConfirm: () => void, title: string) => void;
  onRequestOtpVerification: (onConfirm: () => Promise<void>, title: string) => void;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const SendMoneyForm: React.FC<SendMoneyFormProps> = ({ recipient, balance, onSend, onBack, defaultMessages, currency, isBiometricEnabled, transactionLimits, spentToday, onRequestBiometricAuth, onRequestOtpVerification }) => {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
    if (numericAmount <= 0) {
      setError('Vui lòng nhập số tiền.');
      return;
    }
    if (numericAmount > balance) {
      setError('Số dư không đủ.');
      return;
    }
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

  const handleConfirm = async () => {
    const performSend = async () => {
        setIsSending(true);
        setError('');
        try {
            await onSend({
                recipientId: recipient.id,
                amount: numericAmount,
                message,
            });
            // The parent component will handle success and view changes.
        } catch (err) {
            console.error("Sending money failed:", err);
            setError("Gửi tiền thất bại, vui lòng thử lại.");
        } finally {
            setIsSending(false);
        }
    };
    
    const startOtpFlow = () => {
        onRequestOtpVerification(performSend, `Xác thực gửi ${formatCurrency(numericAmount, currency)}`);
    };

    if (isBiometricEnabled) {
        onRequestBiometricAuth(startOtpFlow, `Gửi ${formatCurrency(numericAmount, currency)}`);
    } else {
        startOtpFlow();
    }
  };
  
  const quickAmounts = [50000, 100000, 200000, 500000];

  const renderInputStep = () => (
    <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="p-4 flex items-center gap-4 border-b border-gray-700 flex-shrink-0">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-700 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
                <img src={recipient.avatarUrl} alt={recipient.name || recipient.id} className="w-10 h-10 rounded-full bg-gray-600" />
                <div>
                    <p className="font-bold">{recipient.name || recipient.id}</p>
                    <p className="text-xs text-gray-400">{recipient.id}</p>
                </div>
            </div>
        </div>

        {/* Amount Display */}
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

        {/* Message & Keypad */}
        <div className="flex-shrink-0">
             <div className="px-4 pb-2">
                 <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Thêm lời nhắn..."
                  className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500 text-center"
                />
            </div>
            <div className="grid grid-cols-3 gap-px bg-gray-700">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(key => (
                    <button 
                        key={key} 
                        onClick={() => handleKeyPress(key)}
                        className="h-16 text-2xl font-semibold bg-gray-800 hover:bg-gray-700/50 transition-colors active:bg-gray-700"
                    >
                        {key === 'del' ? '⌫' : key}
                    </button>
                ))}
            </div>
            <div className="p-4 bg-gray-800">
                 <button 
                    onClick={handleProceed}
                    disabled={numericAmount <= 0 || numericAmount > balance}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-4 rounded-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Tiếp tục
                </button>
            </div>
        </div>
    </div>
  );

  const renderConfirmStep = () => (
     <div className="flex flex-col h-full w-full p-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-center mb-6">Xác nhận Giao dịch</h2>

        <div className="flex flex-col items-center text-center mb-6">
            <img src={recipient.avatarUrl} alt={recipient.name || recipient.id} className="w-24 h-24 rounded-full mb-3 border-4 border-gray-600" />
            <p className="text-lg font-semibold">{recipient.name || recipient.id}</p>
            <p className="text-sm text-gray-400">{recipient.id}</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-gray-400">Số tiền gửi</span>
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
            <button
              onClick={handleConfirm}
              disabled={isSending}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-4 rounded-lg transition-all text-lg flex items-center justify-center disabled:opacity-50"
            >
              {isSending ? (
                  <>
                    <SpinnerIcon className="w-6 h-6 mr-2 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
              ) : (
                'Xác nhận & Gửi'
              )}
            </button>
             <button
              onClick={() => setStep('input')}
              disabled={isSending}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
            >
              Quay lại
            </button>
          </div>
    </div>
  );

  return step === 'input' ? renderInputStep() : renderConfirmStep();
};
