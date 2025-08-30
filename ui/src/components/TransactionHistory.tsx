import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { formatCoins } from '../lib/utils';

export function TransactionHistory() {
  const transactions = useQuery(api.transactions.getTransactionHistory);
  const currentUser = useQuery(api.auth.loggedInUser);

  if (transactions === undefined || currentUser === undefined) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Transaction History</h1>
        <div className='text-sm text-gray-500'>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>📊</div>
          <h3 className='text-xl font-semibold text-gray-900 mb-2'>No transactions yet</h3>
          <p className='text-gray-500'>Your transaction history will appear here</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Item
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    From/To
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Stream
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
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {(transaction.type == 'gift-give' || transaction.type == 'gift-receive') && (
                        <div>
                          <div className='text-sm font-bold'>
                            {transaction.type == 'gift-receive' ? 'Received Gift' : 'Sent Gift'}
                          </div>
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
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.senderId === currentUser?._id
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        {transaction.senderId === currentUser?._id ? 'Sent' : 'Received'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {formatCoins(transaction.amount)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {transaction.senderId === currentUser?._id
                        ? transaction.receiverName || 'Unknown'
                        : transaction.senderName || 'Unknown'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {transaction.livestreamTitle || 'Unknown Stream'}
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
                      {new Date(transaction.createdAt).toLocaleDateString() +
                        ' ' +
                        new Date(transaction.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
