import React from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import { ArrowUpRightIcon, ArrowDownLeftIcon, PlusIcon, SparklesIcon, BanknotesIcon, CreditCardIcon, ShareIcon, GiftIcon, ReceiptPercentIcon } from './icons';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  viewMode?: 'compact' | 'detailed';
  isLast?: boolean;
  currency: Currency;
}

const ICONS_CONFIG: Record<string, { Icon: React.FC<{ className?: string }>, color: string, hoverBorder: string }> = {
    [TransactionType.OUTGOING]: { Icon: ArrowUpRightIcon, color: 'bg-expense', hoverBorder: 'hover:border-expense' },
    [TransactionType.INCOMING]: { Icon: ArrowDownLeftIcon, color: 'bg-blue-500', hoverBorder: 'hover:border-blue-500' },
    [TransactionType.TOPUP]: { Icon: PlusIcon, color: 'bg-green-500', hoverBorder: 'hover:border-green-500' },
    [TransactionType.PROFIT]: { Icon: SparklesIcon, color: 'bg-profit', hoverBorder: 'hover:border-profit' },
    [TransactionType.WITHDRAWAL]: { Icon: BanknotesIcon, color: 'bg-orange-500', hoverBorder: 'hover:border-orange-500' },
    [TransactionType.LOAN]: { Icon: CreditCardIcon, color: 'bg-purple-500', hoverBorder: 'hover:border-purple-500' },
    [TransactionType.LUCKY_MONEY]: { Icon: GiftIcon, color: 'bg-red-500', hoverBorder: 'hover:border-red-500' },
    [TransactionType.BILL_PAYMENT]: { Icon: ReceiptPercentIcon, color: 'bg-cyan-500', hoverBorder: 'hover:border-cyan-500' },
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'Đăng ký': 'bg-purple-600 text-purple-100',
  'Ăn uống': 'bg-yellow-600 text-yellow-100',
  'Mua sắm': 'bg-pink-600 text-pink-100',
  'Di chuyển': 'bg-indigo-600 text-indigo-100',
  'Hóa đơn': 'bg-red-600 text-red-100',
  'Khác': 'bg-gray-600 text-gray-100',
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colorClass = CATEGORY_COLORS[category] || 'bg-gray-500 text-gray-100';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
      {category}
    </span>
  );
};

