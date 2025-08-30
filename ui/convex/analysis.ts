import { mutation } from './_generated/server';
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
    });

    return {
      sessionId,
      token,
      expires,
    };
  },
});
