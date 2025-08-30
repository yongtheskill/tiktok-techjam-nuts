import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { paymentProcessorAbi, paymentProcessorAddress } from './wallet/contracts';
import { formatCoins } from '../lib/utils';

interface GiftModalProps {
  stream: any;
  onClose: () => void;
}

export function GiftModal({ stream, onClose }: GiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingTransactionIds, setPendingTransactionIds] = useState<any[]>([]);
  const { address } = useAccount();

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirmingTransaction, isSuccess: isConfirmedTransaction } =
    useWaitForTransactionReceipt({
      hash,
    });

  const gifts = useQuery(api.gifts.getGifts);
  const user = useQuery(api.users.getCurrentUser);
  const sendGift = useMutation(api.transactions.sendGift);
  const updateTransactionStatuses = useMutation(api.transactions.updateTransactionStatuses);

  // when isConfirmedTransaction becomes true, we update the transaction statuses in the db
  useEffect(() => {
    if (isConfirmedTransaction && hash && pendingTransactionIds.length > 0) {
      updateTransactionStatuses({
        transactionIds: pendingTransactionIds,
        status: 'completed',
        txHash: hash,
      })
        .then(() => {
          toast.success('Gift sent successfully!');
          setIsSending(false);
          setPendingTransactionIds([]);
          onClose();
        })
        .catch((error) => {
          console.error('Failed to update transaction status:', error);
          toast.error('Transaction confirmed but failed to update status');
          setIsSending(false);
        });
    }
  }, [isConfirmedTransaction, hash, pendingTransactionIds, updateTransactionStatuses, onClose]);

  useEffect(() => {
    if (error) {
      toast.error(`Transaction failed, please try again.`);
      setIsSending(false);
    }
  }, [error]);

  const handleSendGift = async () => {
    if (!selectedGift || !user) return;

    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendGift({
        receiverId: stream.streamer._id,
        livestreamId: stream._id,
        giftId: selectedGift._id,
      });

      // Store the transaction IDs for later status update
      setPendingTransactionIds(result.transactionIds);

      writeContract({
        address: paymentProcessorAddress,
        abi: paymentProcessorAbi,
        functionName: 'pay',
        args: [stream.streamer.walletAddress ?? '', selectedGift.price],
      });

      toast.success('Confirm the gift in your wallet!');
    } catch (error) {
      toast.error('Failed to send gift');
      console.error(error);
      setIsSending(false);
    }
  };

  if (!gifts || !user) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>Send a Gift</h2>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-2xl'>
              ×
            </button>
          </div>
          <div className='mb-6'>
            <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
              <div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold'>
                {stream.streamer?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <p className='font-medium text-gray-900'>{stream.streamer?.name}</p>
                <p className='text-sm text-gray-500'>{stream.title}</p>
              </div>
            </div>
          </div>

          <div className='mb-6'>
            <h3 className='font-medium text-gray-900 mb-3'>Choose a Gift</h3>
            <div className='grid grid-cols-2 gap-3'>
              {gifts.map((gift) => (
                <button
                  key={gift._id}
                  onClick={() =>
                    address ? setSelectedGift(gift) : toast.error('Please connect your wallet')
                  }
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedGift?._id === gift._id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${address ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <div className='text-2xl mb-2'>{gift.emoji}</div>
                  <div className='font-medium text-gray-900'>{gift.name}</div>
                  <div className='text-sm text-gray-500'>{formatCoins(gift.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedGift && (
            <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
              <div className='flex justify-between items-center'>
                <span className='text-blue-900'>Total Amount:</span>
                <span className='font-semibold text-blue-900'>
                  {formatCoins(selectedGift.price)}
                </span>
              </div>
            </div>
          )}
          {!address && (
            <div className='mb-6 p-4 bg-red-50 rounded-lg'>
              <div className='flex justify-center items-center'>
                <span className='text-xl pr-2 pb-2'>⚠️</span>
                <span className='font-semibold pr-2 text-red-900'>
                  Please connect your wallet first.
                </span>
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
              onClick={() => void handleSendGift()}
              disabled={!selectedGift || isSending || isPending || !address}
              className='flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              {isSending || isPending || isConfirmingTransaction ? 'Sending...' : 'Send Gift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
