import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'clean transactions',
  { minutes: 10 }, // every 10 minutes
  internal.transactions.cleanupPendingTransactions
);

export default crons;
