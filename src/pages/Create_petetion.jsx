import { useContext, useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp,setDoc,doc } from "firebase/firestore";
//import { getAuth } from "firebase/auth";
import { ethers } from "ethers";
import { AuthContext } from "../context/AuthContext";

import PetitionContractABI from "../abis/PetitionContract.json";
const CONTRACT_ADDRESS = "0xc977f4bf7ca81e3e9f3117353a06cd8814958ad7";

function CreatePetition() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const [deadline, setDeadline] = useState("");
  const [maxVotes, setMaxVotes] = useState("");

  const { walletAddress, credentialHash } = useContext(AuthContext);
  console.log(walletAddress);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!walletAddress) {
      alert("You must be logged in to create a petition.");
      return;
    }

    try {
      // const createdAt = new Date(); // Local timestamp to use for hash
      const options = ["Approve", "Disapprove"];
      const initialVotes = { Approve: 0, Disapprove: 0 };

      // Step 1: Create hash
      const hash = await createPetitionHash({
        title,
        description,
        // createdAt,
        createdBy: credentialHash,
      });

      // Step 2: Generate random Firebase-style ID for petition
      const petitionId = generateRandomId(); // Needed for storing on-chain and Firebase

      // Step 3: Store hash on-chain
      setDeadline(new Date(deadline).toISOString());
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000); // in seconds

      console.log("UNIX timestamp:", deadlineTimestamp);
      await storeHashOnBlockchain(petitionId, hash, deadlineTimestamp);

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
        // createdAt: serverTimestamp(),
        createdBy: credentialHash,
        options,
        votes: initialVotes,
        active: true,
        signedBy: [],
        hash,
        deadline: new Date(deadline).toISOString(), // stored as ISO timestamp
        maxVotes: parseInt(maxVotes, 10) ,
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

  const createPetitionHash = async ({ title, description, createdBy }) => {
    // const createdAtString = createdAt.toISOString();
    const payload = JSON.stringify({ title, description, createdBy });
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payload));
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const storeHashOnBlockchain = async (petitionId, hash,deadlineTimestamp) => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
    const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);
    const tx = await contract.createPetition(petitionIdBytes32, hash,deadlineTimestamp);
    await tx.wait();
    console.log("Stored hash of id on blockchain:", petitionIdBytes32);
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
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "bold" }}>Voting Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #ccc"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: "bold" }}>Max Votes</label>
            <input
              type="number"
              value={maxVotes}
              onChange={(e) => setMaxVotes(e.target.value)}
              min="1"
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #ccc"
              }}
              placeholder="E.g. 100 votes"
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
