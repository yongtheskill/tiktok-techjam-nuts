'use node';

import { action } from './_generated/server';
import { v } from 'convex/values';
import { ethers } from 'ethers';
import { api, internal } from './_generated/api';
import { Id } from './_generated/dataModel';

const adminId = 'k570ypp1b5tyrf1py60ggkb43n7pjfe5' as Id<'users'>;

// ERC-20 ABI for minting and burning functions
const COIN_ABI = [
  {
    inputs: [
      {
        name: 'to',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'from',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const COIN_ADDRESS = '0xCc87B20c0D8BA095F32dBb29464784e3e2de642E';

/**
 * Mint ERC-20 tokens to a specified wallet address
 */
export const buyTokens = action({
  args: {
    userId: v.id('users'),
    address: v.string(),
    amount: v.int64(),
  },
  returns: v.object({
    success: v.boolean(),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify that the userId matches the provided address
      const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
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

      if (user.walletAddress.toLowerCase() !== args.address.toLowerCase()) {
        return {
          success: false,
          error: 'Provided address does not match user wallet address',
        };
      }

      // Get RPC URL from environment variables
      const rpcUrl = process.env.RPC_URL;
      if (!rpcUrl) {
        return {
          success: false,
          error: 'RPC_URL environment variable not set',
        };
      }

      // Get private key from environment variables
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        return {
          success: false,
          error: 'PRIVATE_KEY environment variable not set',
        };
      }

      // Validate wallet address
      if (!ethers.isAddress(args.address)) {
        return {
          success: false,
          error: 'Invalid wallet address format',
        };
      }

      // Validate amount
      if (args.amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0',
        };
      }

      // Connect to the blockchain
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create contract instance
      const contract = new ethers.Contract(COIN_ADDRESS, COIN_ABI, wallet);

      // Call the mint function
      const tx = await contract.mint(args.address, args.amount);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Create a transaction record for the user receiving tokens from admin
      await ctx.runMutation(internal.transactions.createTransaction, {
        owner: args.userId,
        senderId: adminId,
        receiverId: args.userId,
        amount: args.amount,
        txHash: receipt.hash,
        status: 'completed',
        type: 'top-up',
        createdAt: Date.now(),
      });

      // Update user balance
      await ctx.runMutation(internal.users.updateUserBalance, {
        userId: args.userId,
        amount: args.amount,
      });

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

/**
 * Burn ERC-20 tokens from a specified wallet address
 */
export const sellTokens = action({
  args: {
    userId: v.id('users'),
    address: v.string(),
    amount: v.int64(),
  },
  returns: v.object({
    success: v.boolean(),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify that the userId matches the provided address
      const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
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

      if (user.walletAddress.toLowerCase() !== args.address.toLowerCase()) {
        return {
          success: false,
          error: 'Provided address does not match user wallet address',
        };
      }

      // Get RPC URL from environment variables
      const rpcUrl = process.env.RPC_URL;
      if (!rpcUrl) {
        return {
          success: false,
          error: 'RPC_URL environment variable not set',
        };
      }

      // Get private key from environment variables
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        return {
          success: false,
          error: 'PRIVATE_KEY environment variable not set',
        };
      }

      // Validate wallet address
      if (!ethers.isAddress(args.address)) {
        return {
          success: false,
          error: 'Invalid wallet address format',
        };
      }

      // Validate amount
      if (args.amount <= 0) {
        return {
          success: false,
          error: 'Amount must be greater than 0',
        };
      }

      // Connect to the blockchain
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create contract instance
      const contract = new ethers.Contract(COIN_ADDRESS, COIN_ABI, wallet);

      // Call the burn function
      const tx = await contract.burn(args.address, args.amount);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Create a transaction record for the user sending tokens to admin
      await ctx.runMutation(internal.transactions.createTransaction, {
        owner: args.userId,
        senderId: args.userId,
        receiverId: adminId,
        amount: args.amount,
        txHash: receipt.hash,
        status: 'completed',
        type: 'cash-out',
        createdAt: Date.now(),
      });

      // Update user balance
      await ctx.runMutation(internal.users.updateUserBalance, {
        userId: args.userId,
        amount: -args.amount,
      });

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error burning tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
