import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'clean transactions',
  { hours: 3 }, // every 3 hours
  internal.transactions.cleanupPendingTransactions
);

export default crons;
