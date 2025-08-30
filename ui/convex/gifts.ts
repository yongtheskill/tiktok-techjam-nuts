import { query } from './_generated/server';

export const getGifts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('gifts').collect();
  },
});
