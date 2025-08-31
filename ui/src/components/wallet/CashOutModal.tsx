import { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { TOKEN_DECIMALS } from './contracts';

export function CashOutModal({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const user = useQuery(api.users.getCurrentUser);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'paypal'>('bank');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const sellTokens = useAction(api.wallet.sellTokens);

  const handleCashOut = async () => {
    if (!user || !address) return;

    setIsWithdrawing(true);
    toast.loading('Processing withdrawal, will take a moment...');
    try {
      const res = await sellTokens({
        userId: user._id,
        address,
        amount: BigInt(amount * 10 ** TOKEN_DECIMALS),
      });
      toast.dismiss();
      if (res.success) {
        toast.success('Withdrawal successful!');
        onClose();
      } else {
        toast.error(`Withdrawal failed: ${res.error}`);
      }
    } catch (e) {
      toast.dismiss();
      console.log(e);
      toast.error('Withdrawal failed. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!user) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>Withdraw TTCoins!</h2>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-2xl'>
              ×
            </button>
          </div>

          {address ? (
            <div>
              <div className='mb-4'>
                <label htmlFor='amount' className='block text-sm font-medium text-gray-700 mb-1'>
                  Amount
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    id='amount'
                    className='block w-full border border-gray-300 rounded-lg p-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter amount'
                    value={amount > 0 ? amount : ''}
                    onChange={(e) => setAmount(Math.floor(Number(e.target.value) * 10000) / 10000)}
                  />
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <span className='text-gray-500'>coins</span>
                  </div>
                </div>
                <div>={(amount * 0.0097).toFixed(2)} SGD</div>
              </div>
              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Withdraw To</label>
                <div className='relative bg-gray-100 rounded-lg p-1'>
                  <div className='flex'>
                    <button
                      type='button'
                      className='relative flex-1 text-center py-2 px-4 text-sm font-medium transition-colors duration-200 z-10'
                      onClick={() => setPaymentMethod('bank')}>
                      Bank Transfer
                    </button>
                    <button
                      type='button'
                      className='relative flex-1 text-center py-2 px-4 text-sm font-medium transition-colors duration-200 z-10'
                      onClick={() => setPaymentMethod('paypal')}>
                      PayPal
                    </button>
                  </div>
                  <div
                    className={`absolute top-1 left-1 w-1/2 h-9 bg-white rounded-md shadow-sm transition-transform duration-200 ease-out transform ${paymentMethod === 'bank' ? 'translate-x-0' : 'translate-x-[calc(100%-0.5rem)]'}`}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className='mb-6 p-4 bg-red-50 rounded-lg'>
              <div className='flex justify-center items-center'>
                <span className='text-red-500'>Please connect your wallet to top up</span>
              </div>
            </div>
          )}

          <div className='flex space-x-3'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'>
              Cancel
            </button>
            <button
              onClick={() => {
                handleCashOut().catch(() => {});
              }}
              disabled={isWithdrawing}
              className='flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
