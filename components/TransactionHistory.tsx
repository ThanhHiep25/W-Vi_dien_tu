import React from 'react';
import { Transaction, Currency } from '../types';
import { TransactionItem } from './TransactionItem';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onViewTransaction: (transaction: Transaction) => void;
  viewMode: 'compact' | 'detailed';
  currency: Currency;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onViewTransaction, viewMode, currency }) => {
  const listContent = transactions.length > 0 ? (
    transactions.map((tx, index) => (
      <div
        key={tx.id}
        className="animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
      >
        <TransactionItem 
            transaction={tx} 
            onClick={onViewTransaction} 
            viewMode={viewMode}
            isLast={index === transactions.length - 1} 
            currency={currency}
        />
      </div>
    ))
  ) : (
    <p className="text-center text-gray-500 p-8 bg-gray-800 rounded-lg animate-fade-in-up">Không có giao dịch nào phù hợp.</p>
  );

  if (viewMode === 'detailed') {
    return <div className="space-y-3">{listContent}</div>;
  }
  
  return <div className="bg-gray-800 rounded-lg overflow-hidden">{listContent}</div>;
};