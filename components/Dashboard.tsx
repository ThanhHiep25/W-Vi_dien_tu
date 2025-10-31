import React, { useState, useEffect, useRef } from 'react';
import { Transaction, User, SavingsGoal, Currency } from '../types';
import { TransactionItem } from './TransactionItem';
import { SendIcon, PlusIcon, BanknotesIcon, FlagIcon, QrCodeIcon, CreditCardIcon, EyeIcon, EyeSlashIcon, CoinIcon, ReceiptPercentIcon } from './icons';

interface DashboardProps {
  user: User;
  balance: number;
  transactions: Transaction[];
  savingsGoal: SavingsGoal | null;
  savingsProgress: number;
  currency: Currency;
  isBalanceVisible: boolean;
  onToggleBalanceVisibility: () => void;
  onAddFunds: () => void;
  onWithdrawMoney: () => void;
  onApplyForLoan: () => void;
  onPayBills: () => void;
  onViewTransaction: (transaction: Transaction) => void;
  onSetGoal: () => void;
  onAddToSavings: () => void;
  onViewHistory: () => void;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

const SavingsGoalProgress: React.FC<{
  goal: SavingsGoal | null;
  progress: number;
  currency: Currency;
  onSetGoal: () => void;
  onAddToSavings: () => void;
}> = ({ goal, progress, currency, onSetGoal, onAddToSavings }) => {
  if (!goal) {
    return (
      <div className="text-center p-6 bg-gray-800 rounded-lg h-full flex flex-col justify-center">
        <FlagIcon className="w-10 h-10 mx-auto text-primary-400 mb-3" />
        <h3 className="font-bold text-lg">Bạn chưa có mục tiêu tiết kiệm.</h3>
        <p className="text-gray-400 text-sm mb-4">Hãy đặt mục tiêu để bắt đầu tiết kiệm ngay hôm nay!</p>
        <button 
          onClick={onSetGoal}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 active:scale-95"
        >
          Đặt mục tiêu ngay
        </button>
      </div>
    );
  }

  const progressPercentage = goal.targetAmount > 0 ? (progress / goal.targetAmount) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {goal.imageUrl && (
        <img src={goal.imageUrl} alt={goal.name} className="w-full h-40 object-cover" />
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <FlagIcon className="w-6 h-6 text-primary-400 flex-shrink-0" />
          <h2 className="text-xl font-bold truncate">{goal.name}</h2>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
          <div 
            className="bg-primary-600 h-2.5 rounded-full" 
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm font-medium text-gray-400 mb-4">
          <span>{formatCurrency(progress, currency)}</span>
          <span className="font-bold">{formatCurrency(goal.targetAmount, currency)}</span>
        </div>
         <div className="flex gap-3">
          <button 
              onClick={onAddToSavings}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm"
          >
            Thêm tiền
          </button>
          <button 
              onClick={onSetGoal}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm"
          >
            Chỉnh sửa mục tiêu
          </button>
        </div>
      </div>
    </div>
  );
};


export const Dashboard: React.FC<DashboardProps> = ({ 
  user, balance, transactions, savingsGoal, savingsProgress, currency, isBalanceVisible, onToggleBalanceVisibility,
  onAddFunds, onWithdrawMoney, onApplyForLoan, onPayBills, onViewTransaction, onSetGoal, onAddToSavings, onViewHistory
}) => {
  const recentTransactions = transactions.slice(0, 5);
  
  const [animateBalance, setAnimateBalance] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setAnimateBalance(true);
      const timer = setTimeout(() => {
        setAnimateBalance(false);
      }, 400); // Animation duration should match the one in tailwind.config

      return () => clearTimeout(timer);
    }
  }, [balance]);

  const formattedBalance = formatCurrency(balance, currency);
  const balanceLength = formattedBalance.length;

  let balanceFontSizeClass = 'text-5xl';
  if (balanceLength > 20) {
    balanceFontSizeClass = 'text-3xl';
  } else if (balanceLength > 15) {
    balanceFontSizeClass = 'text-4xl';
  }


  const formatCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
  };

  const getExpiryDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xin chào, {user.name.split(' ').slice(-1).join(' ')}!</h1>
          <p className="text-gray-400 mt-1">Chào mừng bạn trở lại ví điện tử.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-full border border-gray-700">
                <CoinIcon className="w-6 h-6 text-yellow-400"/>
                <span className="font-bold text-lg text-white">{user.coinBalance}</span>
            </div>
            <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full border-2 border-primary-500" />
        </div>
      </div>

       {/* Balance */}
      <div className="p-6 bg-gray-800 rounded-2xl">
        <div className="flex justify-between items-center">
            <p className="text-base text-gray-400">Tổng số dư</p>
            <button onClick={onToggleBalanceVisibility} className="text-gray-400 hover:text-white transition-colors">
                {isBalanceVisible ? <EyeSlashIcon className="w-6 h-6"/> : <EyeIcon className="w-6 h-6"/>}
            </button>
        </div>
        <div className={`mt-2 font-extrabold tracking-tight transition-all duration-300 ${animateBalance ? 'animate-balance-update' : ''}`}>
             {isBalanceVisible ? (
                <p className={`${balanceFontSizeClass} break-all`}>{formattedBalance}</p>
            ) : (
                <p className="text-5xl">****** <span className="text-4xl">{currency}</span></p>
            )}
        </div>
         {isBalanceVisible && currency === 'VND' && balance < 100000 && (
          <p className="text-yellow-400 text-xs font-semibold mt-2 animate-pulse">Số dư sắp hết!</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Wallet Card & Actions */}
        <div className="lg:col-span-3 space-y-8">
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden h-60">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
              <div className="absolute -bottom-16 -left-4 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
              <div className="z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-primary-100">Ví Điện Tử</span>
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-8" viewBox="0 0 48 32"><path fill="#FFD700" d="M4,12h10v8h-10z M28,12h10v8h-10z M16,12h10v8h-10z M0,6a6,6,0,0,1,6,-6h36a6,6,0,0,1,6,6v20a6,6,0,0,1,-6,6h-36a6,6,0,0,1,-6,-6z"></path></svg>
                </div>
                <div>
                    <p className="font-mono text-2xl tracking-widest text-white mb-6">{formatCardNumber(user.walletId)}</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-primary-200 uppercase">Chủ thẻ</p>
                            <p className="font-semibold text-lg">{user.name}</p>
                        </div>
                         <div>
                            <p className="text-xs text-primary-200 uppercase">Hết hạn</p>
                            <p className="font-semibold text-lg">{getExpiryDate(user.expiryDate)}</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <button onClick={onAddFunds} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 active:scale-95 w-full">
                <PlusIcon className="w-6 h-6 text-green-400" />
                <p className="font-semibold text-sm">Nạp tiền</p>
              </button>
               <button onClick={onWithdrawMoney} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 active:scale-95 w-full">
                <BanknotesIcon className="w-6 h-6 text-orange-400" />
                <p className="font-semibold text-sm">Rút tiền</p>
              </button>
              <button onClick={onPayBills} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 active:scale-95 w-full">
                <ReceiptPercentIcon className="w-6 h-6 text-cyan-400" />
                <p className="font-semibold text-sm">Thanh toán HĐ</p>
              </button>
              <button onClick={onApplyForLoan} className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 active:scale-95 w-full">
                <CreditCardIcon className="w-6 h-6 text-purple-400" />
                <p className="font-semibold text-sm">Vay tiền</p>
              </button>
            </div>
        </div>

        {/* Savings Goal */}
        <div className="lg:col-span-2">
          <SavingsGoalProgress 
            goal={savingsGoal}
            progress={savingsProgress}
            currency={currency}
            onSetGoal={onSetGoal}
            onAddToSavings={onAddToSavings}
          />
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Giao dịch gần đây</h2>
            <button onClick={onViewHistory} className="text-sm font-semibold text-primary-400 hover:text-primary-300 hover:underline transition-all focus:outline-none">Xem tất cả</button>
        </div>
        <div className="space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, index) => (
              <div 
                key={tx.id} 
                className="animate-fade-in-up" 
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
              >
                <TransactionItem transaction={tx} onClick={onViewTransaction} currency={currency} />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 p-4 bg-gray-800 rounded-lg animate-fade-in-up">Chưa có giao dịch nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};