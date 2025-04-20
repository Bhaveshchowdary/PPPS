import React from "react";
import { useNavigate } from "react-router-dom";

const PetitionCard = ({ petition }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/petition/${petition.petitionId}`, {
      state: petition
    });
  };

  return (
    <div onClick={handleClick} className="card">
      <h4>{petition.title}</h4>
      <p>{petition.description}</p>
      <p>ID: {petition.petitionId}</p>
      <p className={petition.isLive ? "" : "red"}>
  Status: {petition.isLive ? "🟢 Live" : "🔴 Ended"}
</p>

    </div>
  );
};

export default PetitionCard;
