import { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { formatCoins } from '../lib/utils';
import { TimeCounter } from './ui/TimeCounter';

export function StreamerDashboard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const user = useQuery(api.users.getCurrentUser);
  const livestreams = useQuery(api.livestreams.getActiveLivestreams);
  const startLivestream = useAction(api.livestreamBlockchain.startLivestream);
  const endLivestream = useAction(api.livestreamBlockchain.endLivestream);
  const myActiveStream = livestreams?.find((stream) => stream.streamer?.email === user?.email);
  const transactions = useQuery(api.transactions.getGiftReceivedTransactions, {
    livestreamId: myActiveStream?._id,
  });

  const handleStartStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    setIsStarting(true);
    toast.info('Starting livestream...');
    try {
      const res = await startLivestream({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      if (res.error) {
        throw new Error('server error');
      }
      toast.success('Livestream started!');
      setTitle('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to start livestream');
      console.error(error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (!myActiveStream) return;

    setIsEnding(true);
    toast.info('Ending livestream...');
    try {
      await endLivestream({ livestreamId: myActiveStream._id });
      toast.success('Livestream ended!');
    } catch (error) {
      toast.error('Failed to end livestream');
      console.error(error);
    } finally {
      setIsEnding(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Streamer Dashboard</h1>
      </div>

      {myActiveStream ? (
        <div>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center space-x-3'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                  <span className='text-red-500 font-semibold'>LIVE</span>
                </div>
                <h2 className='text-xl font-semibold text-gray-900'>{myActiveStream.title}</h2>
              </div>
              <button
                onClick={() => {
                  handleEndStream().catch(() => {});
                }}
                disabled={isEnding}
                className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                {isEnding ? 'Ending...' : 'End Stream'}
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <div className='bg-blue-50 rounded-lg p-4'>
                <div className='text-sm text-blue-600'>Current Viewers</div>
                <div className='text-2xl font-bold text-blue-600'>{myActiveStream.viewerCount}</div>
              </div>
              <div className='bg-yellow-50 rounded-lg p-4'>
                <div className='text-sm text-yellow-600'>Total Gifts</div>
                <div className='text-2xl font-bold text-yellow-600'>
                  {myActiveStream.totalGifts}
                </div>
              </div>
              <div className='bg-green-50 rounded-lg p-4'>
                <div className='text-sm text-green-600'>Duration</div>
                <TimeCounter
                  timestamp={myActiveStream.startedAt}
                  className='text-2xl font-bold text-green-600'
                />
              </div>
            </div>

            {myActiveStream.description && (
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-medium text-gray-900 mb-2'>Description</h3>
                <p className='text-gray-600'>{myActiveStream.description}</p>
              </div>
            )}
          </div>

          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>Gifts</h2>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Item
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    From
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {transactions &&
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {transaction.type == 'gift-receive' && (
                          <div>
                            <div className='text-sm font-bold'>Received Gift</div>
                            <div className='flex items-center space-x-2'>
                              <span className='text-lg'>{transaction.gift?.emoji}</span>
                              <span className='text-sm font-medium text-gray-900'>
                                {transaction.gift?.name}
                              </span>
                            </div>
                          </div>
                        )}
                        {transaction.type == 'top-up' && (
                          <div>
                            <div className='flex items-center space-x-2'>
                              <span className='text-sm font-medium text-gray-900'>Top-Up 💰</span>
                            </div>
                          </div>
                        )}
                        {transaction.type == 'cash-out' && (
                          <div>
                            <div className='flex items-center space-x-2'>
                              <span className='text-sm font-medium text-gray-900'>Cash-Out 💸</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {formatCoins(transaction.amount)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {transaction.senderName || 'Unknown User'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>Start a New Livestream</h2>

          <form
            onSubmit={(e) => {
              handleStartStream(e).catch(() => {});
            }}
            className='space-y-4'>
            <div>
              <label htmlFor='title' className='block text-sm font-medium text-gray-700 mb-2'>
                Stream Title *
              </label>
              <input
                type='text'
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow'
                placeholder='Enter your stream title'
                required
              />
            </div>

            <div>
              <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-2'>
                Description (Optional)
              </label>
              <textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className='w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow'
                placeholder="Describe what you'll be streaming about..."
              />
            </div>

            <button
              type='submit'
              disabled={isStarting}
              className='w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium'>
              {isStarting ? 'Starting Stream...' : '🎥 Start Livestream'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
