import { useState, useEffect } from '@lynx-js/react';
import type { AnalysisData, RawTransaction } from '../types/index.js';
import { transformApiResponse } from '../utils/dataTransform.js';

// Mock data for demonstration
const mockRawData: RawTransaction[] = [
  {
    _creationTime: 1756516277603.6995,
    _id: 'k170zcty8vmtt2an7yt9b8d6nd7pmwyq',
    amount: '50000000',
    createdAt: 1756516277603,
    giftId: 'kd7cf5w0y4vkarg9yr0xd5dqb97pkehf',
    livestreamId: 'jx7b0pjsgr71tyfst7rezh67rx7pm9gz',
    owner: 'k5774ebjkaafqendyy4pstr1ys7pj6ga',
    receiverId: 'k5774ebjkaafqendyy4pstr1ys7pj6ga',
    senderId: 'k5773tawpex42z7p6wrr1sqbfx7pkbc4',
    status: 'completed',
    type: 'fee',
  },
  {
    _creationTime: 1756516277603.6992,
    _id: 'k17eg3t85t1tfg3k34rk0k7gdd7pn2h5',
    amount: '450000000',
    createdAt: 1756516277603,
    giftId: 'kd7cf5w0y4vkarg9yr0xd5dqb97pkehf',
    livestreamId: 'jx7b0pjsgr71tyfst7rezh67rx7pm9gz',
    owner: 'k575mjt0ebxy1fd7p6dpcep3kx7pk0rz',
    receiverId: 'k575mjt0ebxy1fd7p6dpcep3kx7pk0rz',
    senderId: 'k5773tawpex42z7p6wrr1sqbfx7pkbc4',
    status: 'completed',
    type: 'gift-receive',
  },
  {
    _creationTime: 1756516277603.699,
    _id: 'k17933xhthbjn4qts51ysq3k817pnp56',
    amount: '500000000',
    createdAt: 1756516277603,
    giftId: 'kd7cf5w0y4vkarg9yr0xd5dqb97pkehf',
    livestreamId: 'jx7b0pjsgr71tyfst7rezh67rx7pm9gz',
    owner: 'k5773tawpex42z7p6wrr1sqbfx7pkbc4',
    receiverId: 'k575mjt0ebxy1fd7p6dpcep3kx7pk0rz',
    senderId: 'k5773tawpex42z7p6wrr1sqbfx7pkbc4',
    status: 'completed',
    type: 'gift-give',
  },
  {
    _creationTime: 1756516268143.4927,
    _id: 'k17cpztqrdz8xc5pk2a2zgnfxs7pmbse',
    amount: '800000000',
    createdAt: 1756516268134,
    owner: 'k5773tawpex42z7p6wrr1sqbfx7pkbc4',
    receiverId: 'k5773tawpex42z7p6wrr1sqbfx7pkbc4',
    senderId: 'k570ypp1b5tyrf1py60ggkb43n7pjfe5',
    status: 'completed',
    txHash:
      '0x2c713592219d4afdc98b1d44e2cada14f9a54fab02c00ab6eff057c501f5b6b3',
    type: 'top-up',
  },
];

export const useAnalysisData = (token: string) => {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    fetch('https://hushed-reindeer-478.convex.cloud/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'analysis:getTransactionsByToken',
        args: { token },
        format: 'json',
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        // Check if we have valid data
        if (result.value && Array.isArray(result.value)) {
          const transformedData = transformApiResponse(result.value);
          setData(transformedData);
        } else {
          // Fall back to mock data
          const mockTransformedData = transformApiResponse(mockRawData);
          setData(mockTransformedData);
        }
      })
      .catch((err) => {
        console.warn('API failed, using mock data:', err);
        // Use mock data if API fails
        const mockTransformedData = transformApiResponse(mockRawData);
        setData(mockTransformedData);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return { data, loading, error };
};
