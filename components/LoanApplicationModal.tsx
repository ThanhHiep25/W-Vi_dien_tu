import React, { useState, useMemo, useEffect } from 'react';
import { Loan, Currency, User } from '../types';
import { SpinnerIcon, XMarkIcon, CheckCircleIcon, DocumentDuplicateIcon } from './icons';

interface LoanApplicationModalProps {
  user: User;
  availableLoans: Loan[];
  balance: number;
  currency: Currency;
  onApply: (details: { loan: Loan; amount: number; term: number }) => void;
  onCancel: () => void;
  isBiometricEnabled: boolean;
  onRequestBiometricAuth: (onConfirm: () => void, title: string) => void;
  onRequestOtpVerification: (onConfirm: () => Promise<void>, title: string) => void;
  userCreditScore: number;
}

type Step = 'checking_score' | 'select' | 'details' | 'form' | 'contract_review';

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number): number => {
    if (principal <= 0 || annualRate < 0 || termMonths <= 0) return 0;
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) return principal / termMonths;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    return payment;
};

export const LoanApplicationModal: React.FC<LoanApplicationModalProps> = ({ user, availableLoans, balance, currency, onApply, onCancel, isBiometricEnabled, onRequestBiometricAuth, onRequestOtpVerification, userCreditScore }) => {
  const [step, setStep] = useState<Step>('checking_score');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);


  useEffect(() => {
    if (step === 'checking_score') {
      const timer = setTimeout(() => {
        setStep('select');
      }, 2000); // Simulate for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [step]);

  const monthlyPayment = useMemo(() => {
    if (!selectedLoan) return 0;
    return calculateMonthlyPayment(amount, selectedLoan.interestRate, term);
  }, [amount, term, selectedLoan]);

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setAgreedToTerms(false);
    setStep('details');
  };

  const handleProceedToForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setAmount(Math.min(1000000, selectedLoan.maxAmount)); // Default amount
    setTerm(selectedLoan.minTerm); // Default term
    setStep('form');
  }

  const handleProceedToContract = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('contract_review');
  };
  
  const handleConfirm = () => {
    const performApply = async () => {
        if (!selectedLoan) return;
        setIsProcessing(true);
        // Simulate API call
        return new Promise<void>(resolve => {
            setTimeout(() => {
                onApply({ loan: selectedLoan, amount, term });
                // Parent will close modal and show success screen
                setIsProcessing(false);
                resolve();
            }, 1500);
        });
    };

    const startOtpFlow = () => {
        onRequestOtpVerification(performApply, `Xác thực vay ${formatCurrency(amount, currency)}`);
    };

    if (isBiometricEnabled) {
        onRequestBiometricAuth(startOtpFlow, `Vay ${formatCurrency(amount, currency)}`);
    } else {
        startOtpFlow();
    }
  };
  
  const handleGoBack = () => {
    if (step === 'contract_review') setStep('form');
    else if (step === 'form') setStep('details');
    else if (step === 'details') setStep('select');
    else onCancel();
  };

  const renderCheckingScoreStep = () => (
    <div className="flex flex-col items-center justify-center text-center h-64">
        <SpinnerIcon className="w-12 h-12 text-primary-400 animate-spin" />
        <h2 className="text-xl font-bold mt-6">Đang đánh giá điểm tín dụng...</h2>
        <p className="text-gray-400 mt-2">Vui lòng chờ trong giây lát. Hệ thống đang phân tích lịch sử giao dịch của bạn.</p>
    </div>
  );

  const renderSelectStep = () => (
    <div>
        <h2 className="text-2xl font-bold mb-2 text-center">Chọn Gói Vay</h2>
        <p className="text-center text-gray-400 mb-6">
            Điểm tín dụng của bạn: <span className="font-bold text-lg text-primary-300">{userCreditScore}</span>
        </p>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {availableLoans.map(loan => {
                const isEligible = userCreditScore >= loan.minCreditScore;
                return (
                    <div 
                        key={loan.id} 
                        className={`bg-gray-700 p-4 rounded-lg border border-gray-600 transition-opacity ${!isEligible ? 'opacity-50' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2 flex-wrap">
                                 <h3 className="font-bold text-lg text-primary-300">{loan.name}</h3>
                                 {loan.tag && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${loan.tag === 'Trong Ngày' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                                        {loan.tag}
                                    </span>
                                 )}
                            </div>
                             {isEligible ? (
                                <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2 py-1 rounded-full flex-shrink-0">Đủ điều kiện</span>
                             ) : (
                                <span className="text-xs font-semibold bg-red-500/20 text-red-300 px-2 py-1 rounded-full flex-shrink-0">Cần {loan.minCreditScore} điểm</span>
                             )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 mb-3">{loan.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-600 pt-3">
                            <div><span className="text-gray-500">Lãi suất:</span> <span className="font-semibold text-white">{loan.interestRate * 100}%/năm</span></div>
                            <div><span className="text-gray-500">Kỳ hạn:</span> <span className="font-semibold text-white">{loan.minTerm} - {loan.maxTerm} tháng</span></div>
                            <div className="col-span-2"><span className="text-gray-500">Hạn mức:</span> <span className="font-semibold text-white">tối đa {formatCurrency(loan.maxAmount, currency)}</span></div>
                        </div>
                        <button 
                            onClick={() => handleSelectLoan(loan)} 
                            disabled={!isEligible}
                            className="w-full mt-3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEligible ? 'Xem chi tiết & Đăng ký' : 'Chưa đủ điều kiện'}
                        </button>
                    </div>
                );
            })}
        </div>
    </div>
  );
  
  const renderDetailsStep = () => {
    if (!selectedLoan) return null;
    return (
      <form onSubmit={handleProceedToForm}>
        <h2 className="text-2xl font-bold mb-1 text-center">Điều khoản Gói vay</h2>
        <p className="text-center text-primary-300 font-semibold mb-6">{selectedLoan.name}</p>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            <div>
                <h3 className="font-bold text-white mb-2">Tiêu chí đăng ký</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 bg-gray-700/50 p-3 rounded-lg">
                    {selectedLoan.criteria.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
             <div>
                <h3 className="font-bold text-white mb-2">Điều khoản chính</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 bg-gray-700/50 p-3 rounded-lg">
                    {selectedLoan.terms.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        </div>

        <div className="mt-6">
            <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 text-primary-600 bg-gray-900 border-gray-500 rounded focus:ring-primary-600"
                />
                <span className="text-sm font-medium text-white">Tôi đã đọc, hiểu rõ và đồng ý với tất cả các điều khoản và điều kiện trên.</span>
            </label>
        </div>
        
        <div className="flex gap-4 pt-4 mt-4 border-t border-gray-700">
            <button type="button" onClick={handleGoBack} className="w-full bg-gray-600 font-bold py-3 rounded-lg">Quay lại</button>
            <button type="submit" disabled={!agreedToTerms} className="w-full bg-primary-600 font-bold py-3 rounded-lg disabled:opacity-50">Tiếp tục</button>
        </div>
      </form>
    );
  };

  const renderFormStep = () => {
    if (!selectedLoan) return null;
    return (
        <form onSubmit={handleProceedToContract}>
            <h2 className="text-2xl font-bold mb-1 text-center">Tùy chỉnh Khoản vay</h2>
            <p className="text-center text-primary-300 font-semibold mb-6">{selectedLoan.name}</p>
            
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="amount" className="font-medium text-gray-300">Số tiền vay</label>
                        <span className="font-bold text-lg text-white">{formatCurrency(amount, currency)}</span>
                    </div>
                    <input
                      type="range"
                      id="amount"
                      min={500000}
                      max={selectedLoan.maxAmount}
                      step={100000}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>500K</span>
                        <span>{formatCurrency(selectedLoan.maxAmount, 'VND').replace(/\s*₫/,'')}</span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="term" className="font-medium text-gray-300">Kỳ hạn vay</label>
                        <span className="font-bold text-lg text-white">{term} tháng</span>
                    </div>
                    <input
                      type="range"
                      id="term"
                      min={selectedLoan.minTerm}
                      max={selectedLoan.maxTerm}
                      step={1}
                      value={term}
                      onChange={(e) => setTerm(Number(e.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-primary"
                    />
                     <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{selectedLoan.minTerm} tháng</span>
                        <span>{selectedLoan.maxTerm} tháng</span>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Ước tính trả hàng tháng</p>
                    <p className="text-2xl font-bold text-primary-300 mt-1">{formatCurrency(monthlyPayment, currency)}</p>
                </div>
            </div>

            <div className="flex gap-4 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={handleGoBack} className="w-full bg-gray-600 font-bold py-3 rounded-lg">Quay lại</button>
                <button type="submit" className="w-full bg-primary-600 font-bold py-3 rounded-lg">Xem lại Hợp đồng</button>
            </div>
        </form>
    );
  }

  const renderContractReviewStep = () => {
     if (!selectedLoan) return null;
     const totalRepayment = monthlyPayment * term;
     return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-center text-white mb-4">Hợp đồng Vay điện tử</h3>
            <div className="bg-gray-700 p-4 rounded-lg space-y-3 max-h-[50vh] overflow-y-auto">
                <div className="text-center pb-2 border-b border-gray-600">
                  <h4 className="font-semibold text-primary-300">{selectedLoan.provider}</h4>
                  <p className="text-xs text-gray-400">Mã hợp đồng: HD-{Date.now()}</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-300">Bên Vay (A):</h5>
                  <p className="text-sm pl-2">{user.name}</p>
                </div>
                <div>
                  <h5 className="font-bold text-gray-300">Bên Cho Vay (B):</h5>
                  <p className="text-sm pl-2">{selectedLoan.provider}</p>
                </div>

                <div className="pt-2 border-t border-gray-600">
                  <h5 className="font-bold text-gray-300 text-center mb-2">ĐIỀU KHOẢN KHOẢN VAY</h5>
                  <div className="flex justify-between items-center"><span className="text-gray-400">Số tiền giải ngân:</span> <span className="font-bold text-lg text-white">{formatCurrency(amount, currency)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">Kỳ hạn:</span> <span className="font-semibold text-white">{term} tháng</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">Lãi suất:</span> <span className="font-semibold text-white">{selectedLoan.interestRate * 100}%/năm</span></div>
                  <div className="flex justify-between items-start"><span className="text-gray-400">Trả hàng tháng:</span> <span className="font-semibold text-primary-300 text-right pl-4">{formatCurrency(monthlyPayment, currency)}</span></div>
                  <div className="flex justify-between items-start"><span className="text-gray-400">Tổng trả (dự kiến):</span> <span className="font-semibold text-white text-right pl-4">{formatCurrency(totalRepayment, currency)}</span></div>
                </div>
            </div>
            <p className="text-xs text-gray-400 text-center italic">Bằng việc nhấn nút bên dưới, bạn xác nhận đồng ý với các điều khoản của hợp đồng điện tử này.</p>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleGoBack} disabled={isProcessing} className="w-full bg-gray-600 font-bold py-3 rounded-lg disabled:opacity-50">Quay lại</button>
                <button type="button" onClick={handleConfirm} disabled={isProcessing} className="w-full bg-primary-600 font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50">
                    {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Xác nhận & Ký Hợp đồng'}
                </button>
            </div>
        </div>
     );
  };
  
  const renderContent = () => {
    switch(step) {
        case 'checking_score': return renderCheckingScoreStep();
        case 'details': return renderDetailsStep();
        case 'form': return renderFormStep();
        case 'contract_review': return renderContractReviewStep();
        case 'select':
        default: return renderSelectStep();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md text-white animate-fade-in-up relative">
        {step !== 'checking_score' && (
            <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
            </button>
        )}
        {renderContent()}
      </div>
      <style>{`
        .range-thumb-primary::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background-color: rgb(var(--color-primary-500));
            border-radius: 50%;
            cursor: pointer;
            margin-top: -6px; /* Center thumb */
        }
        .range-thumb-primary::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background-color: rgb(var(--color-primary-500));
            border-radius: 50%;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};