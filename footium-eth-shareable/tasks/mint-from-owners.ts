import { Address } from "hardhat-deploy/types";
import clubMinterAbi from "./club-minter-abi.json";
import { readFileSync } from "fs";
import { task } from "hardhat/config";

task(
    "mint-from-owners",
    "Mints new clubs based on the owners of the old contract"
)
    .addPositionalParam("address", "The contract's address")
    .addPositionalParam("inputFile", "Path for the input file")
    .setAction(async ({ address, inputFile }, { ethers }) => {
        const owners: Record<string, Address> = JSON.parse(
            readFileSync(inputFile, "utf-8")
        );

        const { provider } = ethers;
        const signer = provider.getSigner();

        const minterContract = new ethers.Contract(
            address,
            clubMinterAbi,
            signer
        );

        const clubIds = Object.keys(owners);

        for (let i = 0; i < clubIds.length; i += 1) {
            const tokenId = clubIds[i];

            console.log(`${i + 1}/${clubIds.length}`);

            try {
                // eslint-disable-next-line no-await-in-loop
                await minterContract.mint(owners[tokenId], tokenId);
            } catch (e) {
                console.log(e);
            }
        }
    });
