import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-deploy";
import "solidity-coverage";
import "dotenv/config";
import "./tasks";
import { HardhatUserConfig } from "hardhat/config";

const settings = {
    optimizer: {
        enabled: true,
        runs: 200
    }
};

const config: HardhatUserConfig = {
    solidity: {
        compilers: [{ version: "0.8.16", settings }]
    },
    namedAccounts: {
        deployer: 0
    },
    networks: {
        mainnet: {
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
            accounts: process.env.TEST_ETH_KEY
                ? [`0x${process.env.TEST_ETH_KEY}`]
                : []
        },
        localhost: {
            url: "http://0.0.0.0:8545"
        },
        goerli: {
            url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
            accounts: process.env.TEST_ETH_KEY
                ? [`0x${process.env.TEST_ETH_KEY}`]
                : []
        },
        "arbitrum-goerli": {
            url: "https://goerli-rollup.arbitrum.io/rpc",
            chainId: 421613,
            accounts: process.env.TEST_ETH_KEY ? [process.env.TEST_ETH_KEY] : []
        }
    }
};

module.exports = config;
