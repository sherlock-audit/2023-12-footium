import { task } from "hardhat/config";

task("mint-club", "Mint a club")
    .addParam("account", "The account's address")
    .addParam("tokenid", "The token ID")
    .setAction(
        async ({ account, tokenid }, { deployments, getNamedAccounts }) => {
            try {
                const { execute } = deployments;
                const { deployer } = await getNamedAccounts();

                await execute(
                    "FootiumClubMinter",
                    { from: deployer, log: true },
                    "mint",
                    account,
                    tokenid
                );
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        }
    );
