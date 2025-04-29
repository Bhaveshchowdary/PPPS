import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import PetitionContractABI from "../abis/PetitionContract.json"; 
const CONTRACT_ADDRESS = "0x4c9ad2b2e91085231599d3c3a06a8e1431feeb08"; 


function AllPetitions() {
  const [activePetitions, setActivePetitions] = useState([]);
  const [completedPetitions, setCompletedPetitions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        // Fetch all petitions
        const petitionsRef = collection(db, "petitions");
        const querySnapshot = await getDocs(petitionsRef);

        const petitionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Separate active and completed petitions
        const active = petitionsData.filter(petition => petition.active);
        const completed = petitionsData.filter(petition => !petition.active);

        setActivePetitions(active);
        setCompletedPetitions(completed);
      } catch (error) {
        console.error("Error fetching petitions:", error);
        alert("Failed to load petitions.");
      }
    };

    fetchPetitions();
  }, []);

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
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to vote.");
      return;
    }

    // Check if the user has already signed the petition
    if (petition.signedBy && petition.signedBy.includes(user.uid)) {
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
      await tx.wait(); // Wait for transaction to be mined
    } catch (err) {
      console.error("Blockchain error:", err);
      alert("Blockchain vote failed. Try again.");
      return;
    }

    // Add user to signedBy and update the vote count
    const petitionRef = doc(db, "petitions", petition.id);
    await updateDoc(petitionRef, {
      signedBy: arrayUnion(user.uid), // Add user to signedBy array
      [`votes.${voteType}`]: (petition.votes?.[voteType] || 0) + 1 // Increment the vote
    });

    // Update the local state to reflect the change immediately
    setActivePetitions(prevPetitions =>
      prevPetitions.map(pet =>
        pet.id === petition.id
          ? { ...pet, votes: { ...pet.votes, [voteType]: (pet.votes?.[voteType] || 0) + 1 }, signedBy: [...(pet.signedBy || []), user.uid] }
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
                {/* Show approval/disapproval buttons if not signed */}
                {!petition.signedBy || !petition.signedBy.includes(getAuth().currentUser?.uid) ? (
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
