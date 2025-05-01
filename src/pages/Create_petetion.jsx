import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp,setDoc,doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ethers } from "ethers";

import PetitionContractABI from "../abis/PetitionContract.json";
const CONTRACT_ADDRESS = "0x7539b55c328e343c1c9a900d6367d93036ad57e8";

function CreatePetition() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to create a petition.");
      return;
    }

    try {
      const createdAt = new Date(); // Local timestamp to use for hash
      const options = ["Approve", "Disapprove"];
      const initialVotes = { Approve: 0, Disapprove: 0 };

      // Step 1: Create hash
      const hash = await createPetitionHash({
        title,
        description,
        createdAt,
        createdBy: user.uid,
      });

      // Step 2: Generate random Firebase-style ID for petition
      const petitionId = generateRandomId(); // Needed for storing on-chain and Firebase

      // Step 3: Store hash on-chain
      await storeHashOnBlockchain(petitionId, hash);

      // Step 4: Verify hash was correctly stored
      const isVerified = await verifyHashOnBlockchain(petitionId, hash);
      if (!isVerified) {
        alert("Failed to verify hash on-chain.");
        return;
      }

      // Step 5: Store petition in Firestore
      await setDoc(doc(db, "petitions", petitionId), {
        title,
        description,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        options,
        votes: initialVotes,
        active: true,
        signedBy: [],
        hash,
      });

      alert("Petition created successfully!");
      setTitle("");
      setDescription("");
      navigate("/home");
    } catch (err) {
      console.error("Error creating petition:", err);
      alert("Error creating petition. See console.");
    }
  };

  const createPetitionHash = async ({ title, description, createdAt, createdBy }) => {
    const createdAtString = createdAt.toISOString();
    const payload = JSON.stringify({ title, description, createdAt: createdAtString, createdBy });
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payload));
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const storeHashOnBlockchain = async (petitionId, hash) => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
    const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);
    const tx = await contract.createPetition(petitionIdBytes32, hash);
    await tx.wait();
    console.log("Stored hash on blockchain:", hash);
  };

  const verifyHashOnBlockchain = async (petitionId, hash) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
    const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);
    const storedHash = await contract.getPetitionHash(petitionIdBytes32);
    console.log("verifying hash:", hash)
    return storedHash === hash;
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "600px" }}>
        <h2>Create a Petition</h2>
        <button
          onClick={() => navigate("/home")}
          style={{
            padding: "0.5rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Back
        </button>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "bold" }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #ccc"
              }}
              placeholder="Give your petition a title"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "bold" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows="4"
              placeholder="Explain what this petition is about..."
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #ccc"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Create Petition
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePetition;
