import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

export function UserSetup() {
  const [name, setName] = useState('');
  const [isStreamer, setIsStreamer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const createProfile = useMutation(api.users.createUserProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      await createProfile({ name: name.trim(), isStreamer });
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-[400px] p-8'>
      <div className='w-full max-w-md mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-primary mb-4'>Welcome to TTCoin!</h1>
          <p className='text-secondary'>Let's set up your profile</p>
        </div>

        <form
          onSubmit={(e) => {
            handleSubmit(e).catch(() => {});
          }}
          className='space-y-6'>
          <div>
            <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
              Your Name
            </label>
            <input
              type='text'
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-sm hover:shadow'
              placeholder='Enter your name'
              required
            />
          </div>

          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              id='isStreamer'
              checked={isStreamer}
              onChange={(e) => setIsStreamer(e.target.checked)}
              className='w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2'
            />
            <label htmlFor='isStreamer' className='text-sm font-medium text-gray-700'>
              I want to be a streamer
            </label>
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full px-4 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed'>
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
