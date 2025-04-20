import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { useState } from "react";
import PetitionABI from "../contracts/Petition.json";

const PetitionDetails = () => {
  const { state } = useLocation();
  const { petitionAddress, title, description, isLive } = state;
  const [status, setStatus] = useState(isLive);
  const [signCount, setSignCount] = useState(null);
  const [result, setResult] = useState(null);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(petitionAddress, PetitionABI, signer);
  };

  const handleSign = async () => {
    const confirmed = window.confirm("Are you sure you want to sign this petition?");
    if (!confirmed) return;

    try {
      const contract = await getContract();
      const tx = await contract.signPetition();
      await tx.wait();
      alert("✅ Signed successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error signing petition");
    }
  };

  const handleShowResults = async () => {
    const contract = await getContract();
    const count = await contract.signatureCount();
    setSignCount(Number(count));
    setResult(count >= 1 ? "✅ Success" : "❌ Failed");
  };

  return (
    <div className="petition-detail">
      <h2>{title}</h2>
      <p>{description}</p>
      <p>Status: {status ? "🟢 Live" : "🔴 Ended"}</p>

      {status ? (
        <button onClick={handleSign}>✍️ Sign Petition</button>
      ) : (
        <>
          <button onClick={handleShowResults}>📊 Show Results</button>
          {signCount !== null && (
            <p>Signatures: {signCount} — {result}</p>
          )}
        </>
      )}
    </div>
  );
};

export default PetitionDetails;
