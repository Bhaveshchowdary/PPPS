// src/components/ConnectWallet.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function ConnectWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]);
        console.log('Connected wallet:', accounts[0]);
      } catch (err) {
        console.error('User rejected wallet connection', err);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const getCredentials = () => {
    // Placeholder for your credential logic
    setCredentials(true);
    navigate('/home'); // If you're navigating to petition form or dashboard
  };

  return (
    <div className="card">
      <button
        onClick={() => signOut(auth)}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

      <h1>Petition System</h1>

      <div className="card">
        <button onClick={connectWallet}>
          {walletAddress ? `Wallet Connected : ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
        </button>
        <p>Connect MetaMask wallet to enter petition system</p>
      </div>

      <div className="card">
        <button onClick={getCredentials}>
          {credentials ? 'Got Credentials' : 'Get Credentials'}
        </button>
        <p>Get credentials to sign/create petition</p>
      </div>
    </div>
  );
}

export default ConnectWallet;
