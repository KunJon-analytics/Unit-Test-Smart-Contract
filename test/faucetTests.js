const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");

describe("Faucet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const ONE_ETHER = hre.ethers.parseUnits("1", "ether");

    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy();

    const [owner, wrongOwner] = await ethers.getSigners();

    console.log("Signer 1 address: ", owner.address);
    console.log("Faucet address: ", faucet.target);
    return { faucet, owner, ONE_ETHER, wrongOwner };
  }

  it("should deploy and set the owner correctly", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it("should not allow withdrawals above .1 ETH at a time", async function () {
    const { faucet, ONE_ETHER } = await loadFixture(
      deployContractAndSetVariables
    );

    await expect(faucet.withdraw(ONE_ETHER)).to.be.reverted;
  });

  it("should revert if someone other than owner tries to withdraw all", async function () {
    const { faucet, wrongOwner } = await loadFixture(
      deployContractAndSetVariables
    );

    await expect(faucet.connect(wrongOwner).withdrawAll()).to.be.reverted;
  });

  it("should revert if someone other than owner tries to destroy", async function () {
    const { faucet, wrongOwner } = await loadFixture(
      deployContractAndSetVariables
    );

    await expect(faucet.connect(wrongOwner).destroyFaucet()).to.be.reverted;
  });

  it("should self destruct when the destroyFaucet is called", async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);

    await faucet.destroyFaucet();
    const destroyedCode = await hre.ethers.provider.getCode(faucet.target);

    expect(destroyedCode).to.equal("0x");
  });

  it("should return all of the ether held in the smart contract withdrawAll is called by owner", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    const contractBalance = await ethers.provider.getBalance(faucet.target);

    await expect(faucet.withdrawAll()).to.changeEtherBalances(
      [owner, faucet],
      [contractBalance, -contractBalance]
    );
  });
});
