import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, increment } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function AllPetitions() {
  const [petitions, setPetitions] = useState([]);
  const [voted, setVoted] = useState(() => {
    const stored = localStorage.getItem("votedPetitions");
    return stored ? JSON.parse(stored) : [];
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "petitions"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPetitions(data);
      } catch (err) {
        alert("Error fetching petitions. Check console.");
        console.error("Error:", err);
      }
    };

    fetchPetitions();
  }, []);

  const hasVoted = (petitionId) => voted.includes(petitionId);

  const vote = async (petitionId, option) => {
    if (hasVoted(petitionId)) {
      alert("You have already signed this petition. You can't sign a petition twice!");
      return;
    }

    try {
      const petitionRef = doc(db, "petitions", petitionId);
      await updateDoc(petitionRef, {
        [`votes.${option}`]: increment(1)
      });

      setVoted((prev) => {
        const updated = [...prev, petitionId];
        localStorage.setItem("votedPetitions", JSON.stringify(updated));
        return updated;
      });

      alert("Vote cast successfully!");
    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to cast vote.");
    }
  };

  const activePetitions = petitions.filter((p) => p.active);
  const completedPetitions = petitions.filter((p) => !p.active);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Active Petitions</h2>

      {activePetitions.length === 0 ? (
        <p>No active petitions.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {activePetitions.map((petition) => (
            <li key={petition.id}>
              <div
                style={{
                  marginBottom: "0.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "#e0f7fa",
                  fontWeight: "bold",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap"
                }}
              >
                <div>{petition.title}</div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => vote(petition.id, "Approve")}
                    disabled={hasVoted(petition.id)}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => vote(petition.id, "Disapprove")}
                    disabled={hasVoted(petition.id)}
                  >
                    Disapprove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ textAlign: "center", margin: "2rem 0 1rem" }}>Completed Petitions</h2>

      {completedPetitions.length === 0 ? (
        <p>No completed petitions yet.</p>
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
                  fontWeight: "bold"
                }}
              >
                {petition.title}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Go to Home Button */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={() => navigate("/home")}>Go to Home</button>
      </div>
    </div>
  );
}

export default AllPetitions;
