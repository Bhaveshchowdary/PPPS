import { useEffect, useState } from "react";
import { ethers } from "ethers";
import FactoryABI from "../contracts/PetitionFactory.json";
import PetitionABI from "../contracts/Petition.json";

const FACTORY_ADDRESS = "0x78585Df14927462F9c776E2f4472064a685c67a0"; // replace

const CreatedPetitions = ({ address }) => {
  const [created, setCreated] = useState([]);

  const loadCreated = async () => {
    if (!window.ethereum || !address) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const factory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI, signer);

    const createdAddrs = await factory.getUserCreatedPetitions(address);

    const loaded = await Promise.all(
      createdAddrs.map(async (addr) => {
        const petition = new ethers.Contract(addr, PetitionABI, signer);
        const title = await petition.title();
        const description = await petition.description();
        const isLive = await petition.isLive();
        const count = await petition.signatureCount();
        const petitionId = await petition.petitionId();
        return { petitionAddress: addr, title, description, isLive, count, petitionId };
      })
    );

    setCreated(loaded);
  };

  const publishResults = async (petitionAddress) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const petition = new ethers.Contract(petitionAddress, PetitionABI, signer);
      const tx = await petition.publishResults();
      await tx.wait();
      alert("✅ Petition results published");
      loadCreated();
    } catch (err) {
      console.error(err);
      alert("❌ Error publishing results");
    }
  };

  useEffect(() => {
    loadCreated();
  }, [address]);

  return (
    <div>
      <h3>🛠️ Created Petitions</h3>
      {created.map((p) => (
        <div key={p.petitionId} className="card">
          <h4>{p.title}</h4>
          <p>{p.description}</p>
          <p>Status: {p.isLive ? "🟢 Live" : "🔴 Ended"}</p>
          <p>Signs: {p.count.toString()}</p>
          {p.isLive && (
            <button onClick={() => publishResults(p.petitionAddress)}>📢 Publish Results</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default CreatedPetitions;
