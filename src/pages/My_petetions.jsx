import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { ethers } from "ethers";
import PetitionContractABI from "../abis/PetitionContract.json"; 
const CONTRACT_ADDRESS = "0x7539b55c328e343c1c9a900d6367d93036ad57e8"; 

function CreatedPetitions() {
  const [petitions, setPetitions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();  // Get the current location

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (!user) {
          console.error("No user logged in");
          return;
        }
  
        const q = query(
          collection(db, "petitions"),
          where("createdBy", "==", user.uid) // or user.email if you're storing email
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPetitions(data);
        setLoading(false);
      } catch (err) {
        alert("Error fetching petitions. Check console.");
        console.error("Error:", err);
      }
    };
  
    fetchPetitions();
  }, []);

  const publishResults = async (petitionId) => {
    try {
      setPublishingId(petitionId);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PetitionContractABI, signer);

      const petitionIdBytes32 = ethers.utils.formatBytes32String(petitionId);

      // Step 1: Call smart contract to publish results
      console.log("Petitionid : ",petitionIdBytes32);
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
      alert("Failed to publish results. Ensure you're the petition creator.");
    } finally {
      setPublishingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleBackClick = () => {
    if (expandedId !== null) {
      // If viewing a specific petition, go back to the petition list
      setExpandedId(null);
    } else {
      // If on the petition list page, navigate to home page
      navigate("/home");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Your Petitions</h2>

      {loading ? (
        <p>Loading...</p>
      ) : petitions.length === 0 ? (
        <p>You haven't created any petitions.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {petitions.map((petition) => (
            <li key={petition.id}>
              <div
                onClick={() => toggleExpand(petition.id)}
                style={{
                  cursor: "pointer",
                  marginBottom: "0.5rem",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "#e0f7fa",
                  fontWeight: "bold"
                }}
              >
                {petition.title}
              </div>

              {expandedId === petition.id && (
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <p><strong>Description:</strong> {petition.description}</p>
                  <p><strong>Created:</strong> {petition.createdAt?.toDate().toLocaleString() || "N/A"}</p>

                  {/* Options and Votes */}
                  <div style={{ marginTop: "1rem", textAlign: "left" }}>
                    <p><strong>Options & Votes:</strong></p>
                    <ul style={{ paddingLeft: "1rem" }}>
                      {/* Static options: Approve, Disapprove */}
                      {["Approve", "Disapprove"].map((opt) => (
                        <li key={opt}>
                          {opt} — <strong>{petition.votes?.[opt] || 0} vote{petition.votes?.[opt] !== 1 ? "s" : ""}</strong>
                        </li>
                      ))}
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
            </li>
          ))}
        </ul>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        {/* Back Button */}
        <button
          onClick={handleBackClick} // Handle back click behavior
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default CreatedPetitions;
