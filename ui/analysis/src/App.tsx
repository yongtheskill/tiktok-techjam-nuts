import { useEffect, useState } from '@lynx-js/react';
import './App.css';
import './Font.css';
import { Main } from './Main.js';

export function App(props: { onRender?: () => void }) {
  const [analysisSessionToken, setAnalysisSessionToken] = useState<
    string | null
  >(null);
  const [userName, setUserName] = useState<string | null>(null);

  props.onRender?.();

  useEffect(() => {
    fetch('https://hushed-reindeer-478.convex.cloud/api/mutation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'analysis:getAnalysisSession',
        args: {},
        format: 'json',
      }),
    }).then((response) => {
      response.json().then((data) => {
        setAnalysisSessionToken(data.value.token);

        fetch('https://hushed-reindeer-478.convex.cloud/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: 'analysis:getAnalysisSessionOwner',
            args: { token: data.value.token },
            format: 'json',
          }),
        }).then((response) => {
          response.json().then((data) => {
            setUserName(data.value);
          });
        });
      });
    });
  }, []);

  return (
    <view style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {analysisSessionToken == null || userName == null ? (
        <view
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem',
          }}
        >
          <view style={{ textAlign: 'center' }}>
            <view
              style={{
                width: '32px',
                height: '32px',
                border: '4px solid #3b82f6',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
              }}
            />
          </view>
        </view>
      ) : (
        <view style={{ height: '100%', overflow: 'hidden' }}>
          {/* <text
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#aaa',
              position: 'absolute',
              top: '8px',
              right: '16px',
              zIndex: 1000,
            }}
          >
            User: {userName ?? ''}
          </text> */}
          <Main token={analysisSessionToken} />
        </view>
      )}
    </view>
  );
}
