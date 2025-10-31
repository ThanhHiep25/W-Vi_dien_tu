

import React, { useState } from 'react';
import { Currency, LinkedBankAccount } from '../types';
import { SpinnerIcon } from './icons';

interface WithdrawMoneyDetails {
    amount: number;
    bankInfo: string;
    message: string;
}

interface WithdrawMoneyFormProps {
  balance: number;
  onWithdraw: (details: WithdrawMoneyDetails) => void;
  onCancel: () => void;
  currency: Currency;
  linkedAccounts: LinkedBankAccount[];
  isBiometricEnabled: boolean;
  transactionLimits: { daily: number; perTransaction: number; };
  spentToday: number;
  onRequestBiometricAuth: (onConfirm: () => void, title: string) => void;
  onRequestOtpVerification: (onConfirm: () => Promise<void>, title: string) => void;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

export const WithdrawMoneyForm: React.FC<WithdrawMoneyFormProps> = ({ balance, onWithdraw, onCancel, currency, linkedAccounts, isBiometricEnabled, transactionLimits, spentToday, onRequestBiometricAuth, onRequestOtpVerification }) => {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [amount, setAmount] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (!bankInfo || !amount) {
      setError('Vui lòng điền thông tin ngân hàng và số tiền.');
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Số tiền không hợp lệ.');
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

  const handleConfirm = () => {
    const performWithdraw = async () => {
        setIsProcessing(true);
        // Simulate network delay
        return new Promise<void>(resolve => {
            setTimeout(() => {
                onWithdraw({
                    amount: parseFloat(amount),
                    bankInfo,
                    message,
                });
                setIsProcessing(false);
                resolve();
            }, 1000);
        });
    };

    const startOtpFlow = () => {
        onRequestOtpVerification(performWithdraw, `Xác thực rút ${formatCurrency(parseFloat(amount), currency)}`);
    };

    if (isBiometricEnabled) {
        onRequestBiometricAuth(startOtpFlow, `Rút ${formatCurrency(parseFloat(amount), currency)}`);
    } else {
        startOtpFlow();
    }
  };

  const renderInputStep = () => (
    <form onSubmit={handleProceed} className="space-y-4">
        {linkedAccounts.length > 0 && (
            <div className="mb-4">
                <p className="text-sm font-medium text-gray-300 mb-2">Chọn tài khoản đã liên kết:</p>
                <div className="flex flex-wrap gap-2">
                    {linkedAccounts.map(acc => (
                        <button
                            type="button"
                            key={acc.id}
                            onClick={() => setBankInfo(`${acc.bankName}, ${acc.accountNumber}, ${acc.accountHolder}`)}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium py-1.5 px-3 rounded-lg transition-all"
                        >
                            <img src={acc.logoUrl} onError={(e) => e.currentTarget.style.display = 'none'} alt={acc.bankName} className="w-5 h-5 rounded-full bg-white object-contain" />
                            <span>{acc.bankName} (...{acc.accountNumber.slice(-4)})</span>
                        </button>
                    ))}
                </div>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-gray-800 px-2 text-sm text-gray-500">Hoặc nhập thủ công</span>
                    </div>
                </div>
            </div>
        )}

        <div>
            <label htmlFor="bankInfo" className="block text-sm font-medium text-gray-300">Thông tin ngân hàng</label>
            <input
              type="text"
              id="bankInfo"
              value={bankInfo}
              onChange={(e) => setBankInfo(e.target.value)}
              placeholder="Tên ngân hàng, STK, Chủ tài khoản"
              className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
            />
        </div>
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Số tiền ({currency})</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
            />
        </div>
        <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-300">Ghi chú (không bắt buộc)</label>
            <input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="VD: Rút tiền học phí"
              className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:ring-primary-500 focus:border-primary-500"
            />
        </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Tiếp tục
        </button>
      </div>
    </form>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center text-gray-300">Xác nhận rút tiền</h3>
        <div className="bg-gray-700 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center"><span className="text-gray-400">Số tiền:</span> <span className="font-bold text-lg text-white">{formatCurrency(parseFloat(amount), currency)}</span></div>
            <div className="flex justify-between items-start"><span className="text-gray-400">Về tài khoản:</span> <span className="font-semibold text-white text-right pl-4">{bankInfo}</span></div>
            {message && <div className="flex justify-between items-start pt-2 border-t border-gray-600 mt-2"><span className="text-gray-400">Ghi chú:</span> <span className="font-semibold text-white text-right pl-4">{message}</span></div>}
        </div>
         <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setStep('input')}
              disabled={isProcessing}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Xác nhận'}
            </button>
          </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-6 text-center">Rút Tiền</h2>
        {step === 'input' ? renderInputStep() : renderConfirmStep()}
      </div>
    </div>
  );
};
