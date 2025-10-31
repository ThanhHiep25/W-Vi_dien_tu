import React, { useState, useEffect } from 'react';
import { Currency } from '../types';
import { ArrowLeftIcon, BoltIcon, WifiIcon, TvIcon, WaterDropIcon, SpinnerIcon, CheckCircleIcon } from './icons';

type ServiceCategory = 'electricity' | 'water' | 'internet' | 'television';
interface ServiceProvider {
  id: string;
  name: string;
  logoUrl: string;
  category: ServiceCategory;
  customerIdLabel: string;
  customerIdPlaceholder: string;
}
export interface BillDetails {
  customerId: string;
  providerId: string;
  customerName: string;
  amountDue: number;
  dueDate: string;
  period: string;
}
interface BillPaymentViewProps {
  balance: number;
  currency: Currency;
  onPay: (provider: ServiceProvider, bill: BillDetails) => void;
  onBack: () => void;
  isBiometricEnabled: boolean;
  transactionLimits: { daily: number; perTransaction: number; };
  spentToday: number;
  onRequestBiometricAuth: (onConfirm: () => void, title: string) => void;
  onRequestOtpVerification: (onConfirm: () => Promise<void>, title: string) => void;
}

// --- MOCK DATA ---
const PROVIDERS: ServiceProvider[] = [
    { id: 'EVNHCMC', name: 'Điện lực TP.HCM', logoUrl: 'https://portal.cpc.vn/images/logo-cpc.png', category: 'electricity', customerIdLabel: 'Mã khách hàng', customerIdPlaceholder: 'PE12345678901' },
    { id: 'EVNHN', name: 'Điện lực Hà Nội', logoUrl: 'https://portal.cpc.vn/images/logo-cpc.png', category: 'electricity', customerIdLabel: 'Mã khách hàng', customerIdPlaceholder: 'PA09876543210' },
    { id: 'SAWACO', name: 'Cấp nước Gia Định', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Logo_T%E1%BB%95ng_c%C3%B4ng_ty_C%E1%BA%A5p_n%C6%B0%E1%BB%9Bc_S%C3%A0i_G%C3%B2n.svg/2048px-Logo_T%E1%BB%95ng_c%C3%B4ng_ty_C%E1%BA%A5p_n%C6%B0%E1%BB%9Bc_S%C3%A0i_G%C3%B2n.svg.png', category: 'water', customerIdLabel: 'Danh bạ', customerIdPlaceholder: '12345678901' },
    { id: 'FPT', name: 'FPT Telecom', logoUrl: 'https://inkythuatso.com/uploads/images/2021/11/logo-fpt-telecom-inkythuatso-2-01-25-16-12-07.jpg', category: 'internet', customerIdLabel: 'Số hợp đồng', customerIdPlaceholder: 'HND123456' },
    { id: 'VNPT', name: 'VNPT', logoUrl: 'https://vnpt.com.vn/Design/Image/logo-vnpt.png', category: 'internet', customerIdLabel: 'Mã thanh toán', customerIdPlaceholder: 'VN12345678' },
    { id: 'KPLUS', name: 'Truyền hình K+', logoUrl: 'https://cdn.kplus.vn/Content/Images/logo-kplus.svg', category: 'television', customerIdLabel: 'Số thẻ giải mã', customerIdPlaceholder: '1234567890123' },
];

const mockFetchBill = (provider: ServiceProvider, customerId: string): Promise<BillDetails> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const hash = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
            const randomAmount = (Math.abs(hash(customerId + provider.id)) % 200) * 1000 + 50000;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 10);
            const periodDate = new Date();
            periodDate.setMonth(periodDate.getMonth() - 1);
            resolve({
                customerId,
                providerId: provider.id,
                customerName: "NGUYEN VAN A",
                amountDue: randomAmount,
                dueDate: dueDate.toISOString(),
                period: `${periodDate.getMonth() + 1}/${periodDate.getFullYear()}`,
            });
        }, 1500);
    });
};
// --- END MOCK DATA ---

type Step = 'select_service' | 'enter_details' | 'confirm';

