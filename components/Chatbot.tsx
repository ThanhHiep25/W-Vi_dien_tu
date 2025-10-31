import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, Transaction, TransactionType, Loan, Currency, ChatMessage, SavingsGoal } from '../types';
import { SparklesIcon, XMarkIcon, SendIcon } from './icons';

interface ChatbotProps {
  user: User;
  balance: number;
  transactions: Transaction[];
  loans: Loan[];
  currency: Currency;
  onClose: () => void;
  savingsGoal: SavingsGoal | null;
  savingsProgress: number;
  userCreditScore: number;
}

const formatCurrency = (amount: number, currency: Currency) => {
    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale, { style: 'currency', currency });
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);


export const Chatbot: React.FC<ChatbotProps> = ({ user, balance, transactions, loans, currency, onClose, savingsGoal, savingsProgress, userCreditScore }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setMessages([{
            id: 'welcome-1',
            role: 'model',
            text: `Xin chào ${user.name}! Tôi là trợ lý AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?`
        }]);
    }, [user.name]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (messageText: string) => {
        const text = messageText.trim();
        if (!text || isThinking) return;

        const newUserMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', text };
        const loadingMessage: ChatMessage = { id: `msg-${Date.now()}-loading`, role: 'model', text: '', isLoading: true };
        
        setMessages(prev => [...prev, newUserMessage, loadingMessage]);
        setInput('');
        setIsThinking(true);

        // --- Prepare context for AI ---
        const transactionSummary = transactions.slice(0, 10).map(t => 
            `${t.type === TransactionType.INCOMING ? 'Nhận' : 'Gửi'} ${formatCurrency(t.amount, currency)} - ${t.description} - ${new Date(t.date).toLocaleDateString('vi-VN')}`
        ).join('\n');

        const loanSummary = loans.map(l => 
            `Tên: ${l.name}, Lãi suất: ${l.interestRate * 100}%/năm, Tối đa: ${formatCurrency(l.maxAmount, currency)}`
        ).join('\n');
        
        const transactionStats = transactions.reduce((acc, tx) => {
            acc[tx.type] = (acc[tx.type] || 0) + 1;
            return acc;
        }, {} as Record<TransactionType, number>);

        const savingsGoalSummary = savingsGoal 
            ? `Người dùng có mục tiêu tiết kiệm là "${savingsGoal.name}" với mục tiêu ${formatCurrency(savingsGoal.targetAmount, currency)}. Hiện đã tiết kiệm được ${formatCurrency(savingsProgress, currency)}.`
            : "Người dùng chưa có mục tiêu tiết kiệm.";

        const systemInstruction = `Bạn là một trợ lý tài chính ảo thông minh, thân thiện và chủ động cho ứng dụng "Ví Điện Tử Sinh Lời".
        - Tên người dùng là ${user.name}.
        - Số dư hiện tại là ${formatCurrency(balance, currency)}.
        - Điểm tín dụng của người dùng là ${userCreditScore}.
        - ${savingsGoalSummary}
        - Luôn trả lời bằng tiếng Việt.
        - Giữ câu trả lời ngắn gọn, rõ ràng và hữu ích. Dùng markdown để định dạng câu trả lời cho dễ đọc.
        - Hãy chủ động đưa ra các gợi ý hoặc lời khuyên dựa trên dữ liệu. Ví dụ: nếu thấy người dùng chi nhiều cho ăn uống, hãy gợi ý họ đặt mục tiêu tiết kiệm. Nếu điểm tín dụng thấp, hãy gợi ý cách cải thiện.
        - Dữ liệu bạn có bao gồm: thông tin người dùng, số dư, điểm tín dụng, mục tiêu tiết kiệm, lịch sử giao dịch gần đây, và các gói vay hiện có.
        - Dưới đây là dữ liệu hiện tại để bạn tham khảo:
        
        ### Thống kê Giao dịch
        - Tổng số giao dịch: ${transactions.length}
        - Tiền vào: ${transactionStats.incoming || 0}
        - Tiền ra: ${transactionStats.outgoing || 0}
        - Nạp tiền: ${transactionStats.topup || 0}
        - Rút tiền: ${transactionStats.withdrawal || 0}
        - Lợi nhuận: ${transactionStats.profit || 0}

        ### Tóm tắt 10 Giao dịch Gần đây
        ${transactionSummary || 'Chưa có giao dịch.'}

        ### Các Gói Vay Hiện Có
        ${loanSummary}
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: text,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            
            const aiResponseText = response.text;
            const newModelMessage: ChatMessage = { id: `msg-${Date.now()}-response`, role: 'model', text: aiResponseText };
            
            setMessages(prev => prev.filter(m => !m.isLoading).concat(newModelMessage));

        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage: ChatMessage = { id: `msg-${Date.now()}-error`, role: 'model', text: "Rất tiếc, tôi đang gặp sự cố. Vui lòng thử lại sau." };
            setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage));
        } finally {
            setIsThinking(false);
        }
    };

    const suggestedQuestions = [
        "Số dư của tôi?",
        "Thống kê giao dịch.",
        "5 giao dịch gần nhất?",
        "Các gói vay?",
    ];
    
    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 transition-opacity animate-fade-in" 
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            {/* Popup Container */}
            <div 
                className="fixed bottom-24 right-4 z-10 bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm h-[70vh] max-h-[550px] flex flex-col overflow-hidden animate-fade-in-right"
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-primary-400" />
                        <h2 id="chatbot-title" className="text-xl font-bold text-white">Trợ lý AI</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Đóng Trợ lý AI">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </header>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>}
                            <div className={`max-w-xs px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                {msg.isLoading ? <TypingIndicator /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Suggested Questions */}
                <div className="p-2 border-t border-gray-700 flex-shrink-0">
                    <div className="flex flex-wrap gap-2 justify-center p-2">
                        {suggestedQuestions.map(q => (
                            <button 
                                key={q}
                                onClick={() => handleSendMessage(q)}
                                disabled={isThinking}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 py-1.5 px-3 rounded-full transition-colors disabled:opacity-50"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Form */}
                <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập câu hỏi của bạn..."
                            disabled={isThinking}
                            className="flex-1 w-full bg-gray-700 border-gray-600 rounded-lg p-3 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                        />
                        <button type="submit" disabled={!input.trim() || isThinking} className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};