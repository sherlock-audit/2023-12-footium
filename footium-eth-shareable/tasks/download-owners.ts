import oldContractAbi from "./legacy-club-contract-abi.json";
import { task } from "hardhat/config";
import { writeFileSync } from "fs";

task("download-owners", "Downloads a list of owners for the old contract")
    .addPositionalParam("address", "The contract's address")
    .addPositionalParam("outputFile", "Path for the output file")
    .setAction(async ({ address, outputFile }, { ethers }) => {
        const { provider } = ethers;
        const signer = provider.getSigner();

        const oldContract = new ethers.Contract(
            address,
            oldContractAbi,
            signer
        );

        const owners: Record<string, string> = {};

        const totalSupply = 3060;

        for (let i = 1; i < totalSupply; i += 1) {
            if (i % 10 === 0) {
                console.log(`${i}/${totalSupply}`);
            }

            try {
                // eslint-disable-next-line no-await-in-loop
                const owner = await oldContract.ownerOf(i);

                owners[i] = owner;
            } catch {
                console.log(`No owner for ${i}`);
            }
        }

        writeFileSync(outputFile, JSON.stringify(owners, null, 2), "utf-8");
    });
