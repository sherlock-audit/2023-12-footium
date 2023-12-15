import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import {
    MINTER_ROLE,
    ZERO_ADDRESS,
    constructETHPrizeMerkleTree,
    deployProxy,
    hashETHPrizeInputs
} from "../scripts/helpers";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("End To End testing", () => {
    let clubContract: Contract,
        clubMinterContract: Contract,
        clubOwner1: SignerWithAddress,
        clubOwner2: SignerWithAddress,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
        contractOwner: SignerWithAddress,
        feeReceiver: SignerWithAddress,
        playerContract: Contract,
        prizeDistributorContract: Contract,
        receiverPercentage,
        tokenBaseURI;

    before(async () => {
        [contractOwner, clubOwner1, clubOwner2, feeReceiver] =
            await ethers.getSigners();

        // Hardcoded as we don't check/use it
        receiverPercentage = 500;
        // Hardcoded as we don't check/use it
        tokenBaseURI = "SomeTokenURI/";

        // Deploy FootiumPlayer contract
        playerContract = await deployProxy("FootiumPlayer", [
            feeReceiver.address,
            receiverPercentage,
            tokenBaseURI
        ]);

        // Deploy FootiumClub contract
        clubContract = await deployProxy("FootiumClub", [tokenBaseURI]);

        // Deploy FootiumClubMinter contract
        clubMinterContract = await deployProxy("FootiumClubMinter", [
            playerContract.address,
            clubContract.address
        ]);

        // Deploy FootiumPrizeDistributor contract
        prizeDistributorContract = await deployProxy("FootiumPrizeDistributor");

        contractOwner.sendTransaction({
            to: prizeDistributorContract.address,
            value: ethers.utils.parseEther("10")
        });

        // Grant minter roles
        await playerContract.grantRole(MINTER_ROLE, clubMinterContract.address);
        await clubContract.grantRole(MINTER_ROLE, clubMinterContract.address);
    });

    it("should successfully mint a Footium club and starting squad of players", async () => {
        // Mint a Footium club for clubOwner address
        const clubId1 = 1;
        const clubId2 = 2;

        // Mint club with ID = 1 to clubOwner1 address
        await expect(clubMinterContract.mint(clubOwner1.address, clubId1))
            .to.emit(clubContract, "Transfer")
            .withArgs(ZERO_ADDRESS, clubOwner1.address, clubId1)
            .to.emit(playerContract, "Transfer");

        // Make sure clubOwner1 owns the club with ID = 1
        expect(await clubContract.ownerOf(clubId1)).to.be.equal(
            clubOwner1.address
        );

        let mintedPlayerCount = await playerContract.balanceOf(
            clubOwner1.address
        );

        // Make sure owner of club 1 owns 20 players of the club
        expect(mintedPlayerCount.toString()).to.be.equal("20");

        // Mint club with ID = 2 to clubOwner2 address
        await expect(clubMinterContract.mint(clubOwner2.address, clubId2))
            .to.emit(clubContract, "Transfer")
            .withArgs(ZERO_ADDRESS, clubOwner2.address, clubId2)
            .to.emit(playerContract, "Transfer");

        // Make sure clubOwner2 owns the club with ID = 2
        expect(await clubContract.ownerOf(clubId2)).to.be.equal(
            clubOwner2.address
        );

        mintedPlayerCount = await playerContract.balanceOf(clubOwner2.address);
        // Make sure owner of club 2 owns 20 players of the club
        expect(mintedPlayerCount.toString()).to.be.equal("20");
    });

    it("should successfully claimed the ETH prize by receiver address", async () => {
        // Create a merkle root with the prizes calculated above
        const totalAmount = ethers.utils
            .parseEther("1.7")
            .add(ethers.utils.parseEther("0.6"))
            .add(ethers.utils.parseEther("0.75"));

        const clubId1 = 1;
        const ownerAddress = await clubContract.ownerOf(clubId1);
        const ownerSigner = await ethers.getSigner(ownerAddress);

        const ethMerkleTree = constructETHPrizeMerkleTree([
            [ownerAddress, totalAmount]
        ]);

        await prizeDistributorContract.setETHMerkleRoot(
            ethMerkleTree.getHexRoot()
        );

        const leaf = hashETHPrizeInputs([ownerAddress, totalAmount]);
        const proof = ethMerkleTree.getHexProof(leaf);

        // Trying to claim the available prize by incorrect user - should fail
        await expect(
            prizeDistributorContract.claimETHPrize(
                clubOwner2.address,
                totalAmount,
                proof
            )
        ).to.be.revertedWithCustomError(
            prizeDistributorContract,
            "InvalidAccount"
        );

        const extraAmount = ethers.utils.parseEther("0.1");

        // Trying to claim prize with incorrect amount - should fail
        await expect(
            prizeDistributorContract
                .connect(ownerSigner)
                .claimETHPrize(
                    ownerAddress,
                    totalAmount.add(extraAmount),
                    proof
                )
        ).to.be.revertedWithCustomError(
            prizeDistributorContract,
            "InvalidETHMerkleProof"
        );

        // Claim the available prize by the designated user
        const balanceBefore = await ethers.provider.getBalance(ownerAddress);

        const tx = await prizeDistributorContract
            .connect(ownerSigner)
            .claimETHPrize(ownerAddress, totalAmount, proof);

        const balanceAfter = await ethers.provider.getBalance(ownerAddress);

        const receipt = await tx.wait();

        expect(receipt.events[0].event).to.equal("ClaimETH");
        expect(receipt.events[0].args[0]).to.equal(ownerAddress);
        expect(receipt.events[0].args[1].toString()).to.equal(
            totalAmount.toString()
        );

        const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        expect(balanceAfter.sub(balanceBefore).toString()).to.equal(
            totalAmount.sub(fee).toString()
        );

        // If the user tries to claim again, they will get 0
        await expect(
            prizeDistributorContract
                .connect(ownerSigner)
                .claimETHPrize(ownerAddress, totalAmount, proof)
        )
            .to.emit(prizeDistributorContract, "ClaimETH")
            .withArgs(ownerAddress, 0);
    });
});
