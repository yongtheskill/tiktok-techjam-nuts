import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const authUser = await ctx.db.get(userId);
    if (!authUser) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', authUser.email))
      .unique();

    return user;
  },
});

export const createUserProfile = mutation({
  args: {
    name: v.string(),
    isStreamer: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const authUser = await ctx.db.get(userId);
    if (!authUser || !authUser.email) throw new Error('User not found');

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', authUser.email))
      .unique();

    if (existingUser) {
      // Update existing user with new fields
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        isStreamer: args.isStreamer,
      });
      return existingUser._id;
    }

    throw new Error('User profile already exists');
  },
});

export const connectWallet = mutation({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const authUser = await ctx.db.get(userId);
    if (!authUser || !authUser.email) throw new Error('User not found');

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', authUser.email))
      .unique();

    if (!user) throw new Error('User profile not found');

    // Only set wallet address if it's not already set
    if (!user.walletAddress) {
      await ctx.db.patch(user._id, {
        walletAddress: args.walletAddress,
      });
    }

    return { success: true };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

export const getUserById = query({
  args: { userId: v.id('users') },
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      walletAddress: v.optional(v.string()),
      balance: v.optional(v.int64()),
      isStreamer: v.boolean(),
      isAdmin: v.boolean(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUserBalance = internalMutation({
  args: {
    userId: v.id('users'),
    amount: v.int64(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    await ctx.db.patch(user._id, {
      balance: (user.balance || 0n) + args.amount,
    });

    return { success: true };
  },
});
