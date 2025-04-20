import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PetitionDetails from "./pages/PetitionDetails";
import SignedPetitions from "./pages/SignedPetitions";
import CreatedPetitions from "./pages/CreatedPetitions";
import CreatePetition from "./pages/createPetition";
import "./App.css"; // Import your CSS file
function App() {
  const [address, setAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false); // Track wallet connection status

  // Function to connect the wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");

    const provider = new ethers.providers.Web3Provider(window.ethereum); // Use Web3Provider for MetaMask
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress); // Set the address on connect
      setIsWalletConnected(true); // Set wallet as connected
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet.");
    }
  };

  // Function to logout
  const logout = () => {
    setAddress(""); // Reset the address when logging out
    setIsWalletConnected(false); // Reset the wallet connection status
    alert("Logged out successfully!");
  };

  useEffect(() => {
    // Check if wallet is already connected on app load
    const checkIfWalletConnected = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum); // Use Web3Provider for MetaMask
        try {
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          setAddress(userAddress); // Set the address if wallet is connected
          setIsWalletConnected(true); // Set wallet as connected
        } catch (error) {
          console.error("Error retrieving address:", error);
          setIsWalletConnected(false); // Reset connection status if error occurs
        }
      }
    };
    checkIfWalletConnected(); // Run check on component mount
  }, []);

  return (
    <Router>
      {/* Show Navbar only after wallet is connected */}
      {isWalletConnected && <Navbar address={address} onLogout={logout} />}

      {/* Show Connect Wallet button if the wallet is not connected */}
      {!isWalletConnected && (
        <div className="connect-wallet-container">
        <h1 className="title">Petition System</h1> {/* Add the title */}
        <div className="connect-wallet">
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      </div>
      )}

      <Routes>
        <Route path="/" element={<Home address={address} />} />
        <Route path="/petition/:id" element={<PetitionDetails />} />
        <Route path="/signed" element={<SignedPetitions address={address} />} />
        <Route path="/created" element={<CreatedPetitions address={address} />} />
        <Route path="/create" element={<CreatePetition />} />
      </Routes>
    </Router>
  );
}

export default App;