const TransactionIcon: React.FC<{ type: TransactionType }> = ({ type }) => {
  const config = ICONS_CONFIG[type];
  const { Icon, color } = config;
  const baseIconClass = "w-6 h-6 text-white";

  return (
    <div className={`p-2 ${color} rounded-full`}>
      <Icon className={baseIconClass} />
    </div>
  );
};

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick, viewMode = 'detailed', isLast = false, currency }) => {
  const { id, type, description, date, amount, sender, recipient, category } = transaction;

  const isPositive = type === TransactionType.INCOMING || type === TransactionType.PROFIT || type === TransactionType.TOPUP || type === TransactionType.LOAN;
  
  const formattedAmount = `${isPositive ? '+' : '-'}${formatCurrency(amount, currency)}`;
  const amountColor = isPositive ? 'text-profit' : 'text-expense';
  
  const handleShare = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the detail modal

      const formattedDate = new Date(date).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
      });

      const transactionTypeLabel = {
          [TransactionType.INCOMING]: 'Nhận tiền',
          [TransactionType.OUTGOING]: 'Gửi tiền',
          [TransactionType.PROFIT]: 'Lợi nhuận',
          [TransactionType.TOPUP]: 'Nạp tiền',
          [TransactionType.WITHDRAWAL]: 'Rút tiền',
          [TransactionType.LOAN]: 'Vay tiền',
          [TransactionType.LUCKY_MONEY]: 'Lì xì',
          [TransactionType.BILL_PAYMENT]: 'Thanh toán Hóa đơn',
      }[type];
      
      const shareText = `--- Chi Tiết Giao Dịch ---\n` +
                        `Loại: ${transactionTypeLabel}\n` +
                        `Số tiền: ${formatCurrency(amount, currency)}\n` +
                        `Mô tả: ${description}\n` +
                        `Thời gian: ${formattedDate}\n` +
                        (recipient ? `Tới: ${recipient}\n` : '') +
                        (sender ? `Từ: ${sender}\n` : '') +
                        `Mã GD: ${id}\n`+
                        `------------------------\n` +
                        `Chia sẻ từ Ví Điện Tử Sinh Lời`;

      const shareData = {
          title: 'Chia sẻ Giao dịch',
          text: shareText,
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              // Fallback for browsers that don't support it
              await navigator.clipboard.writeText(shareText);
              alert('Đã sao chép chi tiết giao dịch vào clipboard.');
          }
      } catch (err) {
          console.error('Lỗi khi chia sẻ:', err);
      }
  };

  if (viewMode === 'compact') {
    const compactClasses = `flex items-center justify-between p-4 w-full text-left transition-colors hover:bg-gray-700/50 ${!isLast ? 'border-b border-gray-700' : ''}`;
    const content = (
      <>
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-white truncate">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString('vi-VN')}</p>
            {category && <CategoryBadge category={category} />}
          </div>
        </div>
        <p className={`font-bold text-base md:text-lg ${amountColor} ml-4 flex-shrink-0`}>{formattedAmount}</p>
      </>
    );

    if (onClick) {
      return (
        <button onClick={() => onClick(transaction)} className={compactClasses}>
          {content}
        </button>
      );
    }
    return <div className={compactClasses}>{content}</div>;
  }

  // --- DETAILED VIEW ---
  const title = description;
  const subtitle = type === TransactionType.OUTGOING ? `Gửi tới ${recipient}` : type === TransactionType.INCOMING ? `Nhận từ ${sender}` : new Date(date).toLocaleString('vi-VN');
  
  const config = ICONS_CONFIG[type];
  const commonClasses = "flex items-center justify-between p-4 bg-gray-800 rounded-lg w-full border-l-4 border-transparent";
  const interactiveClasses = `transition-all duration-200 transform hover:bg-gray-700/80 hover:-translate-y-1 active:scale-[0.98] focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50 ${config.hoverBorder}`;

  const content = (
      <>
        <div className="flex items-center gap-4 min-w-0 flex-grow">
          <TransactionIcon type={type} />
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-white truncate">{title}</p>
            <p className="text-sm text-gray-400 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4 flex items-center gap-2">
            <div>
                <p className={`font-bold text-lg ${amountColor}`}>{formattedAmount}</p>
                <div className="flex justify-end items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString('vi-VN')}</p>
                    {category && <CategoryBadge category={category} />}
                </div>
            </div>
             <button 
                onClick={handleShare} 
                aria-label="Chia sẻ giao dịch"
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <ShareIcon className="w-5 h-5" />
            </button>
        </div>
      </>
  );
  
  const clickableContent = (
     <button onClick={() => onClick && onClick(transaction)} className="flex items-center gap-4 min-w-0 flex-grow text-left focus:outline-none">
        <TransactionIcon type={type} />
        <div className="flex-grow min-w-0">
            <p className="font-semibold text-white truncate">{title}</p>
            <p className="text-sm text-gray-400 truncate">{subtitle}</p>
        </div>
    </button>
  );


  if (onClick) {
      return (
          <div className={`${commonClasses} ${interactiveClasses} group`}>
              {clickableContent}
              <div className="text-right flex-shrink-0 ml-4 flex items-center gap-2">
                  <div>
                      <p className={`font-bold text-lg ${amountColor}`}>{formattedAmount}</p>
                      <div className="flex justify-end items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString('vi-VN')}</p>
                          {category && <CategoryBadge category={category} />}
                      </div>
                  </div>
                  <button 
                      onClick={handleShare} 
                      aria-label="Chia sẻ giao dịch"
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                      <ShareIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className={commonClasses}>
        {content}
    </div>
  );
};