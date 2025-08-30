import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LivestreamList } from './LivestreamList';
import { StreamerDashboard } from './StreamerDashboard';
import { AdminDashboard } from './AdminDashboard';
import { WalletConnection } from './WalletConnection';
import { TransactionHistory } from './TransactionHistory';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('browse');
  const user = useQuery(api.users.getCurrentUser);

  if (!user) return null;

  const tabs = [
    { id: 'browse', label: 'Browse Streams', icon: '📺' },
    ...(user.isStreamer && !user.isAdmin ? [{ id: 'stream', label: 'My Stream', icon: '🎥' }] : []),
    { id: 'wallet', label: 'Wallet', icon: '💳' },
    ...(!user.isAdmin ? [{ id: 'transactions', label: 'Transactions', icon: '📊' }] : []),
    ...(user.isAdmin ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <div className='flex'>
      {/* Sidebar */}
      <div className='w-64 bg-white border-r border-gray-200 min-h-screen'>
        <div className='p-6'>
          <div className='flex items-center space-x-3 mb-6'>
            <div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold'>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className='font-semibold text-gray-900'>{user.name}</p>
              <p className='text-sm text-gray-500'>
                {user.isStreamer ? 'Streamer' : user.isAdmin ? 'Admin' : 'Viewer'}
              </p>
            </div>
          </div>

          <nav className='space-y-2'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 p-8'>
        {activeTab === 'browse' && <LivestreamList />}
        {activeTab === 'stream' && user.isStreamer && <StreamerDashboard />}
        {activeTab === 'wallet' && <WalletConnection />}
        {activeTab === 'transactions' && <TransactionHistory />}
        {activeTab === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}
