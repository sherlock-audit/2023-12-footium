import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { MINTER_ROLE, ZERO_ADDRESS, deployProxy } from "../scripts/helpers";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Footium Club Contract", () => {
    let clubs: Contract,
        minter: SignerWithAddress,
        owner: SignerWithAddress,
        receiver: SignerWithAddress,
        tokenBaseURI: string;

    before(async () => {
        [owner, minter, receiver] = await ethers.getSigners();

        // Hardcoded as we don't check/use it
        tokenBaseURI = "SomeTokenURI/";

        clubs = await deployProxy("FootiumClub", [tokenBaseURI]);

        await clubs.grantRole(MINTER_ROLE, minter.address);
    });

    context("Set token base URI", () => {
        it("should fail if caller is not the contract owner", async () => {
            const newBaseURI = "NewTokenURI/";

            await expect(
                clubs.connect(minter).setBaseURI(newBaseURI)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully update token base URI", async () => {
            const newBaseURI = "NewTokenURI/";

            await expect(clubs.setBaseURI(newBaseURI)).to.not.reverted;

            // Revert the original one
            await clubs.setBaseURI(tokenBaseURI);
        });
    });

    context("Pausable", () => {
        it("should fail to pause the contract if caller is not the contract owner", async () => {
            await expect(
                clubs.connect(minter).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully pause the contract", async () => {
            await expect(clubs.pauseContract())
                .to.emit(clubs, "Paused")
                .withArgs(owner.address);
        });

        it("should fail to activate the contract if caller is not the contract owner", async () => {
            await expect(
                clubs.connect(minter).activateContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully activate the contract", async () => {
            await expect(clubs.activateContract())
                .to.emit(clubs, "Unpaused")
                .withArgs(owner.address);
        });
    });

    context("safeMint", () => {
        it("should fail to mint player if caller has no minter role", async () => {
            const tokenId = 1;

            await expect(clubs.safeMint(receiver.address, tokenId)).to.be
                .reverted;
        });

        it("should fail to mint player contract is paused", async () => {
            const tokenId = 1;

            await clubs.pauseContract();

            await expect(
                clubs.connect(minter).safeMint(receiver.address, tokenId)
            ).to.be.revertedWith("Pausable: paused");

            await clubs.activateContract();
        });

        it("should successfully mint a token", async () => {
            const tokenId = 1;

            await expect(
                clubs.connect(minter).safeMint(receiver.address, tokenId)
            )
                .to.emit(clubs, "Transfer")
                .withArgs(ZERO_ADDRESS, receiver.address, tokenId);

            // Check default token URI
            const uri = await clubs.tokenURI(tokenId);

            expect(uri).to.equal(`${tokenBaseURI}${tokenId}`);
        });
    });
});
