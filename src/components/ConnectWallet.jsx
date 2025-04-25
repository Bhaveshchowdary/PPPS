import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";

function ConnectWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [credentials, setCredentials] = useState(false);
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

  const getCredentials = async () => {
    const userId = auth.currentUser?.uid;

    if (userId) {
      const credentialsRef = doc(db, "credentials", userId);
      const docSnap = await getDoc(credentialsRef);

      // If credentials don't exist, navigate to issue-credentials page
      if (!docSnap.exists()) {
        navigate('/issue-credentials');
      } else {
        // If credentials already exist, set the credentials flag to true and show Home button
        setCredentials(true);
        navigate('/home');
      }
    }
  };

  useEffect(() => {
    // Check if user is already logged in and credentials are issued
    const checkCredentials = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const credentialsRef = doc(db, "credentials", userId);
        const docSnap = await getDoc(credentialsRef);

        if (docSnap.exists()) {
          setCredentials(true); // Set credentials if already exist
        }
      }
    };

    checkCredentials();
  }, [auth.currentUser]);

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
          {credentials ? 'Go to Home' : 'Get Credentials'}
        </button>
        <p>{credentials ? 'You already have credentials. Proceed to home.' : 'Get credentials to sign/create petition'}</p>
      </div>
    </div>
  );
}

export default ConnectWallet;
