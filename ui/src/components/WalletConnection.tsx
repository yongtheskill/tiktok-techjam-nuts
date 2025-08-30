import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { tokenAbi, tokenAddress } from './wallet/contracts';
import { toast } from 'sonner';
import { ConnectWalletButton } from './ConnectWalletButton';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { TopUpModal } from './wallet/TopUpModal';
import { CashOutModal } from './wallet/CashOutModal';
import { formatCoins } from '../lib/utils';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnection() {
  const user = useQuery(api.users.getCurrentUser);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const {
    data: coinBalance,
    isError: coinBalanceError,
    isLoading: coinBalanceLoading,
    refetch: refetchCoinBalance,
  } = useReadContract({
    address: tokenAddress,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: [address],
  });

  if (!user) return null;

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Wallet</h1>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
        <h2 className='text-xl font-semibold text-gray-900 mb-6'>Wallet Connection</h2>

        {address ? (
          <div className='space-y-4'>
            <div className='flex-1 flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center space-x-3'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <div>
                  <span className='text-green-700 font-medium'>Wallet Connected</span>
                  <div className='flex'>
                    <div>{address ? `${address.slice(0, 10)}...` : ''}</div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(address).catch(() => {});
                        toast.success('Address copied to clipboard!');
                      }}
                      className='pl-2'>
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  disconnect();
                  toast.success('Wallet disconnected!');
                }}
                className='px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors'>
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <div className='text-6xl mb-4'>🦊</div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>Connect Your Wallet!</h3>
            <p className='text-gray-500 mb-6'>Connect your wallet to send and receive gifts</p>
            <div className='flex justify-center'>
              <ConnectWalletButton />
            </div>
          </div>
        )}
      </div>

      {address && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>TTCoins</h2>
          <div className='flex justify-between items-center bg-blue-50 rounded-lg p-4'>
            <div>
              <div className='text-sm text-blue-600'>Coin Balance</div>
              <div className='text-2xl font-bold text-blue-600'>
                {coinBalanceLoading
                  ? 'Loading...'
                  : coinBalanceError
                    ? 'Error'
                    : formatCoins(coinBalance as number)}
              </div>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={() => {
                  setShowTopUpModal(true);
                }}
                className='px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm transition-colors'>
                Top Up!
              </button>

              <button
                onClick={() => {
                  setShowCashOutModal(true);
                }}
                className='px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm transition-colors'>
                Cash Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopUpModal && (
        <TopUpModal
          onClose={() => {
            setShowTopUpModal(false);
            refetchCoinBalance().catch(() => {});
          }}
        />
      )}

      {showCashOutModal && (
        <CashOutModal
          onClose={() => {
            setShowCashOutModal(false);
            refetchCoinBalance().catch(() => {});
          }}
        />
      )}
    </div>
  );
}
