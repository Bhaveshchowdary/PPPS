import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { ethers } from "ethers";
import PetitionContractABI from "../abis/PetitionContract.json"; 
const CONTRACT_ADDRESS = "0x160c59da423ff698ce4512941432ee755dc2861b"; 

function SignedPetitions() {
  const [signedPetitions, setSignedPetitions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSignedPetitions = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to view signed petitions.");
        return;
      }

      try {
        // Fetch signed petitions from Firebase
        const petitionsRef = collection(db, "petitions");
        const q = query(petitionsRef, where("signedBy", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);

        const filteredPetitions = [];

        for (const docSnap of querySnapshot.docs) {
          const petition = { id: docSnap.id, ...docSnap.data() };
          const petitionIdBytes32 = ethers.utils.formatBytes32String(petition.id);

          // Verify hash
          const payload = JSON.stringify({
            title: petition.title,
            description: petition.description,
            createdBy: petition.createdBy,
          });
          const recomputedHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payload));
          const onChainHash = await contract.getPetitionHash(petitionIdBytes32);

          if (onChainHash !== recomputedHash) {
            console.warn(`⚠ Petition data tampered: ${petition.id}`);
            continue; // skip corrupted petition
          }

          // Verify that user is a real on-chain voter
          const voters = await contract.getVoters(petitionIdBytes32);
          const userAddress = await signer.getAddress();

          const hasVoted = voters.map(a => a.toLowerCase()).includes(userAddress.toLowerCase());
          if (!hasVoted) {
            console.warn(`⚠ Firebase signedBy corrupted for ${petition.id}`);
            continue; // skip fake signed entries
          }

          filteredPetitions.push(petition);
        }

        setSignedPetitions(filteredPetitions);
      } catch (error) {
        console.error("Error verifying signed petitions:", error);
        alert("Failed to verify signed petitions.");
      }
    };

    fetchSignedPetitions();
  }, []);

  // Function to handle petition click and open the modal
  const handlePetitionClick = (petition) => {
    let statusMessage = "";

    if (petition.active) {
      statusMessage = "This petition is still running.";
      setModalData({
        message: statusMessage,
        results: null
      });
    } else {
      // Determine approval status based on votes
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
    }

    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Signed Petitions</h2>

      {signedPetitions.length === 0 ? (
        <p>You haven't signed any petitions yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {signedPetitions.map((petition) => (
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
  }
};

export default SignedPetitions;
