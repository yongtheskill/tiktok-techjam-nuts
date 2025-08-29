import { useNavigate } from 'react-router';
import '../App.css';

export function Home() {
  const nav = useNavigate();

  return (
    <view>
      <view className="Background" />
      <view className="App">
        <text style={{ fontSize: '32px', fontWeight: '700' }}>
          Welcome to TTCoin
        </text>
        <text
          style={{ fontSize: '18px', fontWeight: '400', paddingTop: '8px' }}
        >
          The future of value on TikTok
        </text>
        <view
          className="button success"
          bindtap={() => nav('/login')}
          style={{ marginTop: '30px' }}
        >
          <text>Log In!</text>
        </view>
      </view>
    </view>
  );
}
