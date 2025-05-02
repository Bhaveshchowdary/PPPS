// src/context/AuthContext.jsx
import { createContext, useState } from "react";
import { SiweMessage } from "siwe";
import { ethers } from "ethers";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [credentials, setCredentials] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialHash, setCredentialHash] = useState(null);
  
  const signInWithEthereum = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the petition app",
        uri: window.location.origin,
        version: "1",
        chainId: await signer.getChainId(),
      });

      const preparedMessage = message.prepareMessage();
      const signature = await signer.signMessage(preparedMessage);
      const isValid = await message.verify({ signature });

      if (isValid.success) {
        setWalletAddress(address);
        setIsAuthenticated(true);
        return address;
      } else {
        throw new Error("SIWE verification failed");
      }
    } catch (err) {
      console.error("SIWE error:", err);
      setIsAuthenticated(false);
      return null;
    }
  };

  const signOut = () => {
    setWalletAddress(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ walletAddress, isAuthenticated,setWalletAddress,credentials, setCredentials, credentialHash, setCredentialHash,signInWithEthereum, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
