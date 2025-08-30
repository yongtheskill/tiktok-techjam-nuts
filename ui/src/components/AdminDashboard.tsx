import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { formatCoins } from '../lib/utils';
import { useState } from 'react';
import { AnalysisWindow } from './ui/AnalysisWindow';

export function AdminDashboard() {
  const users = useQuery(api.users.getAllUsers);
  const livestreams = useQuery(api.livestreams.getAllLivestreams);
  const transactions = useQuery(api.transactions.getTransactionHistory);
  const createAnalysisSession = useMutation(api.analysis.createAnalysisSession);

  const [analysisOpen, setAnalysisOpen] = useState(false);

  if (users === undefined || livestreams === undefined || transactions === undefined) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  const activeStreams = livestreams.filter((stream) => stream.isActive);
  const completedTransactions = transactions.filter((tx) => tx.status === 'completed');

  const openAnalysisSession = async () => {
    const session = await createAnalysisSession();
    window.localStorage.setItem('analysisSessionToken', session.token);
    setAnalysisOpen(true);
  };

  return (
    <div>
      <div className='flex justify-start items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='text-2xl font-bold text-blue-600'>{users.length}</div>
          <div className='text-sm text-blue-600'>Total Users</div>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='text-2xl font-bold text-green-600'>{activeStreams.length}</div>
          <div className='text-sm text-green-600'>Active Streams</div>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='text-2xl font-bold text-purple-600'>{completedTransactions.length}</div>
          <div className='text-sm text-purple-600'>Completed Transactions</div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Users Table */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>Users ({users.length})</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Wallet
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.slice(0, 10).map((user) => (
                  <tr key={user._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold'>
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>{user.name}</div>
                          <div className='text-sm text-gray-500'>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isStreamer
                            ? 'bg-purple-100 text-purple-800'
                            : user.isAdmin
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                        {user.isStreamer ? 'Streamer' : user.isAdmin ? 'Admin' : 'Viewer'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {user.walletAddress ? (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          Connected
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                          Not Connected
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center space-x-3'>
                        <div className='text-sm font-medium text-gray-900'>
                          {formatCoins(user.balance ?? 0)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-gray-900'>Recent Transactions</h2>
              <button
                className='ml-4 px-3 py-1 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition'
                type='button'
                onClick={() => {
                  openAnalysisSession().catch(() => {});
                }}>
                Analyse
              </button>
            </div>
          </div>
          <div className='overflow-x-auto'>
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
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {(transaction.type == 'gift-give' || transaction.type == 'gift-receive') && (
                        <div>
                          <div className='text-sm font-bold'>
                            Gift {transaction.type == 'gift-receive' ? '🤑' : '💸'}
                          </div>
                          <div className='flex items-center space-x-2'>
                            <span className='text-lg'>{transaction.gift?.emoji}</span>
                            <span className='text-sm font-medium text-gray-900'>
                              {transaction.gift?.name}
                            </span>
                          </div>
                        </div>
                      )}
                      {transaction.type == 'fee' && (
                        <div>
                          <div className='text-sm font-bold'>Fee 🧾</div>
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
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {analysisOpen && <AnalysisWindow onClose={() => setAnalysisOpen(false)} />}
    </div>
  );
}
