import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { v4 as uuidv4 } from 'uuid';

import { type D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

export interface Env {
  TIKTOK_CLIENT_KEY: string;
}

app.get('/', (c) => {
  return c.text('ttCoin!');
});

// GET QR
app.post('/auth/getQR', async (c) => {
  const { TIKTOK_CLIENT_KEY } = env<{ TIKTOK_CLIENT_KEY: string }>(c);

  const res = await fetch('https://open.tiktokapis.com/v2/oauth/get_qrcode/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY || '',
      scope: 'user.info.basic',
      state: 'ahaha',
    }),
  });

  const data = (await res.json()) as
    | { scan_qrcode_url: string; token: string }
    | { error: string; error_description: string; log_id: string };

  if ('error' in data) {
    console.log(data);
    return c.json({ error: 'error getting qr code' }, 400);
  }

  return c.json({ qr: data.scan_qrcode_url, token: data.token });
});

// CHECK QR
type QRCheckResponse =
  | { client_ticket: string; status: 'new' }
  | { client_ticket: string; status: 'scanned' }
  | { client_ticket: string; redirect_uri: string; status: 'confirmed' }
  | { client_ticket: string; status: 'utilised' }
  | { client_ticket: string; status: 'expired' }
  | { error: string; error_description: string; log_id: string };

app.post('/auth/checkQR', async (c) => {
  const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET } = env<{
    TIKTOK_CLIENT_KEY: string;
    TIKTOK_CLIENT_SECRET: string;
  }>(c);
  const { token } = await c.req.json();

  const res = await fetch('https://open.tiktokapis.com/v2/oauth/check_qrcode/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY || '',
      client_secret: TIKTOK_CLIENT_SECRET || '',
      token,
    }),
  });

  const data = (await res.json()) as QRCheckResponse;

  if ('error' in data) {
    console.log(data);
    return c.json({ error: 'error getting qr code' }, 400);
  }

  if (data.status === 'confirmed') {
    // 1. Extract authorization code from redirect_uri
    const redirectUrl = new URL(decodeURIComponent(data.redirect_uri));
    const code = redirectUrl.searchParams.get('code');
    if (!code) {
      return c.json({ error: 'authorization code not found' }, 400);
    }

    // 2. Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY || '',
        client_secret: TIKTOK_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: data.redirect_uri,
      }),
    });

    type TokenResponse =
      | {
          access_token: string;
          expires_in: number;
          open_id: string;
          refresh_expires_in: number;
          refresh_token: string;
          scope: string;
          token_type: string;
        }
      | {
          error: string;
          error_description: string;
          log_id: string;
        };

    const tokenData = (await tokenRes.json()) as TokenResponse;

    if ('error' in tokenData) {
      console.log(tokenData);
      return c.json({ error: 'error getting access token' }, 400);
    }

    // retrieve profile information from tiktok
    const profileRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?' +
        new URLSearchParams({ fields: 'open_id,avatar_url,display_name,username' }).toString(),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const profileData = (await profileRes.json()) as
      | {
          data: {
            user: {
              open_id?: string;
              avatar_url?: string;
              display_name?: string;
              username?: string;
            };
          };
        }
      | {
          error: string;
          error_description: string;
          log_id: string;
        };

    if ('error' in profileData || profileData.data.user.open_id === undefined) {
      console.log(profileData);
      return c.json({ error: 'error getting profile information' }, 400);
    }

    const openId = profileData.data.user.open_id;
    // check if user exists
    try {
      let { results } = await c.env.DB.prepare('SELECT token FROM users WHERE open_id = ?')
        .bind(openId)
        .run();

      if (results && results.length > 0) {
        return c.json({ res: 'success', token: results[0].token });
      }
    } catch (e) {
      return c.json({ err: 'error checking user' }, 500);
    }

    // create new user
    try {
      const token = uuidv4();
      let { results } = await c.env.DB.prepare(
        'INSERT INTO users (open_id, avatar_url, display_name, username, wallet_address, token) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(
          openId,
          profileData.data.user.avatar_url || '',
          profileData.data.user.display_name || '',
          profileData.data.user.username || '',
          '',
          token
        )
        .run();

      return c.json({ res: 'success', token });
    } catch (e) {
      return c.json({ err: 'error creating user' }, 500);
    }
  }

  if (data.status === 'expired') {
    return c.json({ res: 'regenerate' });
  }

  return c.json({ res: 'waiting' });
});

export default app;
