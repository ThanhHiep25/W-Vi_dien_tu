import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Currency, LuckyMoneyPacket } from '../types';
import { ArrowLeftIcon, SpinnerIcon, GiftIcon, DocumentDuplicateIcon, CheckIcon, ShareIcon, WandSparklesIcon, MaiFlowerIcon, SunIcon, WalletIcon, FirecrackerIcon, LanternIcon } from './icons';

interface LuckyMoneyCreationDetails {
    totalAmount: number;
    quantity: number;
    type: 'equal' | 'random';
    message: string;
    isAnonymous: boolean;
}

interface LuckyMoneyFormProps {
    balance: number;
    currency: Currency;
    onCreatePacket: (details: LuckyMoneyCreationDetails) => Promise<LuckyMoneyPacket | null>;
    onBack: () => void;
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

const LUCKY_MESSAGES = [
    'Chúc bạn một năm mới an khang, thịnh vượng!',
    'Vạn sự như ý, tỷ sự như mơ!',
    'Cung chúc tân xuân, phát tài phát lộc.',
];

const TEMPLATES = {
    redGold: {
        bg: "bg-gradient-to-br from-red-700 to-red-900",
        pattern: "opacity-20",
        primaryText: "text-yellow-300",
        secondaryText: "text-red-200",
        logoColor: "text-yellow-300/80"
    },
    pinkSpring: {
        bg: "bg-gradient-to-br from-pink-600 to-rose-500",
        pattern: "opacity-10",
        primaryText: "text-white",
        secondaryText: "text-pink-200",
        logoColor: "text-white/80"
    },
    goldWealth: {
        bg: "bg-gradient-to-br from-yellow-500 to-amber-600",
        pattern: "opacity-20",
        primaryText: "text-red-800",
        secondaryText: "text-yellow-800",
        logoColor: "text-red-800/70"
    },
};

const STICKERS: Record<string, React.FC<any>> = {
    'mai': MaiFlowerIcon,
    'firecracker': FirecrackerIcon,
    'lantern': LanternIcon,
    'sun': SunIcon,
};

export const LuckyMoneyForm: React.FC<LuckyMoneyFormProps> = ({ balance, currency, onCreatePacket, onBack, isBiometricEnabled, transactionLimits, spentToday, onRequestBiometricAuth, onRequestOtpVerification }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [totalAmount, setTotalAmount] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [message, setMessage] = useState('');
    const [packetType, setPacketType] = useState<'equal' | 'random'>('random');
    const [isAnonymous, setIsAnonymous] = useState(false);
    
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createdPacket, setCreatedPacket] = useState<LuckyMoneyPacket | null>(null);
    const [copied, setCopied] = useState(false);
    
    const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('redGold');
    const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
    const [amountSuggestions, setAmountSuggestions] = useState<number[]>([]);
    const [isGeneratingWish, setIsGeneratingWish] = useState(false);

    useEffect(() => {
        setMessage(LUCKY_MESSAGES[Math.floor(Math.random() * LUCKY_MESSAGES.length)]);
    }, []);

    const numericAmount = parseFloat(totalAmount);
    const numericQuantity = parseInt(quantity, 10);

    const handleAmountChange = (value: string) => {
        const numericValue = value.replace(/[,.]/g, '');
        if (/^\d*$/.test(numericValue)) { // only allow numbers
            setTotalAmount(numericValue);

            const lastDigit = numericValue.slice(-1);
            if (['6', '8', '9'].includes(lastDigit)) {
                const suggestions = [
                    parseInt(`${lastDigit}${lastDigit}${lastDigit}${lastDigit}${lastDigit}`),
                    parseInt(`${lastDigit}8${lastDigit}8${lastDigit}8`),
                ];
                setAmountSuggestions(suggestions.filter(s => s > 0 && s <= 10000000));
            } else {
                setAmountSuggestions([]);
            }
        }
    };

    const handleGenerateWish = async () => {
        setIsGeneratingWish(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Viết một lời chúc Tết ngắn gọn (dưới 15 chữ), vui vẻ và ý nghĩa để ghi trên bao lì xì.',
            });
            const wish = response.text.replace(/["*]/g, '').trim();
            setMessage(wish);
        } catch (err) {
            console.error("AI Wish generation failed:", err);
            setMessage(LUCKY_MESSAGES[Math.floor(Math.random() * LUCKY_MESSAGES.length)]);
        } finally {
            setIsGeneratingWish(false);
        }
    };

