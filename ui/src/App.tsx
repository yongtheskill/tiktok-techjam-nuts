import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SignInForm } from './SignInForm';
import { SignOutButton } from './SignOutButton';
import { Toaster } from 'sonner';
import { Dashboard } from './components/Dashboard';
import { UserSetup } from './components/UserSetup';
import { ConnectWalletButton } from './components/ConnectWalletButton';

export default function App() {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4'>
        <h2 className='text-xl font-semibold text-primary'>TTCoin</h2>
        <Authenticated>
          <div className='flex gap-5'>
            <ConnectWalletButton />
            <SignOutButton />
          </div>
        </Authenticated>
      </header>
      <main className='flex-1'>
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <Authenticated>{!user?.name ? <UserSetup /> : <Dashboard />}</Authenticated>
      <Unauthenticated>
        <div className='flex items-center justify-center min-h-[400px] p-8'>
          <div className='w-full max-w-md mx-auto'>
            <div className='text-center mb-8'>
              <h1 className='text-4xl font-bold text-primary mb-4'>TTCoin</h1>
              <p className='text-xl text-secondary'>Stream, gift, and earn with crypto</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
