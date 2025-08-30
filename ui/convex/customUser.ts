import { Password } from '@convex-dev/auth/providers/Password';
import { DataModel } from './_generated/dataModel';

export default Password<DataModel>({
  profile(params, _ctx) {
    return {
      email: params.email as string,
      isStreamer: false,
      isAdmin: false,
      createdAt: Date.now(),
    };
  },
});
