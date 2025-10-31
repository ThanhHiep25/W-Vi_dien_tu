import React, { useState, useEffect, useRef } from 'react';
import { SpinnerIcon } from './icons';

interface OtpVerificationModalProps {
  title: string;
  onConfirm: () => Promise<boolean>;
  onCancel: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({ title, onConfirm, onCancel }) => {
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(10);
  const [progressKey, setProgressKey] = useState(0); // To reset CSS animation

  const generateAndLogOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setDisplayOtp(Array(6).fill('')); // Clear display for animation
    console.log(`%c[OTP SIMULATION] Your verification code is: ${newOtp}`, 'color: #22c55e; font-weight: bold; font-size: 14px;');
    
    // Animate display
    const digits = newOtp.split('');
    digits.forEach((digit, index) => {
      setTimeout(() => {
        setDisplayOtp(prev => {
            const newDisplay = [...prev];
            newDisplay[index] = digit;
            return newDisplay;
        });
      }, (index + 1) * 120);
    });
  };
  
  useEffect(() => {
    generateAndLogOtp();
  }, [progressKey]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
        setError('Mã OTP đã hết hạn.');
    }
  }, [timer, progressKey]);

  const handleResend = () => {
    setTimer(10);
    setError('');
    setProgressKey(prev => prev + 1); // This triggers regeneration and timer restart
  };

  const handleSubmit = async () => {
    if (timer === 0) {
      setError('Mã OTP đã hết hạn. Vui lòng gửi lại.');
      return;
    }

    setError('');
    setIsVerifying(true);
    const success = await onConfirm();
    setIsVerifying(false);
    
    if (!success) {
      setError('Xác thực thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm text-white animate-fade-in-up flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center">Xác thực Giao dịch</h2>
        <p className="text-sm text-gray-400 mt-2 text-center">{title}</p>
        
        <div className="my-6 space-y-3 w-full">
            <div className="flex justify-center gap-2">
            {displayOtp.map((digit, index) => (
                <div
                key={index}
                className={`w-12 h-14 bg-gray-700 rounded-lg flex items-center justify-center text-3xl font-bold transition-all duration-300 ${digit ? 'animate-scale-in' : 'opacity-0'}`}
                >
                {digit}
                </div>
            ))}
            </div>
             <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                    key={progressKey}
                    className={`h-full rounded-full bg-primary-500 origin-left ${timer > 0 ? 'animate-progress-bar' : ''}`}
                    style={{ animationPlayState: timer > 0 ? 'running' : 'paused' }}
                ></div>
             </div>
        </div>


        {error && <p className="text-red-400 text-sm font-semibold text-center mb-4 bg-red-500/10 p-2 rounded-md">{error}</p>}
        
        <div className="text-center text-sm text-gray-400 mb-6">
          {timer > 0 ? (
            <p>Mã sẽ hết hạn sau <span className="font-bold text-primary-400">{timer}</span> giây</p>
          ) : (
            <button onClick={handleResend} className="font-semibold text-primary-400 hover:underline">
              Gửi lại mã
            </button>
          )}
        </div>
        
        <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={isVerifying || timer === 0}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isVerifying ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : 'Xác nhận'}
            </button>
            <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
              Hủy
            </button>
        </div>
      </div>
    </div>
  );
};