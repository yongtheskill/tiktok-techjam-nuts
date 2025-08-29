import { useState, useEffect } from '@lynx-js/react';
import { useNavigate } from 'react-router';
import { fetchJson } from '../utils/api.js';
import '../App.css';

export function Login() {
  const nav = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const getQr = async () => {
    const res = await fetchJson<{ qr: string; token: string }>('/auth/getQR', {
      method: 'POST',
    });
    setQrCodeUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${res.qr}`,
    );
    setQrToken(res.token);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (qrToken == null) {
        return;
      }
    }, 500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <view>
      <view className="Background" />
      <view className="App">
        {qrCodeUrl == null ? (
          <view style={{ width: '100%', padding: '0 40px' }}>
            <view
              className="button success"
              bindtap={getQr}
              style={{ width: '100%' }}
            >
              <text>Log In with TikTok</text>
            </view>
          </view>
        ) : qrCodeUrl == '' ? (
          <view>
            <text>Loading...</text>
          </view>
        ) : (
          <view
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <view style={{ padding: '10px', background: 'white' }}>
              <image src={qrCodeUrl} className="loginQR" />
            </view>
            <text style={{ fontSize: '18px', paddingTop: '12px' }}>
              Scan the QR code to log in with TikTok!
            </text>
          </view>
        )}
        <text
          bindtap={() => nav(-1)}
          style={{ paddingTop: '20px' }}
          className="lightText"
        >
          Go Back
        </text>
      </view>
    </view>
  );
}
