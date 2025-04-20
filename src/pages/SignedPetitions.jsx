import { useEffect, useState } from "react";
import { ethers } from "ethers";
import FactoryABI from "../contracts/PetitionFactory.json";
import PetitionABI from "../contracts/Petition.json";
import PetitionCard from "../components/PetitionCard";

const FACTORY_ADDRESS = "0x78585Df14927462F9c776E2f4472064a685c67a0"; // replace

const SignedPetitions = ({ address }) => {
  const [signed, setSigned] = useState([]);

  const loadSigned = async () => {
    if (!window.ethereum || !address) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const factory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI, signer);

    const signedAddrs = await factory.getUserSignedPetitions(address);

    const loaded = await Promise.all(
      signedAddrs.map(async (addr) => {
        const petition = new ethers.Contract(addr, PetitionABI, signer);
        const title = await petition.title();
        const description = await petition.description();
        const isLive = await petition.isLive();
        const petitionId = await petition.petitionId();
        return { petitionAddress: addr, title, description, isLive, petitionId };
      })
    );

    setSigned(loaded);
  };

  useEffect(() => {
    loadSigned();
  }, [address]);

  return (
    <div>
      <h3>✍️ Signed Petitions</h3>
      {signed.map((p) => (
        <PetitionCard key={p.petitionId} petition={p} />
      ))}
    </div>
  );
};

export default SignedPetitions;
