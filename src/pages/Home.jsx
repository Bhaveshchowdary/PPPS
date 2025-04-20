import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PetitionFactoryABI from "../contracts/PetitionFactory.json";
import PetitionABI from "../contracts/Petition.json";
import PetitionCard from "../components/PetitionCard";

const FACTORY_ADDRESS = "0x78585Df14927462F9c776E2f4472064a685c67a0"; 

const Home = ({ address }) => {
  const [petitions, setPetitions] = useState([]);

  const loadPetitions = async () => {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const factory = new ethers.Contract(FACTORY_ADDRESS, PetitionFactoryABI, signer);
    
    const petitionContracts = await factory.getAllPetitions();

    const loaded = await Promise.all(
      petitionContracts.map(async (petitionAddress) => {
        const petition = new ethers.Contract(petitionAddress, PetitionABI, signer);
        const title = await petition.title();
        const description = await petition.description();
        const isLive = await petition.isLive();
        const petitionId = await petition.petitionId();
        return { petitionAddress, title, description, isLive, petitionId };
      })
    );

    setPetitions(loaded);
  };

  useEffect(() => {
    loadPetitions();
  }, [address]);

  return (
    <div className="petition-list">
      <h3>📋 All Petitions</h3>
      {petitions.map((p) => (
        <PetitionCard key={p.petitionId} petition={p} />
      ))}
    </div>
  );
};

export default Home;
