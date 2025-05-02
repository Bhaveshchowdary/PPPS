import { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, arrayUnion ,deleteDoc} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import { AuthContext } from "../context/AuthContext";

import PetitionContractABI from "../abis/PetitionContract.json"; 
const CONTRACT_ADDRESS = "0xc977f4bf7ca81e3e9f3117353a06cd8814958ad7"; 


function AllPetitions() {
  const [activePetitions, setActivePetitions] = useState([]);
  const [completedPetitions, setCompletedPetitions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [corruptedPetitionIds, setCorruptedPetitionIds] = useState(new Set());
  const { walletAddress, credentialHash } = useContext(AuthContext);
  const [publishingId, setPublishingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndVerifyPetitions = async () => {
      try {
        const petitionsRef = collection(db, "petitions");
        const querySnapshot = await getDocs(petitionsRef);

        const petitionsData = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          PetitionContractABI,
          signer
        );

        const onChainIdsBytes32 = await contract.getAllPetitionIds();
    const onChainIds = onChainIdsBytes32.map(id => ethers.utils.parseBytes32String(id));

    // 2. Firebase vs On-chain count check
    if (petitionsData.length < onChainIds.length) {
      alert(`⚠️ Firebase is missing ${onChainIds.length - petitionsData.length} petition(s) that exist on-chain.`);
    }

    const corruptedIds = new Set();
    const deletedIds = [];

    // 3. Remove extra petitions in Firebase that are not on-chain
    for (const petition of petitionsData) {
      if (!onChainIds.includes(petition.id)) {
        deletedIds.push(petition.id);
        await deleteDoc(doc(db, "petitions", petition.id));
      }
    }

    // 4. Alert if extra (deleted) Firebase petitions found
    if (deletedIds.length > 0) {
      alert(`🗑️ ${deletedIds.length} extra petition(s) deleted from Firebase because they no longer exist on-chain:\n\n${deletedIds.join("\n")}`);
    }

    // 5. Verify hash for the valid remaining petitions
    for (const petition of petitionsData) {
      if (deletedIds.includes(petition.id)) continue;

      try {
        console.log("Verifying petition id:", petition.id);
        const petitionIdBytes = ethers.utils.formatBytes32String(petition.id);
        const onChainHash = await contract.getPetitionHash(petitionIdBytes);

        const { title, description, createdBy } = petition;
        const payload = JSON.stringify({ title, description, createdBy });

        const recomputedHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payload));
        console.log(recomputedHash, ":", onChainHash);

        if (recomputedHash !== onChainHash) {
          corruptedIds.add(petition.id);
        }
      } catch (err) {
        console.error(`Verification error for ${petition.id}:`, err);
        corruptedIds.add(petition.id);
      }
    }

    // 6. Filter and update state
    setCorruptedPetitionIds(corruptedIds);
    setActivePetitions(
      petitionsData.filter((p) => p.active && !corruptedIds.has(p.id) && !deletedIds.includes(p.id))
    );
    setCompletedPetitions(
      petitionsData.filter((p) => !p.active && !corruptedIds.has(p.id) && !deletedIds.includes(p.id))
    );
  } catch (error) {
    console.error("Error fetching petitions:", error);
    alert("Failed to load petitions.");
  }
};


    fetchAndVerifyPetitions();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handlePetitionClick = (petition) => {
    let statusMessage = "";

    if (!petition.active) {
      const approveVotes = petition.votes?.Approve || 0;
      const disapproveVotes = petition.votes?.Disapprove || 0;

      if (approveVotes > disapproveVotes) {
        statusMessage = "This petition has been approved.";
      } else if (approveVotes < disapproveVotes) {
        statusMessage = "This petition has been disapproved.";
      } else {
        statusMessage = "This petition is tied (Approve and Disapprove votes are equal).";
      }

      setModalData({
        message: statusMessage,
        results: null
      });
      setIsModalOpen(true);
    }
  };

  // Function to handle approve/disapprove action
  const handleVote = async (petition, voteType) => {
    if (!walletAddress) {
      alert("You must be logged in to vote.");
      return;
    }

    // Check if the user has already signed the petition
    if (petition.signedBy && petition.signedBy.includes(credentialHash)) {
      alert("You have already signed this petition.");
      return;
    }

    //interact with Blockchain
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
      const petitionIdBytes = ethers.utils.formatBytes32String(petition.id);
  
      const approve = voteType === "Approve";
      const tx = await contract.signPetition(petitionIdBytes, approve);
      console.log("signed petition : ",petitionIdBytes);
      await tx.wait(); // Wait for transaction to be mined
    } catch (error) {
      if (error.message.includes("Already voted")) {
        alert("You have already voted on this petition.");
      } else {
        console.error(error);
      }
    }

    // Add user to signedBy and update the vote count
    const petitionRef = doc(db, "petitions", petition.id);
    await updateDoc(petitionRef, {
      signedBy: arrayUnion(credentialHash), // Add user to signedBy array
      [`votes.${voteType}`]: (petition.votes?.[voteType] || 0) + 1 // Increment the vote
    });

    // Update the local state to reflect the change immediately
    setActivePetitions(prevPetitions =>
      prevPetitions.map(pet =>
        pet.id === petition.id
          ? { ...pet, votes: { ...pet.votes, [voteType]: (pet.votes?.[voteType] || 0) + 1 }, signedBy: [...(pet.signedBy || []), credentialHash] }
          : pet
      )
    );

    // Show confirmation alert
    alert(`You have ${voteType === "Approve" ? "approved" : "disapproved"} the petition.`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const publishResults = async (petitionId) => {
    try {
      setPublishingId(petitionId);
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);
  
      const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);
  
      console.log("Publishing results for Petition ID:", petitionIdBytes32);
  
      const tx = await contract.publishResults(petitionIdBytes32);
      console.log("Publishing results on-chain...");
      await tx.wait();
      console.log("Transaction confirmed");
  
      await updateDoc(doc(db, "petitions", petitionId), {
        active: false
      });
  
      setPetitions((prev) =>
        prev.map((p) =>
          p.id === petitionId ? { ...p, active: false } : p
        )
      );
      alert("Results published!");
    } catch (err) {
      console.error("Error publishing results:", err);
  
      // Extract revert reason
      let message = "Failed to publish results.";
      if (err?.error?.data?.message) {
        const match = err.error.data.message.match(/reverted with reason string '(.*?)'/);
        if (match && match[1]) {
          message = match[1];
        }
      } else if (err?.reason) {
        message = err.reason;
      }
  
      alert(message);
    } finally {
      setPublishingId(null);
    }
  };
  

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>All Petitions</h2>

      {/* Active Petitions */}
      <h3>Active Petitions</h3>
      {activePetitions.length === 0 ? (
        <p>No active petitions available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {activePetitions.map((petition) => (
            <li key={petition.id}>
              <div
              	onClick={()=> toggleExpand(petition.id)}
                style={{
                  marginBottom: "0.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "#f0f0f0",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
                >
                {petition.title}
                {/* Show approval/disapproval buttons if not signed */}
                {expandedId === petition.id && (
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <p><strong>Description:</strong> {petition.description}</p>
                  <p><strong>Created:</strong> {petition.createdAt?.toDate().toLocaleString() || "N/A"}</p>

                  {/* Options and Votes */}
                  <div style={{ marginTop: "1rem", textAlign: "left" }}>
                    <ul style={{ paddingLeft: "1rem" }}>
                      {/* Static options: Approve, Disapprove */}
                      {!petition.signedBy || !petition.signedBy.includes(credentialHash) ? (
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      onClick={() => handleVote(petition, "Approve")}
                      style={{ marginRight: "10px" }}
                    >
                      Approve
                    </button>
                    <button onClick={() => handleVote(petition, "Disapprove")}>
                      Disapprove
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: "1rem", color: "green" }}>
                    <strong>You have already signed this petition.</strong>
                  </div>
                )}
                    </ul>
                  </div>

                  {/* Status and Publish Results */}
                  <p>
                    Status:{" "}
                    <strong style={{ color: petition.active ? "green" : "gray" }}>
                      {petition.active ? "Active" : "Completed"}
                    </strong>
                  </p>

                  {petition.active && (
                    <button onClick={() => publishResults(petition.id)}>
                      Publish Results
                    </button>
                  )}
                </div>
              )}
                
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Completed Petitions */}
      <h3>Completed Petitions</h3>
      {completedPetitions.length === 0 ? (
        <p>No completed petitions available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {completedPetitions.map((petition) => (
            <li key={petition.id}>
              <div
                style={{
                  marginBottom: "0.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "#f0f0f0",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
                onClick={() => handlePetitionClick(petition)} // Handle petition click
              >
                {petition.title}
              </div>
            </li>
          ))}
        </ul>
      )}

    {corruptedPetitionIds.size > 0 && (
        <section style={{ marginTop: "2rem", color: "red" }}>
          <h3>Corrupted Petitions Detected</h3>
          <p>
            {[...corruptedPetitionIds].length} petition(s) failed hash
            verification and were excluded from the lists above.
          </p>
        </section>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{modalData.message || "Petition Results"}</h3>
            {modalData.results && <div>{modalData.results}</div>}
            <button style={styles.closeButton} onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={() => navigate("/home")}>Go to Home</button>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
  },
  closeButton: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#ff5722",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default AllPetitions;


