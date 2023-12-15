import "@nomiclabs/hardhat-ethers";
import { BigNumber, Contract } from "ethers";
import { MINTER_ROLE, deployProxy } from "../scripts/helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "hardhat";
import { expect } from "chai";

type LeafData = [number, string, BigNumber];

describe("Footium Academy Contract", () => {
    let academy: Contract,
        addr1: SignerWithAddress,
        allowedMints: LeafData[] = [],
        distributor: Contract,
        merkleTree: StandardMerkleTree<LeafData>,
        owner: SignerWithAddress,
        players: Contract;
    const firstClubId = 1;
    const secondClubId = 7;

    before(async () => {
        allowedMints = [
            [firstClubId, "2-1-30", ethers.utils.parseEther("0.5")],
            [firstClubId, "2-1-19", ethers.utils.parseEther("0.2")],
            [secondClubId, "2-7-12", ethers.utils.parseEther("1")]
        ];

        merkleTree = StandardMerkleTree.of(allowedMints, [
            "uint256",
            "string",
            "uint256"
        ]);

        [owner, addr1] = await ethers.getSigners();

        const receiverAddress = addr1.address;
        // Hardcoded as we don't check/use it
        const receiverPercentage = 500;
        // Hardcoded as we don't check/use it
        const tokenURI = "SomeTokenURI";

        players = await deployProxy("FootiumPlayer", [
            receiverAddress,
            receiverPercentage,
            tokenURI
        ]);

        distributor = await deployProxy("FootiumPrizeDistributor");

        const clubs = await deployProxy("FootiumClub", [""]);

        academy = await deployProxy("FootiumAcademy", [
            players.address,
            clubs.address,
            distributor.address,
            merkleTree.root
        ]);
        await players.grantRole(MINTER_ROLE, academy.address);
        await clubs.grantRole(MINTER_ROLE, owner.address);

        await clubs.safeMint(addr1.address, firstClubId);
        await clubs.safeMint(addr1.address, secondClubId);
    });

    describe("Minting a player", () => {
        it("Should not be possible to mint a non-allowed player", async () => {
            const [allowedPlayer] = allowedMints;
            const [allowedClubId, allowedPlayerId, allowedPrice] =
                allowedPlayer;

            const proof = merkleTree.getProof(allowedPlayer);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(allowedClubId, allowedPlayerId, proof, {
                        value: ethers.utils.parseEther("0.05")
                    })
            ).to.be.revertedWith("Invalid proof");

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(secondClubId, allowedPlayerId, proof, {
                        value: allowedPrice
                    })
            ).to.be.revertedWith("Invalid proof");

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(allowedClubId, "X-X-XX", proof, {
                        value: allowedPrice
                    })
            ).to.be.revertedWith("Invalid proof");
        });

        it("Should be possible to mint an allowed player", async () => {
            const [allowedPlayer] = allowedMints;
            const [allowedClubId, allowedPlayerId, allowedPrice] =
                allowedPlayer;

            const proof = merkleTree.getProof(allowedPlayer);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(allowedClubId, allowedPlayerId, proof, {
                        value: allowedPrice
                    })
            ).to.not.reverted;
        });

        it("Should not be possible to mint an already minted player", async () => {
            const [allowedPlayer] = allowedMints;
            const [allowedClubId, allowedPlayerId, allowedPrice] =
                allowedPlayer;

            const proof = merkleTree.getProof(allowedPlayer);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(allowedClubId, allowedPlayerId, proof, {
                        value: allowedPrice
                    })
            ).to.be.revertedWith("Player already minted");
        });
    });

    describe("Changing the merkle root", () => {
        let newAllowedMints: LeafData[] = [],
            newMerkleTree: StandardMerkleTree<LeafData>;

        // eslint-disable-next-line require-await
        before(async () => {
            newAllowedMints = [
                [firstClubId, "3-1-30", ethers.utils.parseEther("0.5")],
                [firstClubId, "3-1-19", ethers.utils.parseEther("0.2")],
                [secondClubId, "3-7-12", ethers.utils.parseEther("1")]
            ];

            newMerkleTree = StandardMerkleTree.of(newAllowedMints, [
                "uint256",
                "string",
                "uint256"
            ]);
        });

        it("Should not be possible to change the merkle root if caller is not the contract owner", async () => {
            await expect(
                academy.connect(addr1).changeMerkleRoot(merkleTree.root)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should be possible to change the merkle root if caller is the contract owner", async () => {
            await expect(academy.changeMerkleRoot(newMerkleTree.root))
                .to.emit(academy, "ChangedMerkleRoot")
                .withArgs(newMerkleTree.root);
        });

        it("Should not be possible to mint a player with the old merkle root", async () => {
            const [_, allowedPlayer] = allowedMints;
            const [allowedClubId, allowedPlayerId, allowedPrice] =
                allowedPlayer;

            const proof = merkleTree.getProof(allowedPlayer);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(allowedClubId, allowedPlayerId, proof, {
                        value: allowedPrice
                    })
            ).to.be.revertedWith("Invalid proof");
        });

        it("Should be possible to mint a player with the new merkle root", async () => {
            const [allowedPlayer] = newAllowedMints;
            const [allowedClubId, allowedPlayerId, allowedPrice] =
                allowedPlayer;

            const proof = newMerkleTree.getProof(allowedPlayer);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayer(allowedClubId, allowedPlayerId, proof, {
                        value: allowedPrice
                    })
            ).to.not.reverted;
        });
    });

    context("Pausable", () => {
        it("should fail to pause the contract if caller is not the contract owner", async () => {
            await expect(
                academy.connect(addr1).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully pause the contract", async () => {
            await expect(academy.pauseContract())
                .to.emit(academy, "Paused")
                .withArgs(owner.address);
        });

        it("should fail to activate the contract if caller is not the contract owner", async () => {
            await expect(
                academy.connect(addr1).activateContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("should successfully activate the contract", async () => {
            await expect(academy.activateContract())
                .to.emit(academy, "Unpaused")
                .withArgs(owner.address);
        });
    });

    context("withdraw available ETH from the contract", () => {
        it("fails to withdraw if caller is not the contract owner", async () => {
            await expect(academy.connect(addr1).withdraw()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("successfully withdraws available ETH from the contract", async () => {
            const contractBalanceBefore = await ethers.provider.getBalance(
                academy.address
            );
            const ownerBalanceBefore = await ethers.provider.getBalance(
                owner.address
            );

            const tx = await academy.withdraw();
            const receipt = await tx.wait();
            const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            const contractBalanceAfter = await ethers.provider.getBalance(
                academy.address
            );
            const ownerBalanceAfter = await ethers.provider.getBalance(
                owner.address
            );

            expect(contractBalanceAfter.toString()).to.equal("0");
            expect(
                ownerBalanceAfter.sub(ownerBalanceBefore).toString()
            ).to.equal(contractBalanceBefore.sub(fee).toString());
        });
    });
});
