import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";

function ConnectWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [credentials, setCredentials] = useState(false);
  const [showAlert, setShowAlert] = useState(false);  // State to handle alert visibility
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
    // If the wallet isn't connected, show the alert
    if (!walletAddress) {
      setShowAlert(true);
      return;
    }

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
    <div className="card" style={styles.card}>
      <button
        onClick={() => signOut(auth)}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
        style={styles.logoutButton}
      >
        Logout
      </button>

      <h1>Petition System</h1>

      <div className="card" style={styles.card}>
        <button onClick={connectWallet} style={styles.connectButton}>
          {walletAddress ? `Wallet Connected : ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
        </button>
        <p>Connect MetaMask wallet to enter petition system</p>
      </div>

      <div className="card" style={styles.card}>
        <button 
          onClick={getCredentials}
          disabled={!walletAddress}
          style={styles.credentialsButton}
        >
          {credentials ? 'Go to Home' : 'Get Credentials'}
        </button>
        <p>{credentials ? 'You already have credentials. Proceed to home.' : 'Get credentials to sign/create petition'}</p>
      </div>

      {/* Alert when user tries to proceed without connecting wallet */}
      {showAlert && (
        <div style={styles.alert}>
          <p>Please connect your wallet to proceed.</p>
          <button onClick={() => setShowAlert(false)} style={styles.closeAlert}>Close</button>
        </div>
      )}
    </div>
  );
}

// Inline Styles
const styles = {
  card: {
    padding: '20px',
    marginBottom: '10px',
    borderRadius: '8px',
    background: '#f8f9fa',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  logoutButton: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: '#ff5722',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  credentialsButton: {
    backgroundColor: '#007BFF',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  alert: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '20px',
    borderRadius: '5px',
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  closeAlert: {
    backgroundColor: '#ff5722',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default ConnectWallet;
