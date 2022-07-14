const { getNamedAccounts, deployments, network, run, ethers } = require("hardhat")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { verify } = require("../helper-functions")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const achiever = await ethers.getContract("Achiever")
    achieverAddress = achiever.address
    
    if (chainId == 31337) {
        const mockWETH = await ethers.getContract("MockWETH")
        wethAddress = mockWETH.address
    } else {
        wethAddress = networkConfig[chainId]["weth"]
    }
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------------------------------")
    const arguments = [
        wethAddress,
        achieverAddress,
    ]
    const mutuals = await deploy("Mutuals", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(mutual.address, arguments)
    }

}

module.exports.tags = ["all", "mutuals"]