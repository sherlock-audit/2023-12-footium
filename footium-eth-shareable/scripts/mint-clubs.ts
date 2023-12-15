import { Actions, Domain } from "@simium/footium-engine";
import { deployments, getNamedAccounts } from "hardhat";
import fs from "fs";

const isClubCreatedAction = (
    action: Actions.Action
): action is Actions.ClubCreated => {
    return action.type === "CLUB_CREATED";
};
const isClubTransferAction = (
    action: Actions.Action
): action is Actions.ClubTransfer => {
    return action.type === "CLUB_TRANSFER";
};

const { execute } = deployments;

const footiumConfig: Domain.Config = JSON.parse(
    fs.readFileSync("./config.json", "utf8")
);

const main = async () => {
    const { deployer } = await getNamedAccounts();

    const owners: Record<string, string> = {};

    footiumConfig.initialActions.forEach(action => {
        if (isClubCreatedAction(action)) {
            owners[action.data.clubId] = deployer;
        } else if (isClubTransferAction(action)) {
            owners[action.data.clubId] = action.data.addressTo;
        }
    });

    console.log(owners);

    for (const [clubId, address] of Object.entries(owners)) {
        if (address) {
            try {
                console.log(
                    `Minting club ID: ${clubId}, from address ${deployer}, owner is ${address}`
                );

                // eslint-disable-next-line no-await-in-loop
                const result = await execute(
                    "FootiumClubMinter",
                    { from: deployer, log: true },
                    "mint",
                    address,
                    clubId
                );

                console.log(
                    `Minted with transaction hash ${result.transactionHash}`
                );

                console.log(
                    `Transaction was mined in block ${result.blockNumber}`
                );
            } catch (error: any) {
                if (
                    "reason" in error &&
                    error.reason ===
                        "Error: VM Exception while processing transaction: reverted with reason string 'ERC721: token already minted'"
                ) {
                    console.log("Token already minted");
                } else {
                    console.error(error);
                }
            }
        }
    }
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
