import { createRoot } from 'react-dom/client';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, WagmiProvider, createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';
import './index.css';
import App from './App';
import '@lynx-js/web-core/index.css';
import '@lynx-js/web-elements/index.css';
import '@lynx-js/web-core';
import '@lynx-js/web-elements/all';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const config = createConfig({
  chains: [polygonAmoy],
  connectors: [metaMask({})],
  transports: {
    [polygonAmoy.id]: http(),
  },
});
const client = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={client}>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
