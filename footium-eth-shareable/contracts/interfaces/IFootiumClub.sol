// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface IFootiumClub is IERC721Upgradeable {
    function safeMint(address to, uint256 tokenId) external;
}
