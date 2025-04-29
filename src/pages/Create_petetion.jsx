import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ethers } from "ethers";
import { deleteDoc, doc } from "firebase/firestore";

import PetitionContractABI from "../abis/PetitionContract.json"; 
const CONTRACT_ADDRESS = "0x4c9ad2b2e91085231599d3c3a06a8e1431feeb08"; 

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

    // Static options: Approve and Disapprove
    const options = ["Approve", "Disapprove"];
    const initialVotes = {};
    options.forEach((opt) => (initialVotes[opt] = 0));

    try {
      // Step 1: Add document to Firestore
      const docRef = await addDoc(collection(db, "petitions"), {
        title,
        description,
        options,  // Static options
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        votes: initialVotes,
        signedBy: []
      });

      const petitionId = docRef.id;
      
      // Step 2: Fetch the newly created document to get real createdAt timestamp
      const savedDoc = await getDoc(docRef);
      const petitionData = savedDoc.data();

      // Step 3: Generate the hash
      const petitionHash = await createPetitionHash({
        title: petitionData.title,
        description: petitionData.description,
        createdAt: petitionData.createdAt,
        createdBy: petitionData.createdBy,
      });
      console.log(petitionHash);
      // Step 4: Store the hash on blockchain
      await storeHashOnBlockchain(petitionId, petitionHash);

      const isHashVerified = await verifyHashOnBlockchain(petitionId, petitionHash);
     
      if (!isHashVerified) {
        // If the petition is not verified on the blockchain, delete it from Firebase
        await deleteDoc(doc(db, "petitions", petitionId));
        alert("Failed to add petition to blockchain. Petition deleted from Firebase.");
        return;
      }

      alert("Petition created successfully!");
      navigate("/home");
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("Error creating petition:", err);
      alert("Failed to create petition.");
    }
  };

  // Helper: Create petition hash
  const createPetitionHash = async ({ title, description, createdAt, createdBy }) => {
    const createdAtString = createdAt instanceof Date
      ? createdAt.toISOString()
      : createdAt.toDate().toISOString(); // If Firestore Timestamp

    const toHash = JSON.stringify({
      title,
      description,
      createdAt: createdAtString,
      createdBy,
    });

    const petitionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(toHash));
    return petitionHash;
  };

  // Helper: Store hash on blockchain
  const storeHashOnBlockchain = async (petitionId, petitionHash) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed!");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
    console.log("Storing hash on blockchain...");
    const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);
    const tx = await contract.createPetition(petitionIdBytes32, petitionHash);
    await tx.wait();
    console.log("Petition hash stored successfully on blockchain for id !",petitionIdBytes32);
  };

  const verifyHashOnBlockchain = async (petitionId, petitionHash) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed!");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    console.log("checking if hashes are equal");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
    try {
      const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);
      console.log("Checking hash for petition ID:", petitionIdBytes32);
      
      const storedHash = await contract.getPetitionHash(petitionIdBytes32);
      console.log("Stored hash on-chain:", storedHash);
      
      return storedHash === petitionHash;
    } catch (err) {
      if (err.code === "CALL_EXCEPTION") {
        console.warn("Petition ID not found on-chain.");
        return false;
      }
      console.error("Unexpected error verifying petition:", err);
      return false;
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "600px" }}>
        <h2>Create a Petition</h2>

        {/* Back Button */}
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

          <button type="submit" style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}>
            Create Petition
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePetition;
