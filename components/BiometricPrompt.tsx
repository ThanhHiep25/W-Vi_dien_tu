
import React, { useState, useEffect } from 'react';
import { FingerPrintIcon, CheckCircleIcon } from './icons';

interface BiometricPromptProps {
  title: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type ScanState = 'scanning' | 'success';

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({ title, onSuccess, onCancel }) => {
  const [scanState, setScanState] = useState<ScanState>('scanning');

  useEffect(() => {
    if (scanState === 'scanning') {
      const scanTimer = setTimeout(() => {
        setScanState('success');
      }, 1500); // Simulate scanning for 1.5 seconds

      return () => clearTimeout(scanTimer);
    }
    
    if (scanState === 'success') {
      const successTimer = setTimeout(() => {
        onSuccess();
      }, 800); // Show success checkmark for 0.8 seconds

      return () => clearTimeout(successTimer);
    }
  }, [scanState, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div 
        className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm text-white animate-fade-in-up flex flex-col items-center gap-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center">{title}</h2>
        <p className="text-sm text-gray-400 text-center -mt-4">
            {scanState === 'scanning' ? 'Vui lòng xác thực bằng sinh trắc học' : 'Xác thực thành công!'}
        </p>

        <div className="relative w-32 h-32 flex items-center justify-center">
          {scanState === 'success' ? (
            <div className="animate-scale-in">
              <CheckCircleIcon className="w-32 h-32 text-green-400" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
              <FingerPrintIcon className="w-16 h-16 text-primary-400" />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};
