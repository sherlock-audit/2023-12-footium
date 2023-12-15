import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { MINTER_ROLE, ZERO_ADDRESS, deployProxy } from "../scripts/helpers";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Footium Player Contract", () => {
    let feeReceiver: SignerWithAddress,
        minter: SignerWithAddress,
        owner: SignerWithAddress,
        players: Contract,
        receiverPercentage: number,
        tokenBaseURI: string;

    before(async () => {
        [owner, minter, feeReceiver] = await ethers.getSigners();

        // Hardcoded as we don't check/use it
        receiverPercentage = 500;
        // Hardcoded as we don't check/use it
        tokenBaseURI = "SomeTokenURI/";

        players = await deployProxy("FootiumPlayer", [
            feeReceiver.address,
            receiverPercentage,
            tokenBaseURI
        ]);

        await players.grantRole(MINTER_ROLE, minter.address);
    });

    context("Initialized", () => {
        it("has correct initial values", async () => {
            // Check default royalty info
            const salePrice = 1000;
            const [feeReceiverAddress, feeAmount] = await players.royaltyInfo(
                1,
                salePrice
            );
            const expectedFee = (salePrice * receiverPercentage) / 10000;

            expect(feeReceiverAddress).to.equal(feeReceiverAddress);
            expect(feeAmount.toString()).to.equal(expectedFee.toString());

            // Check current role
            expect(await players.hasRole(MINTER_ROLE, minter.address)).to.equal(
                true
            );
        });
    });

    context("RoyaltyInfo", () => {
        it("should fail if caller is not the contract owner", async () => {
            const newFeeReceiver = minter.address;
            // 7%
            const newFeePercentage = 700;

            await expect(
                players
                    .connect(minter)
                    .setRoyaltyInfo(newFeeReceiver, newFeePercentage)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully update the royalty info", async () => {
            const newFeeReceiver = minter.address;
            // 7%
            const newReceiverPercentage = 700;

            await players.setRoyaltyInfo(newFeeReceiver, newReceiverPercentage);

            const tokenId = 8;
            const salePrice = 1000;
            const [feeReceiverAddress, feeAmount] = await players.royaltyInfo(
                tokenId,
                salePrice
            );
            const expectedFee = (salePrice * newReceiverPercentage) / 10000;

            expect(feeReceiverAddress).to.equal(newFeeReceiver);
            expect(feeAmount.toString()).to.equal(expectedFee.toString());

            // Revert
            await players.setRoyaltyInfo(
                feeReceiver.address,
                receiverPercentage
            );
        });
    });

    context("Pausable", () => {
        it("should fail to pause the contract if caller is not the contract owner", async () => {
            await expect(
                players.connect(minter).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully pause the contract", async () => {
            await expect(players.pauseContract())
                .to.emit(players, "Paused")
                .withArgs(owner.address);
        });

        it("should fail to activate the contract if caller is not the contract owner", async () => {
            await expect(
                players.connect(minter).activateContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully activate the contract", async () => {
            await expect(players.activateContract())
                .to.emit(players, "Unpaused")
                .withArgs(owner.address);
        });
    });

    context("safeMint", () => {
        it("should fail to mint player if caller has no minter role", async () => {
            await expect(players.safeMint(feeReceiver.address)).to.be.reverted;
        });

        it("should fail to mint player contract is paused", async () => {
            await players.pauseContract();

            await expect(
                players.connect(minter).safeMint(feeReceiver.address)
            ).to.be.revertedWith("Pausable: paused");

            await players.activateContract();
        });

        it("should successfully mint a token", async () => {
            const tokenId = 0;

            await expect(players.connect(minter).safeMint(feeReceiver.address))
                .to.emit(players, "Transfer")
                .withArgs(ZERO_ADDRESS, feeReceiver.address, tokenId);

            // Check default token URI
            let uri = await players.tokenURI(tokenId);

            expect(uri).to.equal(`${tokenBaseURI}${tokenId}`);

            // Token base URI cannot be updated by non-owner
            const newTokenBaseURI = "NewTokenURI/";

            await expect(
                players.connect(minter).setBaseURI(newTokenBaseURI)
            ).to.be.revertedWith("Ownable: caller is not the owner");

            // Successfully update token base URI by contract owner
            await players.setBaseURI(newTokenBaseURI);

            uri = await players.tokenURI(tokenId);
            expect(uri).to.equal(`${newTokenBaseURI}${tokenId}`);
        });
    });

    context("supportsInterface", () => {
        it("should support ERC2981 interface", async () => {
            const erc2981InterfaceId = "0x2a55205a";

            const result = await players.supportsInterface(erc2981InterfaceId);

            expect(result).to.equal(true);
        });
    });
});
