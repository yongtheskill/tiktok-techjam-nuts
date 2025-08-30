import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

const DEFAULT_FEE_RATIO = 10000; // 10% Fee

export const getActiveLivestreams = query({
  args: {},
  handler: async (ctx) => {
    const streams = await ctx.db
      .query('livestreams')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    const streamsWithStreamers = await Promise.all(
      streams.map(async (stream) => {
        const streamer = await ctx.db.get(stream.streamerId);
        return {
          ...stream,
          streamer,
        };
      })
    );

    return streamsWithStreamers;
  },
});

export const getAllLivestreams = query({
  args: {},
  handler: async (ctx) => {
    const streams = await ctx.db.query('livestreams').collect();

    const streamsWithStreamers = await Promise.all(
      streams.map(async (stream) => {
        const streamer = await ctx.db.get(stream.streamerId);
        return {
          ...stream,
          streamer,
        };
      })
    );

    return streamsWithStreamers;
  },
});

export const getLivestreamById = query({
  args: {
    livestreamId: v.id('livestreams'),
  },
  returns: v.union(
    v.object({
      _id: v.id('livestreams'),
      _creationTime: v.number(),
      streamerId: v.id('users'),
      title: v.string(),
      description: v.optional(v.string()),
      isActive: v.boolean(),
      viewerCount: v.number(),
      totalGifts: v.number(),
      startedAt: v.number(),
      endedAt: v.optional(v.number()),
      feeRatio: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.livestreamId);
  },
});

export const startDbLivestream = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id('livestreams'),
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
    if (!user.isStreamer) throw new Error('User is not a streamer');

    // Check if user already has an active stream
    const existingStream = await ctx.db
      .query('livestreams')
      .withIndex('by_streamer', (q) => q.eq('streamerId', user._id))
      .filter((q) => q.eq(q.field('isActive'), true))
      .unique();

    if (existingStream) {
      throw new Error('You already have an active livestream');
    }

    return await ctx.db.insert('livestreams', {
      streamerId: user._id,
      title: args.title,
      description: args.description,
      isActive: true,
      viewerCount: 0,
      totalGifts: 0,
      startedAt: Date.now(),
      feeRatio: DEFAULT_FEE_RATIO,
    });
  },
});

export const endDbLivestream = internalMutation({
  args: {
    livestreamId: v.id('livestreams'),
  },
  returns: v.object({ success: v.boolean() }),
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

    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) throw new Error('Livestream not found');

    if (livestream.streamerId !== user._id) {
      throw new Error('You can only end your own livestream');
    }

    await ctx.db.patch(args.livestreamId, {
      isActive: false,
      endedAt: Date.now(),
    });

    return { success: true };
  },
});

export const joinLivestream = mutation({
  args: {
    livestreamId: v.id('livestreams'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || !user.email) throw new Error('User not found');

    // Check if livestream exists and is active
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) throw new Error('Livestream not found');
    if (!livestream.isActive) throw new Error('Livestream is not active');

    // Check if user is already viewing this stream
    const existingViewer = await ctx.db
      .query('viewers')
      .withIndex('by_livestream', (q) => q.eq('livestreamId', args.livestreamId))
      .filter((q) => q.eq(q.field('userId'), user._id))
      .unique();

    // If user is not already viewing, add them and increment viewer count
    if (!existingViewer) {
      await ctx.db.insert('viewers', {
        userId: user._id,
        livestreamId: args.livestreamId,
        joinedAt: Date.now(),
      });

      // Increment viewer count
      await ctx.db.patch(args.livestreamId, {
        viewerCount: livestream.viewerCount + 1,
      });
    }

    return null;
  },
});
