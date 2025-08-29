import { MetaMaskSDK } from '@metamask/sdk';

export const MMSDK = new MetaMaskSDK({
  dappMetadata: {
    name: 'Example JavaScript dapp',
    url: window.location.href,
    // iconUrl: "https://mydapp.com/icon.png" // Optional
  },
  infuraAPIKey: process.env.INFURA_API_KEY,
});
