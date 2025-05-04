const PetitionContract = artifacts.require("PetitionContract");

module.exports = function (deployer) {
  deployer.deploy(PetitionContract);
};