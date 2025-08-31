# TTCoin

## Overview

**TTCoin** is a blockchain-powered solution designed to bring transparency and real-time compensation to TikTok's livestreaming ecosystem.
By leveraging the power of smart contracts on a scalable blockchain, TTCoin creates a trustworthy ledger for all gift-giving transactions. Our system ensures that creators are compensated fairly and instantly, resolving the ambiguity and delays of traditional payment systems. This fosters a more engaged and trusting community, where both creators and their supporters can participate with complete confidence.

## Inspiration: The "Why"

The creator economy is booming, but the underlying payment infrastructures often lag behind. The main pain point we identified is the **lack of transparency and trust in creator compensation**. Creators, the lifeblood of the TikTok platform, often face delayed payments and are not privy to the exact revenue calculations. This opacity can lead to misaligned incentives and ultimately reduce ecosystem engagement.

We were inspired to build a system where trust is not an afterthought, but the foundation. We envisioned a world where a creator receives their share of a gift the very instant it's sent, recorded transparently for all to see. TTCoin was born from this vision: to empower creators with a clear, fair, and immediate compensation model that strengthens the entire TikTok ecosystem.

## What It Does

TTCoin seamlessly integrates a blockchain layer into the existing livestream gifting process. Here’s a breakdown of the user and system flow:

1. **Acquiring TTCoin**: Users purchase **TTCoins**, a stable digital currency, directly from TikTok at a fixed price. They can also sell them back, creating a stable and liquid in-app economy.
2. **On-Chain Livestreams**: When a creator initiates a livestream, a new session is logged on the blockchain. At this point, TikTok sets the initial revenue split percentage with the creator (e.g., 70% for the creator, 30% for TikTok), which is also recorded on-chain. This percentage can be dynamically updated by TikTok throughout the stream to allow for promotions or tiered rewards.
3. **Instant, Smart Gifting**: A viewer sends a gift to the creator using their TTCoin balance. This action triggers a **smart contract** that automatically and instantly splits the TTCoin value according to the current, on-chain revenue share percentage. The respective amounts are immediately credited to the creator's and TikTok's blockchain wallets.
4. **Total Transparency**: Every gift, every split, and every pay-out is a transaction recorded on the blockchain, creating an immutable and auditable trail.
5. **Fraud Detection**: An admin-accessible dashboard utilizes heuristics to monitor transaction patterns for potential money laundering or fraudulent activities. It automatically flags suspicious behaviour and alerts administrators to ensure platform integrity.

## How We Built It

We chose a modern, scalable, and robust tech stack to bring TTCoin to life, ensuring it could handle the massive scale of the TikTok platform.

- **Blockchain**: **Polygon PoS** We selected it for its high throughput and low transaction fees. This allows us to process millions of gifts at low costs, essential for a real-time user experience.
- **Backend & Database**: **Convex** provided us with a serverless backend and real-time database. Its serverless architecture allowed us for instant, seamless scaling, critical for implementing our solution in the real world.
- **Hosting**: **Vercel** allowed us to seamlessly deploy our web interface, with blazing-fast access from all around the world.
- **Frontend**: **React & Lynx** We used React to build a responsive, high-performance user interface. Lynx allowed us to create a polished UI that is easily re-used in mobile apps.
- **Smart Contracts**: **Solidity** The core logic of our system is encapsulated in smart contracts written in Solidity. These contracts are deployed on the Polygon network and are the backbone of our trustless system.
The real-time, on-chain revenue splitting is a direct result of this carefully chosen stack. The use of smart contracts to automatically and transparently distribute funds the moment a gift is sent is a significant leap forward from traditional, opaque payment systems.

![Smart Contract System Diagram](https://raw.githubusercontent.com/yongtheskill/tiktok-techjam-nuts/refs/heads/main/docs/BlockchainDesignDiagram.png)
Smart Contract System Diagram

## What's Next

We see our hackathon project as a proof-of-concept for a full-scale rollout. Our roadmap includes:

1. **Deep TikTok Integration**: The next logical step is to build out a seamless user experience within the TikTok app. This includes creating an **in-app blockchain wallet** linked to user accounts and integrating the TTCoin system directly with the "Go LIVE" and gifting features.
2. **Transition to a Private Blockchain**: For a platform of TikTok's scale, a private (or permissioned) blockchain offers significant advantages:
    - **Regulatory Compliance**: Enforcing Anti-Money Laundering (AML) protocols becomes much more manageable.
    - **Enhanced Security**: TikTok can control who participates in the network, removing malicious actors and preventing fraud.
    - **Gas Fee Elimination**: As the sole validator, TikTok can completely absorb or eliminate transaction fees, making the experience frictionless for users.

By demonstrating the effectiveness of TTCoin, we hope to redefine online value-sharing for a more transparent and trustworthy future.