    const handleCreatePacket = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isNaN(numericAmount) || numericAmount <= 0) { setError('Vui lòng nhập tổng số tiền hợp lệ.'); return; }
        if (isNaN(numericQuantity) || numericQuantity < 1) { setError('Số lượng lì xì phải lớn hơn hoặc bằng 1.'); return; }
        if (numericAmount > balance) { setError('Số dư không đủ để tạo lì xì.'); return; }
        if (numericAmount < numericQuantity) { setError('Tổng tiền phải lớn hơn hoặc bằng số lượng lì xì.'); return; }
        if (numericAmount > transactionLimits.perTransaction) {
            setError(`Số tiền vượt hạn mức mỗi giao dịch (${formatCurrency(transactionLimits.perTransaction, currency)}).`);
            return;
        }
        const remainingDailyLimit = transactionLimits.daily - spentToday;
        if (numericAmount > remainingDailyLimit) {
            setError(`Vượt hạn mức hàng ngày. Hạn mức còn lại: ${formatCurrency(remainingDailyLimit, currency)}.`);
            return;
        }

        const performCreation = async () => {
            setIsCreating(true);
            const packet = await onCreatePacket({
                totalAmount: numericAmount,
                quantity: numericQuantity,
                type: packetType,
                message: message.trim() || 'Chúc bạn may mắn!',
                isAnonymous,
            });
            setIsCreating(false);
            
            if (packet) {
                setCreatedPacket(packet);
                setStep('success');
            } else {
                setError('Tạo lì xì thất bại. Vui lòng thử lại.');
            }
        };

        const startOtpFlow = () => {
            onRequestOtpVerification(performCreation, `Xác thực tạo Lì xì ${formatCurrency(numericAmount, currency)}`);
        };

        if (isBiometricEnabled) {
            onRequestBiometricAuth(startOtpFlow, `Tạo Lì xì ${formatCurrency(numericAmount, currency)}`);
        } else {
            startOtpFlow();
        }
    };
    
    const shareLink = createdPacket ? `${window.location.origin}${window.location.pathname}?claim_li_xi=${createdPacket.shareId}` : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
      const shareData = {
        title: 'Bạn nhận được một Lì xì!',
        text: `Nhận lì xì may mắn từ ${createdPacket?.isAnonymous ? 'một người bạn' : createdPacket?.creatorName} với lời nhắn: "${createdPacket?.message}"`,
        url: shareLink,
      };
      try {
        if (navigator.share) { await navigator.share(shareData); } else { handleCopyLink(); alert('Đã sao chép liên kết Lì xì!'); }
      } catch (err) { console.error('Error sharing:', err); }
    };
    
    const currentTemplate = TEMPLATES[selectedTemplate];
    const StickerComponent = selectedSticker ? STICKERS[selectedSticker] : null;

    const renderForm = () => (
        <div className="flex flex-col h-full w-full bg-gray-900">
            <div className="p-4 flex items-center gap-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full text-gray-300 hover:bg-gray-700 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-white">Tạo Thiệp Lì xì</h2>
            </div>

            <div className="flex-grow overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side: Preview */}
                <div className="flex flex-col items-center gap-4">
                     <div className={`w-full max-w-[280px] aspect-[9/16] rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-lg transition-all duration-300 relative overflow-hidden ${currentTemplate.bg}`}>
                        <div className={`absolute inset-0 bg-repeat bg-center ${currentTemplate.pattern}`} style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-carbon.png')"}}></div>
                        
                        <div className="z-10 w-full flex-shrink-0">
                            <WalletIcon className={`w-10 h-10 mx-auto ${currentTemplate.logoColor}`} />
                        </div>

                        <div className="z-10 flex-grow flex flex-col justify-center items-center px-2">
                             <p className={`font-bold text-4xl break-all ${currentTemplate.primaryText}`}>{formatCurrency(numericAmount || 0, currency)}</p>
                        </div>

                        <div className="z-10 w-full flex-shrink-0">
                             <p className={`font-semibold text-base ${currentTemplate.secondaryText}`}>"{message || 'Chúc bạn may mắn!'}"</p>
                        </div>

                        {StickerComponent && (
                            <div className="absolute bottom-4 right-4 z-20 animate-scale-in">
                                <StickerComponent className={`w-12 h-12 ${currentTemplate.primaryText}`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}/>
                            </div>
                        )}
                    </div>
                     <div className="flex gap-3">
                        {Object.keys(TEMPLATES).map(key => (
                           <button key={key} onClick={() => setSelectedTemplate(key as keyof typeof TEMPLATES)} className={`w-10 h-10 rounded-full transition-all transform hover:scale-110 ${TEMPLATES[key as keyof typeof TEMPLATES].bg} ${selectedTemplate === key ? 'ring-4 ring-offset-2 ring-offset-gray-900 ring-primary-500' : ''}`}></button>
                        ))}
                    </div>
                </div>

                {/* Right side: Form */}
                <form onSubmit={handleCreatePacket} className="w-full space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tổng số tiền</label>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={numericAmount > 0 ? numericAmount.toLocaleString('vi-VN') : ''} 
                            onChange={(e) => handleAmountChange(e.target.value)} 
                            placeholder="0" 
                            className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-xl font-bold text-center text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                            autoFocus 
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">Số dư: {formatCurrency(balance, currency)}</p>
                         {amountSuggestions.length > 0 && <div className="flex gap-2 mt-2 justify-center">
                            {amountSuggestions.map(s => <button type="button" key={s} onClick={() => setTotalAmount(s.toString())} className="text-xs bg-gray-700 hover:bg-gray-600 font-semibold px-2 py-1 rounded-md">{s.toLocaleString('vi-VN')}</button>)}
                        </div>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Số lượng (phong)</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Lời chúc</label>
                        <div className="relative">
                            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 pr-10" />
                            <button type="button" onClick={handleGenerateWish} disabled={isGeneratingWish} className="absolute inset-y-0 right-0 flex items-center px-2 text-primary-400 hover:text-primary-300 disabled:opacity-50">
                                {isGeneratingWish ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <WandSparklesIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Thêm sticker</label>
                        <div className="flex flex-wrap gap-2">
                             <button type="button" onClick={() => setSelectedSticker(null)} className={`px-3 py-2 text-sm rounded-lg border-2 ${!selectedSticker ? 'bg-primary-600 border-primary-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>Không có</button>
                            {Object.keys(STICKERS).map(key => {
                                const StickerIcon = STICKERS[key];
                                return <button key={key} type="button" onClick={() => setSelectedSticker(key)} className={`p-2 rounded-lg border-2 ${selectedSticker === key ? 'bg-primary-600/20 border-primary-500' : 'bg-gray-700 border-gray-600'}`}><StickerIcon className="w-6 h-6 text-gray-200"/></button>
                            })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <label className="font-medium text-gray-300 cursor-pointer">Gửi ẩn danh</label>
                        <button type="button" role="switch" aria-checked={isAnonymous} onClick={() => setIsAnonymous(!isAnonymous)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 border-transparent ${isAnonymous ? 'bg-primary-600' : 'bg-gray-600'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm font-semibold text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
                    <div className="pt-2">
                        <button type="submit" disabled={isCreating} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all text-lg flex items-center justify-center disabled:opacity-50 shadow-lg transform active:scale-95">
                            {isCreating ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : `Tạo Lì xì ${formatCurrency(numericAmount || 0, currency)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
    
    const renderSuccess = () => {
        if (!createdPacket) return null;
        return (
            <div className="flex flex-col h-full w-full p-6 items-center justify-center text-center bg-gray-900 animate-fade-in">
                <div className="w-full max-w-md">
                    <div className="animate-scale-in">
                        <GiftIcon className="w-24 h-24 text-red-400 mx-auto mb-4"/>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Đã tạo Lì xì thành công!</h2>
                    <p className="text-gray-400 mt-2">Gửi liên kết này cho bạn bè để họ nhận Lì xì may mắn.</p>
                   
                    <div className="w-full bg-gray-800 p-2 rounded-lg flex items-center gap-2 border border-gray-700 my-6">
                        <p className="truncate text-sm text-gray-300 flex-grow text-left px-2">{shareLink}</p>
                        <button onClick={handleCopyLink} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 flex-shrink-0">
                           {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <DocumentDuplicateIcon className="w-5 h-5 text-gray-300" />}
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-4 w-full">
                        <button onClick={handleShare} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg">
                            <ShareIcon className="w-5 h-5" />
                            <span>Chia sẻ ngay</span>
                        </button>
                        <button onClick={onBack} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">
                          Hoàn tất
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return step === 'form' ? renderForm() : renderSuccess();
};
