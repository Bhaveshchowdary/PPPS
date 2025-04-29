// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract PetitionContract {
    struct Petition {
    bytes32 hash;
    bool exists;
    address[] voters;
    uint256 approvedVotes;
    uint256 disapprovedVotes;
    }

    mapping(bytes32 => Petition) public petitions;         // <--- changed uint256 to bytes32
    mapping(bytes32 => address[]) public petitionVotes;     // <--- changed uint256 to bytes32

    event PetitionCreated(bytes32 petitionId, bytes32 hash);
    event PetitionSigned(bytes32 petitionId, address voter);
    bytes32[] public allPetitionIds;

    // Store petition hash
    function createPetition(bytes32 petitionId, bytes32 petitionHash) public {
        require(!petitions[petitionId].exists, "Petition already exists");
        Petition storage newPetition = petitions[petitionId];
        newPetition.hash = petitionHash;
        newPetition.exists = true;
        newPetition.approvedVotes = 0;
        newPetition.disapprovedVotes = 0;
        // voters[] is automatically initialized as empty

        allPetitionIds.push(petitionId);
        emit PetitionCreated(petitionId, petitionHash);
    }

    // Retrieve petition hash
    function getPetitionHash(bytes32 petitionId) public view returns (bytes32) {
        require(petitions[petitionId].exists, "Petition does not exist");
        return petitions[petitionId].hash;
    }

    // Record a vote
    function signPetition(bytes32 petitionId, bool approve) public {
        require(petitions[petitionId].exists, "Petition does not exist");
        Petition storage petition = petitions[petitionId];
        // Prevent double voting
       
        for (uint256 i = 0; i < petition.voters.length; i++) {
            require(petition.voters[i] != msg.sender, "Already voted");
        }

        petition.voters.push(msg.sender);

        if (approve) {
            petition.approvedVotes += 1;
        } else {
            petition.disapprovedVotes += 1;
        }

        emit PetitionSigned(petitionId, msg.sender);
    }

    // Get voters list
    function getVoters(bytes32 petitionId) public view returns (address[] memory) {
        return petitionVotes[petitionId];
    }
}
