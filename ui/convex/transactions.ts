import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

const adminId = 'k5774ebjkaafqendyy4pstr1ys7pj6ga' as Id<'users'>;

export const sendGift = mutation({
  args: {
    receiverId: v.id('users'),
    livestreamId: v.id('livestreams'),
    giftId: v.id('gifts'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found!');

    const receiver = await ctx.db.get(args.receiverId);
    if (!receiver) throw new Error('Receiver not found');

    const gift = await ctx.db.get(args.giftId);
    if (!gift) throw new Error('Gift not found');

    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream || !livestream.isActive) {
      throw new Error('Livestream not found or not active');
    }

    // Create transaction
    const sendTransactionId = await ctx.db.insert('transactions', {
      owner: user._id,
      senderId: user._id,
      receiverId: args.receiverId,
      livestreamId: args.livestreamId,
      giftId: args.giftId,
      amount: gift.price,
      status: 'pending',
      type: 'gift-give',
      createdAt: Date.now(),
    });

    const receivedAmount = BigInt(Number(gift.price) * (1 - livestream.feeRatio / 100000)); // Apply fee ratio
    const receiveTransactionId = await ctx.db.insert('transactions', {
      owner: args.receiverId,
      senderId: user._id,
      receiverId: args.receiverId,
      livestreamId: args.livestreamId,
      giftId: args.giftId,
      amount: receivedAmount,
      status: 'pending',
      type: 'gift-receive',
      createdAt: Date.now(),
    });

    const feeAmount = BigInt(Number(gift.price) * (livestream.feeRatio / 100000));
    const feeTransactionId = await ctx.db.insert('transactions', {
      owner: adminId,
      senderId: user._id,
      receiverId: adminId,
      livestreamId: args.livestreamId,
      giftId: args.giftId,
      amount: feeAmount,
      status: 'pending',
      type: 'fee',
      createdAt: Date.now(),
    });

    // Update user balances
    await ctx.runMutation(internal.users.updateUserBalance, {
      userId: user._id,
      amount: -gift.price,
    });
    await ctx.runMutation(internal.users.updateUserBalance, {
      userId: args.receiverId,
      amount: receivedAmount,
    });
    await ctx.runMutation(internal.users.updateUserBalance, {
      userId: adminId,
      amount: feeAmount,
    });

    // Update livestream gift count
    await ctx.db.patch(args.livestreamId, {
      totalGifts: livestream.totalGifts + 1,
    });

    return {
      transactionIds: [sendTransactionId, receiveTransactionId, feeTransactionId],
      amount: gift.price,
    };
  },
});

export const updateTransactionStatuses = mutation({
  args: {
    transactionIds: v.array(v.id('transactions')),
    status: v.union(v.literal('completed'), v.literal('failed')),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const transactions = await Promise.all(
      args.transactionIds.map(async (id) => {
        const tx = await ctx.db.get(id);
        if (!tx) throw new Error('Transaction not found');
        if (tx.senderId !== userId) throw new Error('Not authorized');
        return tx;
      })
    );

    await Promise.all(
      transactions.map((transaction) =>
        ctx.db.patch(transaction._id, {
          status: args.status,
        })
      )
    );

    return { success: true };
  },
});

export const getTransactionHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || !user.email) throw new Error('User not found');

    const transactions = user.isAdmin
      ? await ctx.db.query('transactions').withIndex('by_created_at').order('desc').take(100)
      : await ctx.db
          .query('transactions')
          .withIndex('by_owner_created', (q) => q.eq('owner', user._id))
          .order('desc')
          .take(100);

    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        const senderName =
          transaction.senderId == undefined ? null : (await ctx.db.get(transaction.senderId))?.name;
        const receiverName =
          transaction.receiverId == undefined
            ? null
            : (await ctx.db.get(transaction.receiverId))?.name;
        const gift = transaction.giftId == undefined ? null : await ctx.db.get(transaction.giftId);
        const livestreamTitle =
          transaction.livestreamId == undefined
            ? null
            : (await ctx.db.get(transaction.livestreamId))?.title;

        return {
          ...transaction,
          senderName,
          receiverName,
          gift,
          livestreamTitle,
        };
      })
    );

    return transactionsWithDetails;
  },
});

export const createTransaction = internalMutation({
  args: {
    owner: v.id('users'),
    senderId: v.optional(v.id('users')),
    receiverId: v.optional(v.id('users')),
    livestreamId: v.optional(v.id('livestreams')),
    giftId: v.optional(v.id('gifts')),
    amount: v.int64(),
    txHash: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
    type: v.union(
      v.literal('gift-give'),
      v.literal('gift-receive'),
      v.literal('fee'),
      v.literal('top-up'),
      v.literal('cash-out')
    ),
    createdAt: v.number(),
  },
  returns: v.id('transactions'),
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert('transactions', {
      owner: args.owner,
      senderId: args.senderId,
      receiverId: args.receiverId,
      livestreamId: args.livestreamId,
      giftId: args.giftId,
      amount: args.amount,
      txHash: args.txHash,
      status: args.status,
      type: args.type,
      createdAt: args.createdAt,
    });

    return transactionId;
  },
});

export const getGiftReceivedTransactions = query({
  args: {
    livestreamId: v.optional(v.id('livestreams')),
  },
  returns: v.array(
    v.object({
      _id: v.id('transactions'),
      _creationTime: v.number(),
      owner: v.id('users'),
      senderId: v.optional(v.id('users')),
      receiverId: v.optional(v.id('users')),
      livestreamId: v.optional(v.id('livestreams')),
      giftId: v.optional(v.id('gifts')),
      amount: v.int64(),
      txHash: v.optional(v.string()),
      status: v.union(v.literal('pending'), v.literal('completed'), v.literal('failed')),
      type: v.union(
        v.literal('gift-give'),
        v.literal('gift-receive'),
        v.literal('fee'),
        v.literal('top-up'),
        v.literal('cash-out')
      ),
      createdAt: v.number(),
      gift: v.union(
        v.object({
          _id: v.id('gifts'),
          _creationTime: v.number(),
          name: v.string(),
          price: v.int64(),
          emoji: v.string(),
          description: v.string(),
        }),
        v.null()
      ),
      senderName: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx, args) => {
    if (!args.livestreamId) {
      return [];
    }
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_livestream', (q) => q.eq('livestreamId', args.livestreamId))
      .filter((q) => q.eq(q.field('type'), 'gift-receive'))
      .order('desc')
      .collect();

    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        const gift = transaction.giftId ? await ctx.db.get(transaction.giftId) : null;
        const sender = transaction.senderId ? await ctx.db.get(transaction.senderId) : null;
        const senderName = sender?.name || null;

        return {
          ...transaction,
          gift,
          senderName,
        };
      })
    );

    return transactionsWithDetails;
  },
});

export const cleanupPendingTransactions = internalMutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 10 * 60 * 1000; // 10 minutes in milliseconds

    // Find all pending transactions older than 5 minutes
    const pendingTransactions = await ctx.db
      .query('transactions')
      .withIndex('by_created_at')
      .filter((q) =>
        q.and(q.eq(q.field('status'), 'pending'), q.lt(q.field('createdAt'), fiveMinutesAgo))
      )
      .collect();

    // Delete the transactions
    await Promise.all(pendingTransactions.map((transaction) => ctx.db.delete(transaction._id)));

    return {
      deletedCount: pendingTransactions.length,
    };
  },
});
