import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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
        // Fetch petitions where user has signed
        const petitionsRef = collection(db, "petitions");
        const q = query(petitionsRef, where("signedBy", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);

        const signedPetitionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSignedPetitions(signedPetitionsData);
      } catch (error) {
        console.error("Error fetching signed petitions:", error);
        alert("Failed to load signed petitions.");
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
