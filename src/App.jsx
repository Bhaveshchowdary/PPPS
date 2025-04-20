import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react'
import './App.css'

function App() {
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
    navigate('/home');
    // alert('Credentials fetched (simulate)');
  };

  return (
    <>
     
    <div className="card">
      <h1>Petition System</h1>
      <div className="card">
        <button onClick={connectWallet}>
          {walletAddress ? `Wallet Connected : ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
        </button>
        <p>
          Step 1 : Please connect metamask wallet to enter petition system
        </p>
      </div>
      <div className="card">
        <button onClick={getCredentials}>
          {credentials ? `Got Credentials` : 'Get Credentials'}
        </button>
        <p>
        Step 2 : Get credentials to sign/create petition
        </p>
      </div>
      </div>

    </>
    
  )
}

export default App