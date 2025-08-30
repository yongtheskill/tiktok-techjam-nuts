import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

/**
 * Create an analysis session for admin users.
 * Only admin users can create analysis sessions.
 * Sessions expire in 1 hour.
 */
export const createAnalysisSession = mutation({
  args: {},
  returns: v.object({
    sessionId: v.id('analysisSessions'),
    token: v.string(),
    expires: v.number(),
  }),
  handler: async (ctx) => {
    // Check if user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('User must be authenticated to create an analysis session');
    }

    // Get user and verify admin status
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isAdmin) {
      throw new Error('Only admin users can create analysis sessions');
    }

    // Generate a unique token for the session
    const token = crypto.randomUUID();

    // Set expiration to 1 hour from now
    const oneHourInMs = 60 * 60 * 1000;
    const expires = Date.now() + oneHourInMs;

    // Create the analysis session
    const sessionId = await ctx.db.insert('analysisSessions', {
      owner: userId,
      token,
      expires,
      connected: false,
    });

    return {
      sessionId,
      token,
      expires,
    };
  },
});

/**
 * Get the latest analysis session with connected=false.
 * Only admin users can access analysis sessions.
 */
export const getAnalysisSession = mutation({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('analysisSessions'),
      _creationTime: v.number(),
      owner: v.id('users'),
      token: v.string(),
      expires: v.number(),
      connected: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const currentTime = Date.now();

    // Delete all expired sessions
    const expiredSessions = await ctx.db
      .query('analysisSessions')
      .filter((q) => q.lt(q.field('expires'), currentTime))
      .collect();

    for (const expiredSession of expiredSessions) {
      await ctx.db.delete(expiredSession._id);
    }

    // Get the latest analysis session with connected=false
    const session = await ctx.db
      .query('analysisSessions')
      .filter((q) => q.eq(q.field('connected'), false))
      .order('desc')
      .first();

    if (session) {
      // Set the session as connected
      await ctx.db.patch(session._id, {
        connected: true,
      });

      // Return the updated session
      return {
        ...session,
        connected: true,
      };
    }

    return session;
  },
});

/**
 * Get the owner's name of an analysis session by token.
 * Returns the name of the user who owns the session with the given token.
 */
export const getAnalysisSessionOwner = query({
  args: {
    token: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Find the analysis session by token
    const session = await ctx.db
      .query('analysisSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expires < Date.now()) {
      return null;
    }

    // Get the owner user
    const owner = await ctx.db.get(session.owner);
    if (!owner) {
      return null;
    }

    return owner.name || null;
  },
});

/**
 * Get all transactions sorted by time for a valid analysis session.
 * First validates that the token's session exists and is not expired.
 * Returns all transactions sorted by creation time in descending order.
 */
export const getTransactionsByToken = query({
  args: {
    token: v.string(),
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
    })
  ),
  handler: async (ctx, args) => {
    // Find the analysis session by token
    const session = await ctx.db
      .query('analysisSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!session) {
      throw new Error('Invalid analysis session token');
    }

    // Check if session has expired
    if (session.expires < Date.now()) {
      throw new Error('Analysis session has expired');
    }

    // Get all transactions sorted by creation time (most recent first)
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_created_at')
      .order('desc')
      .collect();

    return transactions;
  },
});
