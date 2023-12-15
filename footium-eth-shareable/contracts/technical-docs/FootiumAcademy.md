# Footium Academy

## General Overview

The Footium Academy Smart Contract is used to allow Footium clubs to mint player
NFT's based on certain rules. Specifically, a club owner is only allowed to mint
players for their club. Moreover, only certain player IDs can be minted and a
player ID cannot be minted twice. Which player IDs can be minted and their
corresponding minting price is generated off-chain. This information is then
compiled into a Merkle Tree, of which the root is stored on the contract. This
contract also uses `Ownable` which allows for the root to be changed.

## Functions

### `initialize(IFootiumPlayer footiumPlayer, IFootiumClub footiumClub, address prizeDistributorAddress, bytes32 merkleRoot) external initializer`

This function initialises the `FootiumAcademy` contract. The contract owner can
specify the following parameters:

-   `footiumPlayer`: Footium Players contract address.
-   `footiumClub`: Footium Clubs contract address.
-   `prizeDistributorAddress`: `FootiumPrizeDistributor` contract address.
-   `merkleRoot`: The Merkle Root against which the clubId, playerId and price
    will be checked.

### `changeMerkleRoot(bytes32 _merkleRoot) external onlyOwner`

This function changes the `_merkleRoot` variable. This function can only
be executed by the owner of the contract.

### `activateContract() external onlyOwner`

This function unpauses the contract. This function can only be executed by the
owner of the contract.

### `pauseContract() external onlyOwner`

This function pauses the contract. This function can only be executed by the
owner of the contract.

### `mintPlayers(uint256 clubId, string calldata playerId, bytes32[] calldata mintProof) external payable whenNotPaused nonReentrant`

This function mints players for a club based on certain rules. A club owner can
only mint players for their club. Only certain player IDs can be minted, and a
player ID cannot be minted twice. The function parameters are as follows:

-   `clubId`: The ID of the club to be minting an academy player for. The caller
    of this function must own the club with this ID.
-   `playerId`: The playerId to be minted.
-   `mintProof`: Sibling hashes on the branch from the leaf to the division root of
    the merkel tree. This proves that the `clubId` can mint the player with
    `playerId` for the passed in value. This makes sure that the fee being charged is correct.

### `withdraw() external onlyOwner`

This function transfers the contract available ether balance to the contact
owner address. This function can only be executed by the owner of the contract.
