import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
      await addDoc(collection(db, "petitions"), {
        title,
        description,
        options,  // Static options
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid, // Creator's UID
        votes: initialVotes,
        signedBy: [] // <-- Added signedBy array
      });

      alert("Petition created successfully!");
      navigate("/home");
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("Error creating petition:", err);
      alert("Failed to create petition.");
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
