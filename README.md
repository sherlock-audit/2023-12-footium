
# Footium contest details

- Join [Sherlock Discord](https://discord.gg/MABEWyASkp)
- Submit findings using the issue page in your private contest repo (label issues as med or high)
- [Read for more details](https://docs.sherlock.xyz/audits/watsons)

# Q&A

### Q: On what chains are the smart contracts going to be deployed?
Arbitrum
___

### Q: Which ERC20 tokens do you expect will interact with the smart contracts? 
Any
___

### Q: Which ERC721 tokens do you expect will interact with the smart contracts? 
Any
___

### Q: Do you plan to support ERC1155?
No
___

### Q: Which ERC777 tokens do you expect will interact with the smart contracts? 
None
___

### Q: Are there any FEE-ON-TRANSFER tokens interacting with the smart contracts?

None
___

### Q: Are there any REBASING tokens interacting with the smart contracts?

None
___

### Q: Are the admins of the protocols your contracts integrate with (if any) TRUSTED or RESTRICTED?
TRUSTED
___

### Q: Is the admin/owner of the protocol/contracts TRUSTED or RESTRICTED?
TRUSTED
___

### Q: Are there any additional protocol roles? If yes, please explain in detail:
N/A
___

### Q: Is the code/contract expected to comply with any EIPs? Are there specific assumptions around adhering to those EIPs that Watsons should be aware of?
None
___

### Q: Please list any known issues/acceptable risks that should not result in a valid finding.
N/A
___

### Q: Please provide links to previous audits (if any).
https://audits.sherlock.xyz/contests/71/report
___

### Q: Are there any off-chain mechanisms or off-chain procedures for the protocol (keeper bots, input validation expectations, etc)?
Creation of the club-division merkle root, prize distribution merkle root, academy merkle root are created off chain
___

### Q: In case of external protocol integrations, are the risks of external contracts pausing or executing an emergency withdrawal acceptable? If not, Watsons will submit issues related to these situations that can harm your protocol's functionality.
Yes it's acceptable
___

### Q: Do you expect to use any of the following tokens with non-standard behaviour with the smart contracts?
None
___

### Q: Add links to relevant protocol resources
All in README and documentation in the repo
___


# Audit scope


[footium-eth-shareable @ ceab427432cb651216dcad8fca2f87b624f2329e](https://github.com/logiclogue/footium-eth-shareable/tree/ceab427432cb651216dcad8fca2f87b624f2329e)
- [footium-eth-shareable/contracts/FootiumAcademy.sol](footium-eth-shareable/contracts/FootiumAcademy.sol)
- [footium-eth-shareable/contracts/FootiumClub.sol](footium-eth-shareable/contracts/FootiumClub.sol)
- [footium-eth-shareable/contracts/FootiumClubMinter.sol](footium-eth-shareable/contracts/FootiumClubMinter.sol)
- [footium-eth-shareable/contracts/FootiumGeneralPaymentContract.sol](footium-eth-shareable/contracts/FootiumGeneralPaymentContract.sol)
- [footium-eth-shareable/contracts/FootiumPlayer.sol](footium-eth-shareable/contracts/FootiumPlayer.sol)
- [footium-eth-shareable/contracts/FootiumPrizeDistributor.sol](footium-eth-shareable/contracts/FootiumPrizeDistributor.sol)
- [footium-eth-shareable/contracts/FootiumToken.sol](footium-eth-shareable/contracts/FootiumToken.sol)
- [footium-eth-shareable/contracts/common/Errors.sol](footium-eth-shareable/contracts/common/Errors.sol)
- [footium-eth-shareable/contracts/interfaces/IFootiumClub.sol](footium-eth-shareable/contracts/interfaces/IFootiumClub.sol)
- [footium-eth-shareable/contracts/interfaces/IFootiumPlayer.sol](footium-eth-shareable/contracts/interfaces/IFootiumPlayer.sol)

