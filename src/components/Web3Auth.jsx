import { useState } from "react";
import { BrowserProvider, ethers } from "ethers";
import Web3Modal from "web3modal";
import "./Web3Auth.css";
import TrustWalletProvider from "@trustwallet/web3-provider";
// import { MetaMaskProvider } from "@metamask/providers"; // Use the correct MetaMask provider import


const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // Replace with desired token contract
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
];

function Web3Auth() {
    const [walletAddress, setWalletAddress] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [transactionHash, setTransactionHash] = useState("");

    const connectWallet = async () => {
        const web3Modal = new Web3Modal({
            cacheProvider: false, // Cache the provider if you want to persist the connection
            providerOptions: {
            //   metamask: {
            //     package: MetaMaskProvider, // Use the MetaMask provider
            //     // options: {
            //     //   // Optional configurations for MetaMask
            //     // },
            //   },
              trustwallet: {
                package: TrustWalletProvider, // Use the Trust Wallet provider
                // options: {
                //   infuraId: "your-infura-id" // Optional: Only needed if you're using Infura as a provider
                // },
              },
            },
          });
      

        try {
            const instance = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(instance);
            const signer = await provider.getSigner();

            const accounts = await signer.getAddress();
            setWalletAddress(accounts);
            console.log("Connected Wallet:", accounts);
        } catch (err) {
            console.error("Wallet connection failed", err);
        }
    };

    const sendToken = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet first");
            return;
        }
    
        if (!recipientAddress || !tokenAmount) {
            alert("Please provide recipient address and amount");
            return;
        }
    
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
    
            // Connect to the USDT contract
            const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ERC20_ABI, signer);
    
            // Convert the token amount to the smallest unit (USDT uses 6 decimals)
            const decimals = 6;
            const amount = ethers.parseUnits(tokenAmount, decimals); // Correctly parse the amount with 6 decimals
    
            // Fetch the sender's token balance
            const balance = await contract.balanceOf(walletAddress);
    
            // Convert balance to human-readable format by dividing by 10^6
            const readableBalance = ethers.formatUnits(balance, decimals);
    
            console.log(`Wallet USDT Balance: ${readableBalance} USDT`);
    
            // Check if the balance is sufficient
            if (balance < amount) { // Directly compare `bigint` values
                alert(`Insufficient balance. Your current balance is ${readableBalance} USDT`);
                return;
            }
    
            console.log("Sufficient balance. Sending Tokens...");
    
            // Send the tokens
            const tx = await contract.transfer(recipientAddress, amount);
    
            console.log("Transaction Sent:", tx);
            setTransactionHash(tx.hash);
            alert(`Transaction sent! Hash: ${tx.hash}`);
        } catch (err) {
            console.error("Error sending tokens:", err);
            alert("Transaction failed. Check console for details.");
        }
    };
    
    
    return (
        <div className="container">
            <div className="card">
                <h1 className="title">Web3 Token Transfer</h1>
                {!walletAddress ? (
                    <button className="btn connect-btn" onClick={connectWallet}>
                        Connect Wallet
                    </button>
                ) : (
                    <div className="transfer">
                        <h2>Send USDT</h2>
                        <p className="wallet">Connected Wallet: {walletAddress}</p>
                        <input
                            type="text"
                            placeholder="Recipient Address"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            className="input"
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            className="input"
                        />
                        <button className="btn send-btn" onClick={sendToken}>
                            Send
                        </button>
                        {transactionHash && (
                            <p className="tx-hash">
                                Transaction Hash: <span>{transactionHash}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Web3Auth;
