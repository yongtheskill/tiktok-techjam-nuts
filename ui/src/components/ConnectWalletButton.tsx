import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { useAccount, useConnect } from 'wagmi';
import { useEffect } from 'react';

export const ConnectWalletButton = () => {
  const { address } = useAccount();
  const { connectors, connect } = useConnect();
  const connectWallet = useMutation(api.users.connectWallet);

  useEffect(() => {
    if (address) {
      connectWallet({ walletAddress: address })
        .then(() => {
          toast.success('Wallet connected successfully!');
        })
        .catch((error) => {
          toast.error('Failed to connect wallet');
          console.error(error);
        });
    }
  }, [address, connectWallet]);

  if (address) {
    return <></>;
  }
  return (
    <div className='flex gap-2'>
      {connectors.map((connector) => (
        <button
          className='px-4 py-2 rounded bg-green-500 text-white border border-gray-200 font-semibold hover:bg-green-400 transition-colors shadow-sm hover:shadow'
          key={connector.uid}
          onClick={() =>
            connect(
              { connector },
              {
                onError: (error) => {
                  toast.error('Failed to connect wallet');
                  console.error(error);
                },
                onSettled: () => {
                  console.log('Connection attempt finished');
                },
                onSuccess: (data) => {
                  console.log('Connected to wallet:', data.accounts[0]);
                },
              }
            )
          }>
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
};
