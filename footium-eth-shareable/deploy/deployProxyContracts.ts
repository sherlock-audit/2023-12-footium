import "dotenv/config";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { MINTER_ROLE, deployProxyAndArtifact } from "../scripts/helpers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { utils } from "ethers";

const PLAYER_URI =
    process.env.PLAYER_URI ||
    "https://play-test.api.footium.club/api/nfts/players/";
const CLUB_URI =
    process.env.CLUB_URI ||
    "https://play-test.api.footium.club/api/nfts/clubs/";
// 5%
const ROYALTY_FEE_PERCENTAGE = 500;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    console.log("Deploying V1 contracts");

    const PrizeDistributor = await deployProxyAndArtifact(hre)(
        "FootiumPrizeDistributor"
    );

    console.log(
        "FootiumPrizeDistributor is successfully deployed, address: ",
        PrizeDistributor.address
    );

    await deployProxyAndArtifact(hre)("FootiumToken");
    console.log("FootiumToken is successfully deployed");

    const ClubContract = await deployProxyAndArtifact(hre)("FootiumClub", [
        PrizeDistributor.address,
        ROYALTY_FEE_PERCENTAGE,
        CLUB_URI
    ]);

    console.log(
        "ClubContract is successfully deployed, address: ",
        ClubContract.address
    );

    const FootiumGeneralPaymentContract = await deployProxyAndArtifact(hre)(
        "FootiumGeneralPaymentContract",
        [PrizeDistributor.address, ClubContract.address]
    );

    console.log(
        "FootiumGeneralPaymentContract is successfully deployed, address: ",
        FootiumGeneralPaymentContract.address
    );

    const PlayerContract = await deployProxyAndArtifact(hre)("FootiumPlayer", [
        PrizeDistributor.address,
        ROYALTY_FEE_PERCENTAGE,
        PLAYER_URI
    ]);

    console.log(
        "PlayerContract is successfully deployed, address: ",
        PlayerContract.address
    );

    const ClubMinterContract = await deployProxyAndArtifact(hre)(
        "FootiumClubMinter",
        [PlayerContract.address, ClubContract.address]
    );

    console.log(
        "ClubMinterContract is successfully deployed, address: ",
        ClubMinterContract.address
    );

    const AcademyContract = await deployProxyAndArtifact(hre)(
        "FootiumAcademy",
        [
            PlayerContract.address,
            ClubContract.address,
            PrizeDistributor.address,
            utils.formatBytes32String("INITIAL_ROOT")
        ]
    );

    console.log(
        "AcademyContract is successfully deployed, address: ",
        AcademyContract.address
    );

    await PlayerContract.grantRole(MINTER_ROLE, AcademyContract.address);

    await PlayerContract.grantRole(MINTER_ROLE, ClubMinterContract.address);

    await ClubContract.grantRole(MINTER_ROLE, ClubMinterContract.address);
};

export default func;
