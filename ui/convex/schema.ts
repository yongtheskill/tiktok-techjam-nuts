import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

const applicationTables = {
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    balance: v.optional(v.int64()),
    isStreamer: v.boolean(),
    isAdmin: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_wallet', ['walletAddress']),

  livestreams: defineTable({
    streamerId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    viewerCount: v.number(),
    totalGifts: v.number(),
    startedAt: v.number(),
    feeRatio: v.number(), // Share * 100,000 e.g., 1000 for 1% fee
    endedAt: v.optional(v.number()),
  })
    .index('by_streamer', ['streamerId'])
    .index('by_active', ['isActive'])
    .index('by_started_at', ['startedAt']),

  gifts: defineTable({
    name: v.string(),
    price: v.int64(),
    emoji: v.string(),
    description: v.string(),
  }),

  transactions: defineTable({
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
  })
    .index('by_sender', ['senderId'])
    .index('by_receiver', ['receiverId'])
    .index('by_livestream', ['livestreamId'])
    .index('by_created_at', ['createdAt'])
    .index('by_owner_created', ['owner', 'createdAt']),

  viewers: defineTable({
    userId: v.id('users'),
    livestreamId: v.id('livestreams'),
    joinedAt: v.number(),
  })
    .index('by_livestream', ['livestreamId'])
    .index('by_user', ['userId']),

  analysisSessions: defineTable({
    owner: v.id('users'),
    token: v.string(),
    expires: v.number(),
  }).index('by_owner', ['owner']),
};

export default defineSchema(
  {
    ...authTables,
    ...applicationTables,
  },
  { schemaValidation: true }
);
