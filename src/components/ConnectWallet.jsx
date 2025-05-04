import { useContext, useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc,getDoc} from "firebase/firestore";
import { ethers } from "ethers";
import { AuthContext } from "../context/AuthContext";
import { auth,db } from "../firebase";
import VerifyCredContractABI from "../abis/VerifyCred.json";

const CONTRACT_ADDRESS = "0xa292ca76129aa1b3545a79e4870ea2e3a35c783b";

function ConnectWallet() {
  const {
    walletAddress,
    signInWithEthereum,
    signOut: siweSignOut,
    credentials,
    setCredentials,
    setCredentialHash,
  } = useContext(AuthContext);

  const [uploadedCredentials, setUploadedCredentials] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [fileError, setFileError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const navigate = useNavigate();

  const handleSIWEConnect = async () => {
    const address = await signInWithEthereum();
    if (!address) setShowAlert(true);
    navigate('/home');
  };

  const handleLogout = async () => {
    siweSignOut();
    await firebaseSignOut(auth);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setUploadedCredentials(json);
          setFileError(null);
          setUploadedFileName(file.name);
        } catch (err) {
          setUploadedCredentials(null);
          setFileError("Invalid JSON format");
          setUploadedFileName("");
        }
      };
      reader.readAsText(file);
    } else {
      setUploadedCredentials(null);
      setFileError("Please upload a valid .json file");
      setUploadedFileName("");
    }
  };

  const getCredentials = async () => {
    if (!walletAddress) {
      setShowAlert(true);
      return;
    }

    if (!uploadedCredentials) {
      alert("Please upload a valid credential file.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VerifyCredContractABI, signer);
      console.log("Contacting smart contract ...");
      const result = await contract.verifyCredentials(uploadedCredentials);

      if (result === true) {
        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(uploadedCredentials)));
        // Store in context
        setCredentialHash(hash);

        const docRef = doc(db, "credentials", hash);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          await setDoc(docRef, {
            issuedAt: serverTimestamp()
          });
          console.log("New credential stored.");
        } else {
          console.log("Credential already exists. Skipping overwrite.");
        }

        setCredentials(true);
        navigate('/home');
      } else {
        alert("Credential verification failed.");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      alert("Verification failed. Check the console for details.");
    }
  };

  useEffect(() => {
    const checkCredentials = async () => {
      if (walletAddress) {
        const credentialsRef = doc(db, "credentials", hash);
        const docSnap = await getDoc(credentialsRef);

        if (docSnap.exists()) {
          setCredentials(true);
        }
      }
    };

     // Only run checkCredentials if walletAddress is available
    if (walletAddress) {
    checkCredentials();
  }
  }, [walletAddress]);

  return (
    <div className="card" style={styles.card}>
      <button
        onClick={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </button>

      <h1>Petition System</h1>

      <div style={styles.card}>
        <button onClick={handleSIWEConnect} style={styles.connectButton}>
          {walletAddress
            ? `Wallet Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
            : 'Connect Wallet'}
          </button>
        <p>Connect MetaMask wallet to enter petition system</p>
      </div>

      {/* <div style={styles.card}>
        <label style={styles.fileLabel}>
          Upload your credentials
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={styles.hiddenInput}
          />
        </label>
        {uploadedFileName && (
          <p style={{ marginTop: '8px', color: 'green' }}>
            Uploaded file: <strong>{uploadedFileName}</strong>
          </p>
        )}
        {fileError && <p style={{ color: 'red', marginTop: '8px' }}>{fileError}</p>}

        <button
          onClick={getCredentials}
          disabled={!walletAddress || !uploadedCredentials}
          style={{
            ...styles.credentialsButton,
            backgroundColor: !walletAddress || !uploadedCredentials ? '#ccc' : styles.credentialsButton.backgroundColor,
            cursor: !walletAddress || !uploadedCredentials ? 'not-allowed' : 'pointer'
          }}
        >
          {credentials ? 'Go to Home' : 'Get Credentials'}
        </button>
        <p>
          {credentials
            ? 'You already have credentials. Proceed to home.'
            : 'Upload your credentials JSON file to continue'}
        </p>
      </div> */}

      {showAlert && (
        <div style={styles.alert}>
          <p>Please connect your wallet to proceed.</p>
          <button onClick={() => setShowAlert(false)} style={styles.closeAlert}>Close</button>
        </div>
      )}
    </div>
  );
}

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
  fileLabel: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  hiddenInput: {
    display: 'none',
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
