
import React, { useState } from 'react';
import { User, RewardTask, Voucher, UserVoucher } from '../types';
import { CoinIcon, CheckCircleIcon } from './icons';

interface RewardsProps {
    user: User;
    tasks: RewardTask[];
    availableVouchers: Voucher[];
    userVouchers: UserVoucher[];
    onRedeemVoucher: (voucherId: string) => void;
}

const TaskItem: React.FC<{ task: RewardTask }> = ({ task }) => {
    const progress = Math.min((task.currentCount / task.targetCount) * 100, 100);
    const isCompleted = progress >= 100;

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className={`font-bold ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                </div>
                <div className="flex items-center gap-1 font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full text-sm">
                    <CoinIcon className="w-4 h-4" />
                    <span>+{task.coins}</span>
                </div>
            </div>
            <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Tiến độ</span>
                    <span>{task.currentCount}/{task.targetCount}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const VoucherItem: React.FC<{ voucher: Voucher; userCoins: number; onRedeem: () => void; }> = ({ voucher, userCoins, onRedeem }) => {
    const canAfford = userCoins >= voucher.coinCost;

    return (
        <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-700">
            <img src={voucher.merchantLogo} alt={voucher.merchantName} className="w-14 h-14 rounded-full bg-white p-1 object-contain flex-shrink-0"/>
            <div className="flex-grow">
                <p className="font-bold text-white">{voucher.merchantName}</p>
                <p className="text-sm text-gray-300">{voucher.description}</p>
            </div>
            <button
                onClick={onRedeem}
                disabled={!canAfford}
                className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-all w-24 flex-shrink-0"
            >
                <div className={`flex items-center gap-1 font-bold text-sm ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                    <CoinIcon className="w-4 h-4"/>
                    <span>{voucher.coinCost}</span>
                </div>
                <span className="text-xs mt-1">{canAfford ? 'Đổi' : 'Không đủ'}</span>
            </button>
        </div>
    );
};

const UserVoucherItem: React.FC<{ voucher: UserVoucher }> = ({ voucher }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-dashed border-primary-600">
        <img src={voucher.merchantLogo} alt={voucher.merchantName} className="w-14 h-14 rounded-full bg-white p-1 object-contain flex-shrink-0"/>
        <div className="flex-grow">
            <p className="font-bold text-white">{voucher.merchantName}</p>
            <p className="text-sm text-primary-300">{voucher.description}</p>
            <p className="text-xs text-gray-400 mt-1">HSD: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</p>
        </div>
        <button
            onClick={() => navigator.clipboard.writeText(voucher.code)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg"
        >
            Dùng
        </button>
    </div>
);


export const Rewards: React.FC<RewardsProps> = ({ user, tasks, availableVouchers, userVouchers, onRedeemVoucher }) => {
    const [activeTab, setActiveTab] = useState<'redeem' | 'myVouchers'>('redeem');
    
    const TabButton: React.FC<{ tabId: 'redeem' | 'myVouchers', label: string, count: number }> = ({ tabId, label, count }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 py-3 text-center font-semibold transition-colors duration-300 relative ${
                activeTab === tabId
                    ? 'border-b-2 border-primary-500 text-primary-400'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-white'
            }`}
        >
            {label}
            <span className="ml-2 bg-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
        </button>
    );

    return (
        <div className="p-4 md:p-6 text-white max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center bg-gray-800 p-6 rounded-2xl mb-8 border border-gray-700">
                 <h1 className="text-2xl font-bold">Trung tâm Ưu đãi</h1>
                 <p className="text-gray-400 mt-1">Hoàn thành nhiệm vụ, tích Xu và đổi quà hấp dẫn!</p>
                 <div className="mt-4 flex items-center gap-2 py-2 px-4 bg-yellow-400/10 rounded-full">
                    <CoinIcon className="w-8 h-8 text-yellow-400"/>
                    <span className="font-bold text-3xl text-white">{user.coinBalance}</span>
                    <span className="font-semibold text-gray-300 ml-1">Xu</span>
                 </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Nhiệm vụ hằng ngày</h2>
                <div className="space-y-3">
                    {tasks.map(task => <TaskItem key={task.id} task={task} />)}
                </div>
            </div>

            <div>
                <div className="flex border-b border-gray-700 mb-4">
                    <TabButton tabId="redeem" label="Đổi Voucher" count={availableVouchers.length} />
                    <TabButton tabId="myVouchers" label="Voucher của tôi" count={userVouchers.length} />
                </div>
                
                {activeTab === 'redeem' && (
                    <div className="space-y-3 animate-fade-in-up">
                        {availableVouchers.map(voucher => (
                            <VoucherItem
                                key={voucher.id}
                                voucher={voucher}
                                userCoins={user.coinBalance}
                                onRedeem={() => onRedeemVoucher(voucher.id)}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'myVouchers' && (
                    <div className="space-y-3 animate-fade-in-up">
                        {userVouchers.length > 0 ? (
                            userVouchers.map(voucher => <UserVoucherItem key={voucher.id} voucher={voucher} />)
                        ) : (
                            <div className="text-center text-gray-500 p-8 bg-gray-800/50 rounded-lg">
                                <p>Bạn chưa có voucher nào. Hãy tích cực làm nhiệm vụ và đổi voucher nhé!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
