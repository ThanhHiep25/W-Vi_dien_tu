import React, { useEffect, useState, useRef } from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import { ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon, SparklesIcon, BanknotesIcon, CreditCardIcon, GiftIcon, CoinIcon, ReceiptPercentIcon } from './icons';

interface NotificationProps {
  transaction: Transaction;
  onClose: () => void;
  currency: Currency;
}

const NOTIFICATION_CONFIG: Record<string, { Icon: React.FC<{ className?: string }>, color: string, title: string }> = {
    [TransactionType.OUTGOING]: { Icon: ArrowUpRightIcon, color: 'border-expense', title: 'Đã gửi tiền' },
    [TransactionType.INCOMING]: { Icon: ArrowDownLeftIcon, color: 'border-blue-500', title: 'Đã nhận tiền' },
    [TransactionType.TOPUP]: { Icon: PlusIcon, color: 'border-green-500', title: 'Nạp tiền thành công' },
    [TransactionType.PROFIT]: { Icon: SparklesIcon, color: 'border-profit', title: 'Lợi nhuận được cộng' },
    [TransactionType.WITHDRAWAL]: { Icon: BanknotesIcon, color: 'border-orange-500', title: 'Rút tiền thành công' },
    [TransactionType.LOAN]: { Icon: CreditCardIcon, color: 'border-purple-500', title: 'Giải ngân thành công' },
    [TransactionType.LUCKY_MONEY]: { Icon: GiftIcon, color: 'border-red-500', title: 'Thông báo Lì xì' },
    [TransactionType.COIN]: { Icon: CoinIcon, color: 'border-yellow-400', title: 'Bạn nhận được Xu' },
    [TransactionType.BILL_PAYMENT]: { Icon: ReceiptPercentIcon, color: 'border-cyan-500', title: 'Thanh toán thành công' },
};

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

export const Notification: React.FC<NotificationProps> = ({ transaction, onClose, currency }) => {
  const [isExiting, setIsExiting] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ startX: 0, isDragging: false });
  const [translateX, setTranslateX] = useState(0);
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = (isTimedClose = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => handleClose(true), 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    dragInfo.current.isDragging = true;
    dragInfo.current.startX = e.clientX;
    if (notificationRef.current) {
      notificationRef.current.style.transition = 'none';
      notificationRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;
    const deltaX = e.clientX - dragInfo.current.startX;
    setTranslateX(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    
    const node = notificationRef.current;
    if (node) {
      node.style.transition = 'transform 0.3s ease-out';
      node.releasePointerCapture(e.pointerId);
      
      const dismissThreshold = node.offsetWidth * 0.4;

      if (Math.abs(translateX) > dismissThreshold) {
        setIsExiting(true);
        const direction = translateX > 0 ? 1 : -1;
        setTranslateX((node.offsetWidth + 20) * direction);
        setTimeout(onClose, 300);
      } else {
        setTranslateX(0);
        timeoutRef.current = setTimeout(() => handleClose(true), 3000);
      }
    }
  };

  const config = NOTIFICATION_CONFIG[transaction.type];
  const isCoin = transaction.type === TransactionType.COIN;
  const isPositive = [TransactionType.INCOMING, TransactionType.PROFIT, TransactionType.TOPUP, TransactionType.LOAN, TransactionType.COIN].includes(transaction.type);
  
  const formattedAmount = isCoin 
    ? `+${transaction.amount} Xu`
    : `${isPositive ? '+' : '-'}${formatCurrency(transaction.amount, currency)}`;

  const amountColor = isCoin ? 'text-yellow-400' : (isPositive ? 'text-profit' : 'text-expense');
  
  const animationClass = isExiting && translateX === 0 ? 'animate-fade-out-right' : 'animate-fade-in-right';

  return (
    <div
      ref={notificationRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ transform: `translateX(${translateX}px)`, touchAction: 'none' }}
      className={`relative flex items-start gap-3 w-full max-w-sm p-4 bg-gray-800 border-l-4 ${config.color} rounded-lg shadow-lg overflow-hidden cursor-grab active:cursor-grabbing ${animationClass}`}
    >
      <div className={`flex-shrink-0 p-2 rounded-full bg-gray-700`}>
        <config.Icon className={`w-6 h-6 ${isPositive ? 'text-green-400' : 'text-orange-400'}`} />
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-bold text-white">{config.title}</p>
        <p className={`text-sm font-semibold ${amountColor}`}>{formattedAmount}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{transaction.description}</p>
      </div>
      <button 
        onClick={() => handleClose(false)} 
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};