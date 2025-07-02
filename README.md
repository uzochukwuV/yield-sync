
## // messageid 0x9f98f4a1fc7e855b8d37815673f7fba9075e2652ca202a8a172fc4e3151221ab


# 🌉 Cross-Chain Yield Dashboard

A dynamic, Chainlink CCIP-powered frontend for managing yield strategies deployed across multiple chains. This app enables users to interact with yield strategies such as vaults (deposit/withdraw), all from a single unified interface — even when the strategies live on different blockchains.

---

## 🚀 Features

- 🔁 **Cross-Chain Strategy Execution** using Chainlink CCIP
- 🌐 **Multi-chain Support** (e.g. Base Sepolia, Ethereum Sepolia)
- 📊 **User Portfolio Overview** from strategies on different chains
- ⚙️ **Dynamic Action Forms** based on metadata (no hardcoded UI)
- 🔄 **Transaction Status Tracking** with support for retries & error handling

---

## 🧠 How It Works

1. **Strategies are Deployed Cross-Chain**  
   Each strategy contract (e.g. a vault) lives on a specific chain and handles funds (like USDC) natively.

2. **Routers Relay Intents**  
   The `Router` contract is deployed to each chain and only handles cross-chain messaging. It does not hold funds.

3. **User Initiates Action on Source Chain**  
   Via the UI, the user selects a source chain, destination chain, strategy, and action (e.g. deposit USDC into a vault).

4. **Chainlink CCIP Handles Cross-Chain Execution**  
   The router sends the intent and data cross-chain. The destination router receives the message and invokes the strategy with the data.

5. **UI Displays Portfolio + Transaction Status**  
   The frontend dynamically tracks execution results and retrieves balances from each strategy contract on every supported chain.

---

## 🧱 Tech Stack

- **Next.js**
- **TypeScript**
- **Wagmi + Viem** for multi-chain wallet interaction
- **RainbowKit** for wallet onboarding
- **Ethers / Chainlink CCIP** for cross-chain communication
- **Static Strategy Metadata JSON** for dynamic UI rendering

---

## 🗂 Project start

---

## 📦 Installation

```bash
git clone https://github.com/uzochukwuV/yield-sync.git

npm install





🧪 Running the App
bash
Copy
Edit
npm run dev
Open in browser: http://localhost:3000

Connect wallet using RainbowKit

Select a strategy and chain

Fill the form and submit your yield action

📊 Monitoring Execution
Success
CCIP message is sent and strategy successfully executes the action

You’ll see it in the activity log as ✅ Executed

Failure
If strategy fails, it is stored and you’ll see ❌ Failed

You can click Retry after delay, or use Emergency Withdraw to reclaim tokens

📤 Supported Actions
Each strategy defines its supported actions via metadata and smart contract interface. Example:

Action	ID	Description
Deposit	1	Deposit ERC-20 tokens
Withdraw	2	Withdraw from vault

Actions are matched dynamically with UI form components.

🔐 Security Model
Routers do not hold funds

All user funds are held by strategy contracts on destination chains

Actions can be retried or recovered if they fail cross-chain

✨ Roadmap
 Integrate The Graph for historical activity

 Add batch support for multicall on userPositions

 Expand token & strategy support

 Real APY/TVL tracking for strategies

🤝 Contributing
Pull requests welcome. Please update tests and strategy metadata if adding new strategies.

📄 License
MIT

💬 Questions?
Open an issue or reach out at vic.ezealor@gmail.com


---
