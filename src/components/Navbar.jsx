// import React from "react";

// const Navbar = ({ address, onLogout }) => {
//   return (
//     <div className="navbar">
//       <h2>🗳️ Petition DApp</h2>
//       {address ? (
//         <div className="profile">
//           <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
//           <div className="dropdown">
//             <button onClick={() => onLogout()}>Logout</button>
//             <button onClick={() => window.location.href = "/signed"}>Signed Petitions</button>
//             <button onClick={() => window.location.href = "/created"}>Created Petitions</button>
//           </div>
//         </div>
//       ) : (
//         <button onClick={window.connectWallet}>Connect Wallet</button>
//       )}
//     </div>
//   );
// };

// export default Navbar;


import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ethers } from "ethers";
import FactoryABI from "../contracts/PetitionFactory.json";

const FACTORY_ADDRESS = "0x78585Df14927462F9c776E2f4472064a685c67a0"; // update it

const Navbar = ({ address, onLogout }) => {
  const [searchId, setSearchId] = useState("");
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchId) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI, signer);

      const petitionAddress = await factory.petitionAddressById(searchId);

      if (petitionAddress === ethers.ZeroAddress) {
        alert("⚠️ Petition not found");
        return;
      }

      const petition = new ethers.Contract(petitionAddress, require("../contracts/Petition.json"), signer);
      const title = await petition.title();
      const description = await petition.description();
      const isLive = await petition.isLive();
      const petitionId = await petition.petitionId();

      navigate(`/petition/${petitionId}`, {
        state: {
          petitionAddress,
          title,
          description,
          isLive,
          petitionId,
        },
      });
    } catch (err) {
      console.error(err);
      alert("❌ Error searching petition");
    }
  };

  const handleLogout = () => {
    onLogout();
    setSearchId("");
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="logo">🗳️ Petition System</div>

      <div className="search">
        <input
          type="number"
          placeholder="Search by ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      <div className="profile">
        {address && (
          <>
            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
            <div className="dropdown">
              <button onClick={() => navigate("/")}>🏠 Home</button>
              <button onClick={() => navigate("/signed")}>Signed</button>
              <button onClick={() => navigate("/created")}>Created</button>
              <button onClick={() => navigate("/create")}>➕ Create</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