const ServiceCategoryButton: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void }> = ({ label, icon, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 active:scale-95">
        {icon}
        <p className="font-semibold text-sm text-white">{label}</p>
    </button>
);

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const BillPaymentView: React.FC<BillPaymentViewProps> = ({ balance, currency, onPay, onBack, isBiometricEnabled, transactionLimits, spentToday, onRequestBiometricAuth, onRequestOtpVerification }) => {
    const [step, setStep] = useState<Step>('select_service');
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
    const [customerId, setCustomerId] = useState('');
    const [bill, setBill] = useState<BillDetails | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState('');

    const handleCheckBill = async () => {
        if (!selectedProvider || !customerId) {
            setError('Vui lòng chọn nhà cung cấp và nhập mã khách hàng.');
            return;
        }
        setError('');
        setIsFetching(true);
        setBill(null);
        try {
            const fetchedBill = await mockFetchBill(selectedProvider, customerId);
            setBill(fetchedBill);
        } catch (e) {
            setError('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại thông tin.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleConfirmPayment = () => {
        if (!selectedProvider || !bill) return;

        const performPayment = async () => {
            onPay(selectedProvider, bill);
        };

        const startOtpFlow = () => {
            onRequestOtpVerification(performPayment, `Thanh toán ${formatCurrency(bill.amountDue, currency)}`);
        };

        if (isBiometricEnabled) {
            onRequestBiometricAuth(startOtpFlow, `Thanh toán hóa đơn`);
        } else {
            startOtpFlow();
        }
    };

    const Header: React.FC<{ title: string; onBackClick: () => void }> = ({ title, onBackClick }) => (
        <div className="p-4 flex items-center gap-4 flex-shrink-0">
            <button onClick={onBackClick} className="p-2 -ml-2 rounded-full hover:bg-gray-700 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">{title}</h2>
        </div>
    );

    const renderSelectService = () => (
        <div className="animate-fade-in-up">
            <Header title="Thanh toán Hóa đơn" onBackClick={onBack} />
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <ServiceCategoryButton label="Điện" icon={<BoltIcon className="w-8 h-8 text-yellow-400"/>} onClick={() => { setSelectedCategory('electricity'); setStep('enter_details'); }} />
                <ServiceCategoryButton label="Nước" icon={<WaterDropIcon className="w-8 h-8 text-blue-400"/>} onClick={() => { setSelectedCategory('water'); setStep('enter_details'); }} />
                <ServiceCategoryButton label="Internet" icon={<WifiIcon className="w-8 h-8 text-green-400"/>} onClick={() => { setSelectedCategory('internet'); setStep('enter_details'); }} />
                <ServiceCategoryButton label="Truyền hình" icon={<TvIcon className="w-8 h-8 text-purple-400"/>} onClick={() => { setSelectedCategory('television'); setStep('enter_details'); }} />
            </div>
        </div>
    );

    const renderEnterDetails = () => {
        const providersForCategory = PROVIDERS.filter(p => p.category === selectedCategory);
        
        const isOverPerTxLimit = bill && bill.amountDue > transactionLimits.perTransaction;
        const remainingDailyLimit = transactionLimits.daily - spentToday;
        const isOverDailyLimit = bill && (bill.amountDue > remainingDailyLimit);

        return (
            <div className="animate-fade-in-up">
                <Header title="Chi tiết Hóa đơn" onBackClick={() => { setStep('select_service'); setBill(null); setCustomerId(''); setError(''); setSelectedProvider(null); }} />
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nhà cung cấp</label>
                        <div className="grid grid-cols-2 gap-2">
                            {providersForCategory.map(p => (
                                <button key={p.id} onClick={() => setSelectedProvider(p)} className={`p-2 rounded-lg border-2 transition-colors ${selectedProvider?.id === p.id ? 'bg-primary-500/20 border-primary-500' : 'bg-gray-800 border-gray-700'}`}>
                                    <img src={p.logoUrl} alt={p.name} className="h-10 mx-auto object-contain"/>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedProvider && (
                        <div className="animate-fade-in">
                            <label htmlFor="customerId" className="block text-sm font-medium text-gray-400 mb-1">{selectedProvider.customerIdLabel}</label>
                            <input
                                type="text"
                                id="customerId"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                placeholder={selectedProvider.customerIdPlaceholder}
                                className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600"
                            />
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button onClick={handleCheckBill} disabled={isFetching || !selectedProvider || !customerId} className="w-full bg-primary-600 font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50 mt-4">
                        {isFetching ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'Kiểm tra Hóa đơn'}
                    </button>

                    {bill && (
                         <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 animate-fade-in-up space-y-2">
                            <h3 className="font-bold text-center text-lg">Thông tin hóa đơn</h3>
                            <div className="flex justify-between"><span className="text-gray-400">Tên khách hàng:</span><span className="font-semibold">{bill.customerName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Kỳ thanh toán:</span><span className="font-semibold">{bill.period}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Hạn thanh toán:</span><span className="font-semibold">{new Date(bill.dueDate).toLocaleDateString('vi-VN')}</span></div>
                            <div className="flex justify-between items-baseline pt-2 border-t border-gray-600 mt-2"><span className="text-gray-400 text-lg">Tổng tiền:</span><span className="font-bold text-2xl text-yellow-400">{formatCurrency(bill.amountDue, currency)}</span></div>
                            
                            {balance < bill.amountDue && <p className="text-red-400 text-center text-sm font-semibold mt-2">Số dư không đủ để thanh toán.</p>}
                            {isOverPerTxLimit && <p className="text-red-400 text-center text-sm font-semibold mt-2">Vượt hạn mức giao dịch (tối đa {formatCurrency(transactionLimits.perTransaction, currency)}).</p>}
                            {isOverDailyLimit && <p className="text-red-400 text-center text-sm font-semibold mt-2">Vượt hạn mức hàng ngày (còn lại {formatCurrency(remainingDailyLimit, currency)}).</p>}


                            <button onClick={() => setStep('confirm')} disabled={balance < bill.amountDue || isOverPerTxLimit || isOverDailyLimit} className="w-full bg-green-600 font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50 mt-4">
                                Thanh toán
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderConfirm = () => {
        if (!bill || !selectedProvider) return null;
        return (
            <div className="animate-fade-in-up p-6 flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4">Xác nhận Thanh toán</h2>
                <img src={selectedProvider.logoUrl} alt={selectedProvider.name} className="h-16 bg-white p-2 rounded-lg mb-4"/>
                <p className="text-gray-400">Thanh toán cho</p>
                <p className="font-bold text-lg">{selectedProvider.name}</p>

                <p className="text-5xl font-extrabold my-6">{formatCurrency(bill.amountDue, currency)}</p>

                 <div className="w-full bg-gray-800 p-3 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Tên khách hàng:</span><span>{bill.customerName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Mã khách hàng:</span><span>{bill.customerId}</span></div>
                </div>

                <div className="flex gap-4 pt-8 w-full">
                    <button onClick={() => setStep('enter_details')} className="w-full bg-gray-600 font-bold py-3 rounded-lg">Quay lại</button>
                    <button onClick={handleConfirmPayment} className="w-full bg-primary-600 font-bold py-3 rounded-lg flex justify-center items-center">
                        Xác nhận
                    </button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (step) {
            case 'enter_details': return renderEnterDetails();
            case 'confirm': return renderConfirm();
            case 'select_service':
            default: return renderSelectService();
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {renderContent()}
        </div>
    );
};
