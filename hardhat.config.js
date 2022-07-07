/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

require("dotenv").config();

const mainnetEndpoint = process.env.MAINNET_ENDPOINT;
const mainnetKey = process.env.MAINNET_KEY;
const archiveEndpoint = process.env.ARCHIVE_ENDPOINT;
const archiveKey = process.env.ARCHIVE_KEY;
const testnetEndpoint = process.env.TESTNET_ENDPOINT;
const testnetKey = process.env.TESTNET_KEY;
const bscscanKey = process.env.BSCSCAN_KEY;

module.exports = {

  solidity: {
    version: "0.6.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: mainnetEndpoint,
      accounts: [`0x${mainnetKey}`],
      chainId: 56,
      gas: "auto",
      gasPrice: "auto",
    },
    archive: {
      url: archiveEndpoint, // you need to provide BSC testnet archive node url, see Moralis: https://docs.moralis.io/speedy-nodes/connecting-to-rpc-nodes/connect-to-bsc-node
      accounts: [`0x${archiveKey}`],
      chainId: 97,
      blockNumber: 19640779, // https://testnet.bscscan.com/tx/0xed1b91d1ed12e7d321ed6b3e25bef093a1f639f5993ebb1022408c18cb4be669
      gas: "auto",
      gasPrice: "auto",
    },
    testnet: {
      url: testnetEndpoint,
      accounts: [`0x${testnetKey}`],
      chainId: 97,
      gas: "auto",
      gasPrice: "auto",
    }
  },
  etherscan: {
    apiKey: bscscanKey
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}
