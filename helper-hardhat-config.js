const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
    },
    4: {
        name: "rinkeby",
        weth: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    },
    5: {
        name: "goerli",
        weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    },
    80001: {
        name: "mumbai",
        weth: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
    },
    1: {
        name: "mainnet",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
const frontEndContractsFile = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const frontEndAbiFile = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiFile,
}
