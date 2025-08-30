/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analysis from "../analysis.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as customUser from "../customUser.js";
import type * as gifts from "../gifts.js";
import type * as http from "../http.js";
import type * as livestreamBlockchain from "../livestreamBlockchain.js";
import type * as livestreams from "../livestreams.js";
import type * as router from "../router.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analysis: typeof analysis;
  auth: typeof auth;
  crons: typeof crons;
  customUser: typeof customUser;
  gifts: typeof gifts;
  http: typeof http;
  livestreamBlockchain: typeof livestreamBlockchain;
  livestreams: typeof livestreams;
  router: typeof router;
  transactions: typeof transactions;
  users: typeof users;
  wallet: typeof wallet;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
