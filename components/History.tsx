import React, { useState } from 'react';
import { Transaction, TransactionType, Currency, RecurringTransaction } from '../types';
import { SearchIcon, ViewGridIcon, ViewListIcon } from './icons';
import { TransactionHistory } from './TransactionHistory';
import { RecurringTransactionList } from './RecurringTransactionList';

interface HistoryProps {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  onViewTransaction: (transaction: Transaction) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurringActive: (id: string) => void;
  viewMode: 'compact' | 'detailed';
  onViewModeChange: (mode: 'compact' | 'detailed') => void;
  currency: Currency;
}

type FilterType = 'all' | TransactionType;
type DateFilterType = 'all' | 'today' | '7days' | '30days';
type ActiveTab = 'all' | 'recurring';

const CATEGORIES: Record<string, string[]> = {
  'Đăng ký': ['netflix', 'spotify', 'youtube premium', 'icloud', 'galaxy play'],
  'Ăn uống': ['cafe', 'cà phê', 'nhà hàng', 'quán ăn', 'cơm trưa', 'starbucks', 'highlands', 'phúc long', 'the coffee house'],
  'Mua sắm': ['shopee', 'lazada', 'tiki', 'mua sắm', 'circle k', 'vinmart', 'winmart', 'siêu thị'],
  'Di chuyển': ['grab', 'be', 'gojek', 'taxi', 'xăng', 'gửi xe'],
  'Hóa đơn': ['điện', 'nước', 'internet', 'fpt', 'vnpt', 'viettel'],
};

const categorizeTransaction = (transaction: Transaction): Transaction => {
  const description = transaction.description.toLowerCase();
  for (const category in CATEGORIES) {
    if (CATEGORIES[category].some(keyword => description.includes(keyword))) {
      return { ...transaction, category };
    }
  }
  return { ...transaction, category: 'Khác' };
};


export const History: React.FC<HistoryProps> = ({ transactions, recurringTransactions, onViewTransaction, onDeleteRecurring, onToggleRecurringActive, viewMode, onViewModeChange, currency }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions
    .filter(tx => {
      if (dateFilter === 'all') return true;
      const txDate = new Date(tx.date);
      const now = new Date();

      if (dateFilter === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return txDate >= startOfToday;
      }
      
      const startDate = new Date();
      if (dateFilter === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === '30days') {
        startDate.setDate(now.getDate() - 30);
      }
      startDate.setHours(0, 0, 0, 0);
      
      return txDate >= startDate;
    })
    .filter(tx => {
      if (filter === 'all') return true;
      return tx.type === filter;
    })
    .filter(tx => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const descriptionMatch = tx.description.toLowerCase().includes(query);
        const senderMatch = tx.sender?.toLowerCase().includes(query) ?? false;
        const recipientMatch = tx.recipient?.toLowerCase().includes(query) ?? false;
        return descriptionMatch || senderMatch || recipientMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(categorizeTransaction);

  const getFilterButtonClass = (buttonFilter: FilterType, currentFilter: FilterType) => {
    return `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 transform active:scale-95 whitespace-nowrap ${
      currentFilter === buttonFilter
        ? 'bg-primary-600 text-white scale-105 shadow-lg'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
    }`;
  };

  const getDateFilterButtonClass = (buttonFilter: DateFilterType, currentFilter: DateFilterType) => {
    return `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 transform active:scale-95 whitespace-nowrap ${
      currentFilter === buttonFilter
        ? 'bg-blue-600 text-white scale-105 shadow-lg'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
    }`;
  };
  
  const TabButton: React.FC<{ tabId: ActiveTab, label: string }> = ({ tabId, label }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 ${
            activeTab === tabId
                ? 'border-b-2 border-primary-500 text-primary-400'
                : 'border-b-2 border-transparent text-gray-500 hover:text-white'
        }`}
    >
        {label}
    </button>
  );


  return (
    <div className="p-4 md:p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lịch sử giao dịch</h1>
         {activeTab === 'all' && (
            <div className="flex items-center gap-1 p-1 bg-gray-700 rounded-lg">
                <button 
                    onClick={() => onViewModeChange('detailed')} 
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'detailed' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    aria-label="Card View"
                >
                    <ViewGridIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onViewModeChange('compact')} 
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    aria-label="List View"
                >
                    <ViewListIcon className="w-5 h-5" />
                </button>
            </div>
         )}
      </div>
      
       <div className="flex border-b border-gray-700 mb-4">
          <TabButton tabId="all" label="Tất cả giao dịch" />
          <TabButton tabId="recurring" label="Giao dịch định kỳ" />
       </div>

      {activeTab === 'all' ? (
        <div className="animate-fade-in">
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                </span>
                <input
                type="text"
                placeholder="Tìm kiếm theo mô tả, người gửi/nhận..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
            </div>

            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                <button onClick={() => setDateFilter('all')} className={getDateFilterButtonClass('all', dateFilter)}>Tất cả thời gian</button>
                <button onClick={() => setDateFilter('today')} className={getDateFilterButtonClass('today', dateFilter)}>Hôm nay</button>
                <button onClick={() => setDateFilter('7days')} className={getDateFilterButtonClass('7days', dateFilter)}>7 ngày qua</button>
                <button onClick={() => setDateFilter('30days')} className={getDateFilterButtonClass('30days', dateFilter)}>30 ngày qua</button>
            </div>

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                <button onClick={() => setFilter('all')} className={getFilterButtonClass('all', filter)}>Tất cả loại</button>
                <button onClick={() => setFilter(TransactionType.INCOMING)} className={getFilterButtonClass(TransactionType.INCOMING, filter)}>Tiền vào</button>
                <button onClick={() => setFilter(TransactionType.OUTGOING)} className={getFilterButtonClass(TransactionType.OUTGOING, filter)}>Tiền ra</button>
                <button onClick={() => setFilter(TransactionType.LUCKY_MONEY)} className={getFilterButtonClass(TransactionType.LUCKY_MONEY, filter)}>Lì xì</button>
                <button onClick={() => setFilter(TransactionType.LOAN)} className={getFilterButtonClass(TransactionType.LOAN, filter)}>Khoản vay</button>
                <button onClick={() => setFilter(TransactionType.WITHDRAWAL)} className={getFilterButtonClass(TransactionType.WITHDRAWAL, filter)}>Rút tiền</button>
                <button onClick={() => setFilter(TransactionType.PROFIT)} className={getFilterButtonClass(TransactionType.PROFIT, filter)}>Lợi nhuận</button>
                <button onClick={() => setFilter(TransactionType.TOPUP)} className={getFilterButtonClass(TransactionType.TOPUP, filter)}>Nạp tiền</button>
            </div>
            
            <div key={`${filter}-${dateFilter}-${searchQuery}-${viewMode}`}>
                <TransactionHistory 
                transactions={filteredTransactions} 
                onViewTransaction={onViewTransaction}
                viewMode={viewMode}
                currency={currency}
                />
            </div>
        </div>
      ) : (
         <div className="animate-fade-in">
            <RecurringTransactionList 
                recurringTransactions={recurringTransactions}
                onDelete={onDeleteRecurring}
                onToggleActive={onToggleRecurringActive}
                currency={currency}
            />
         </div>
      )}

    </div>
  );
};