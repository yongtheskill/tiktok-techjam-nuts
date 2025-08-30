'use node';

import { action } from './_generated/server';
import { v } from 'convex/values';
import { ethers } from 'ethers';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

const DEFAULT_FEE_RATIO = 10000; // 10% fee

const SESSION_MANAGER_ABI = [
  {
    inputs: [
      {
        name: 'user',
        type: 'address',
      },
    ],
    name: 'endSession',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'user',
        type: 'address',
      },
      {
        name: 'feeRatio',
        type: 'uint32',
      },
    ],
    name: 'startSession',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const SESSION_MANAGER_ADDRESS = '0x54D5bEe09bEF951026cB86C4DB6fEcc917488001';

/**
 * Start a livestream with smart contract integration
 */
export const startLivestream = action({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    livestreamId: v.optional(v.id('livestreams')),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get user information
      const user = await ctx.runQuery(api.users.getCurrentUser, {});
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.walletAddress) {
        return {
          success: false,
          error: 'User has no wallet address connected',
        };
      }

      if (!user.isStreamer) {
        return {
          success: false,
          error: 'User is not a streamer',
        };
      }

      // Get environment variables
      const rpcUrl = process.env.RPC_URL;
      if (!rpcUrl) {
        return {
          success: false,
          error: 'RPC_URL environment variable not set',
        };
      }

      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        return {
          success: false,
          error: 'PRIVATE_KEY environment variable not set',
        };
      }

      // Validate wallet address
      if (!ethers.isAddress(user.walletAddress)) {
        return {
          success: false,
          error: 'Invalid wallet address format',
        };
      }

      // Connect to the blockchain
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create contract instance
      const contract = new ethers.Contract(SESSION_MANAGER_ADDRESS, SESSION_MANAGER_ABI, wallet);

      // Call the startSession function
      const tx: any = await contract.startSession(user.walletAddress, DEFAULT_FEE_RATIO);

      // Wait for transaction confirmation
      const receipt: any = await tx.wait();

      // If smart contract call succeeds, create the livestream in the database
      const livestreamId: Id<'livestreams'> = await ctx.runMutation(
        internal.livestreams.startDbLivestream,
        {
          title: args.title,
          description: args.description,
        }
      );

      return {
        success: true,
        livestreamId,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error starting livestream');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * End a livestream with smart contract integration
 */
export const endLivestream = action({
  args: {
    livestreamId: v.id('livestreams'),
  },
  returns: v.object({
    success: v.boolean(),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get user information
      const user = await ctx.runQuery(api.users.getCurrentUser, {});
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.walletAddress) {
        return {
          success: false,
          error: 'User has no wallet address connected',
        };
      }

      // Check if the livestream exists and belongs to the current user
      const livestream = await ctx.runQuery(api.livestreams.getLivestreamById, {
        livestreamId: args.livestreamId,
      });

      if (!livestream) {
        return {
          success: false,
          error: 'Livestream not found',
        };
      }

      if (livestream.streamerId !== user._id) {
        return {
          success: false,
          error: 'You can only end your own livestream',
        };
      }

      try {
        // Get environment variables
        const rpcUrl = process.env.RPC_URL;
        if (!rpcUrl) {
          return {
            success: false,
            error: 'RPC_URL environment variable not set',
          };
        }

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
          return {
            success: false,
            error: 'PRIVATE_KEY environment variable not set',
          };
        }

        // Validate wallet address
        if (!ethers.isAddress(user.walletAddress)) {
          return {
            success: false,
            error: 'Invalid wallet address format',
          };
        }

        // Connect to the blockchain
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Create contract instance
        const contract = new ethers.Contract(SESSION_MANAGER_ADDRESS, SESSION_MANAGER_ABI, wallet);

        // Call the endSession function
        const tx: any = await contract.endSession(user.walletAddress);

        // Wait for transaction confirmation
        const receipt: any = await tx.wait();

        return {
          success: true,
          txHash: receipt.hash,
        };
      } catch (e) {
        console.log('Blockchain livestream end error', e);
        return {
          success: false,
          error: 'Blockchain transaction failed',
        };
      } finally {
        // end the stream in the database anyway
        await ctx.runMutation(internal.livestreams.endDbLivestream, {
          livestreamId: args.livestreamId,
        });
      }
    } catch (error) {
      console.error('Error ending livestream:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
