import * as fs from "fs";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { randomBytes } from "crypto";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const MINTER_ROLE =
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

export const updateArtifact = function updateArtifact(
    name: string,
    address: string,
    chainId: number,
    transactionHash: string
): void {
    const filename = `./artifacts/contracts/${name}.sol/${name}.json`;

    const rawData = fs.readFileSync(filename);

    const data = JSON.parse(rawData.toString());

    data.networks = data.networks || {};

    data.networks[chainId] = {
        events: {},
        links: {},
        address,
        transactionHash
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, "  "));
};

const updateDeploymentArtifacts =
    (hre: HardhatRuntimeEnvironment) =>
    async (contractInstance: Contract, name: string) => {
        let deploymentsPath = "./deployments";

        if (!fs.existsSync(deploymentsPath)) {
            fs.mkdirSync(deploymentsPath);
        }

        deploymentsPath = `${deploymentsPath}/${hre.network.name}`;

        if (!fs.existsSync(deploymentsPath)) {
            fs.mkdirSync(deploymentsPath);
        }

        const chainIdPath = `${deploymentsPath}/.chainId`;

        const deployment = await hre.artifacts.readArtifact(name);

        const chainId = await hre.getChainId();

        fs.writeFileSync(chainIdPath, chainId);

        const artifact = {
            contractName: deployment.contractName,
            abi: deployment.abi,
            bytecode: deployment.bytecode,
            deployedBytecode: deployment.deployedBytecode,
            address: contractInstance.address,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            transactionHash: deployment.networks[chainId].transactionHash
        };

        const filename = `${deploymentsPath}/${name}.json`;

        fs.writeFileSync(filename, JSON.stringify(artifact, null, "  "));
    };

export const deploy = async function deploy(
    name: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    ...params: any[]
): Promise<Contract> {
    const contractFactory = await ethers.getContractFactory(name);

    const contract = await contractFactory
        .deploy(...params)
        .then(f => f.deployed());

    updateArtifact(
        name,
        contract.address,
        contract.deployTransaction.chainId,
        contract.deployTransaction.hash
    );

    return contract;
};

export const deployProxy = async function deployProxy(
    name: string,
    args: any[] = []
): Promise<Contract> {
    const contractFactory = await ethers.getContractFactory(name);
    const instance = await upgrades.deployProxy(contractFactory, args);

    await instance.deployed();

    return instance;
};

export const deployProxyAndArtifact =
    (hre: HardhatRuntimeEnvironment) =>
    async (name: string, args: any[] = []) => {
        const contractFactory = await ethers.getContractFactory(name);
        const instance = await upgrades.deployProxy(contractFactory, args);

        await instance.deployed();

        await updateArtifact(
            name,
            instance.address,
            instance.deployTransaction.chainId,
            instance.deployTransaction.hash
        );

        await updateDeploymentArtifacts(hre)(instance, name);

        return instance;
    };

export const upgradeProxy = async function upgradeProxy(
    address: string,
    name: string
): Promise<Contract> {
    const contractFactory = await ethers.getContractFactory(name);

    return upgrades.upgradeProxy(address, contractFactory);
};

export const constructMerkleTree = (hashes: any): MerkleTree => {
    return new MerkleTree(hashes, keccak256, {
        sortPairs: true
    });
};

export const hashERC20PrizeInputs = (l: any[]) => {
    return Buffer.from(
        ethers.utils
            .keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "address", "uint256"],
                    l
                )
            )
            .slice(2),
        "hex"
    );
};

export const hashETHPrizeInputs = (l: any[]) => {
    return Buffer.from(
        ethers.utils
            .keccak256(
                ethers.utils.defaultAbiCoder.encode(["address", "uint256"], l)
            )
            .slice(2),
        "hex"
    );
};

export const constructERC20PrizeMerkleTree = (whitelist: any[]) =>
    constructMerkleTree(whitelist.map(w => hashERC20PrizeInputs(w)));

export const constructETHPrizeMerkleTree = (whitelist: any[]) =>
    constructMerkleTree(whitelist.map(w => hashETHPrizeInputs(w)));

export const getRandomBytes32 = function getRandomBytes32(): string {
    const buf = randomBytes(32);

    return `0x${buf.toString("hex")}`;
};
