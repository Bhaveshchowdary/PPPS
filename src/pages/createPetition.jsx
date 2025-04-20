// src/pages/CreatePetition.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import FactoryABI from "../contracts/PetitionFactory.json";

const FACTORY_ADDRESS = "0xYourFactoryAddress"; // replace with your deployed address

const CreatePetition = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!title || !description) return alert("Please fill all fields");

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI, signer);

      const tx = await factory.createPetition(title, description);
      const receipt = await tx.wait();

      // 🧠 Get the created petition address from event
      const event = receipt.logs.find((log) =>
        log.fragment?.name === "PetitionCreated"
      );

      if (!event) {
        alert("❌ Failed to get created petition.");
        return;
      }

      const petitionId = await factory.petitionCounter() - 1;
      navigate(`/petition/${petitionId}`);
    } catch (err) {
      console.error(err);
      alert("❌ Error creating petition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create a New Petition</h2>
      <input
        type="text"
        placeholder="Petition Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Petition Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Petition"}
      </button>
    </div>
  );
};

export default CreatePetition;
