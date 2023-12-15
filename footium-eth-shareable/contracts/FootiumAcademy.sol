// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {MerkleProofUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IFootiumPlayer} from "./interfaces/IFootiumPlayer.sol";
import {IFootiumClub} from "./interfaces/IFootiumClub.sol";
import "./common/Errors.sol";

error PlayerAlreadyRedeemed(string playerId);

/**
 * @title Footium Football Academy
 * @notice An NFT football academy.
 */
contract FootiumAcademy is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    /* Storage */
    IFootiumPlayer private _footiumPlayer;
    IFootiumClub private _footiumClub;
    address private _prizeDistributorAddress;
    // @dev Mapping to keep track of minted players
    mapping(string => bool) private _mintedPlayers;
    // @dev Merkle root to verify minting proofs
    bytes32 private _merkleRoot;

    /* Events */
    event ChangedMerkleRoot(bytes32 merkleRoot);
    event AcademyPlayerMinted(
        uint256 indexed clubId,
        uint256 indexed assetId,
        string playerId,
        uint256 mintPrice
    );

    /**
     * @dev Initializes the FootiumAcademy contract.
     * @param footiumPlayer Footium Players contract address.
     * @param footiumClub Footium Clubs contract address.
     * @param prizeDistributorAddress FootiumPrizeDistributor contract address.
     */
    function initialize(
        IFootiumPlayer footiumPlayer,
        IFootiumClub footiumClub,
        address prizeDistributorAddress,
        bytes32 merkleRoot
    ) external initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();

        _footiumPlayer = footiumPlayer;
        _footiumClub = footiumClub;
        _prizeDistributorAddress = prizeDistributorAddress;
        _merkleRoot = merkleRoot;
    }

    /**
     * @notice Changes the `_merkleRoot` storage variable.
     * @param merkleRoot The new value for the `_merkleRoot` storage variable.
     * @dev Only owner address allowed.
     */
    function changeMerkleRoot(bytes32 merkleRoot) public onlyOwner {
        _merkleRoot = merkleRoot;
        emit ChangedMerkleRoot(_merkleRoot);
    }

    /**
     * @notice Unpause the contract
     * @dev Only owner address allowed.
     */
    function activateContract() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Pause the contract
     * @dev Only owner address allowed.
     */
    function pauseContract() external onlyOwner {
        _pause();
    }

    /**
     * @notice Mint a player.
     * @param clubId The ID of the club to receive the players.
     * @param playerId The ID of the player to be minted.
     * @param mintProof The proof that a certain player can be minted.
     * @dev Only the owner can mint players to their club.
     */
    function mintPlayer(
        uint256 clubId,
        string calldata playerId,
        bytes32[] calldata mintProof
    ) external payable whenNotPaused nonReentrant {
        // Ensures that the player has not been minted before
        require(_mintedPlayers[playerId] == false, "Player already minted");

        // Ensures that the wallet performing the mint is the owner of the club
        // to which the player is being minted
        if (msg.sender != _footiumClub.ownerOf(clubId)) {
            revert NotClubOwner(clubId, msg.sender);
        }

        // Construct the leaf node to verify the proof
        // The leaf node is constructed by concatenating the keccak256 hash of
        // the clubId, playerId and the mint price
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(clubId, playerId, msg.value)))
        );

        // Verify the proof
        require(
            MerkleProofUpgradeable.verify(mintProof, _merkleRoot, leaf),
            "Invalid proof"
        );

        // Mint the player
        uint256 playerAssetId = _footiumPlayer.safeMint(
            _footiumClub.ownerOf(clubId)
        );

        // Mark the player as minted
        _mintedPlayers[playerId] = true;

        emit AcademyPlayerMinted(clubId, playerAssetId, playerId, msg.value);

        // forward total fee to the prize distributor contract
        (bool sent, ) = _prizeDistributorAddress.call{value: msg.value}("");
        if (!sent) {
            revert FailedToSendETH(msg.value);
        }
    }

    /**
     * @notice Transfers contract available ether balance to the contact owner address
     * @dev Only owner address allowed
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool sent, ) = payable(owner()).call{value: balance}("");
            if (!sent) {
                revert FailedToSendETH(balance);
            }
        }
    }
}
