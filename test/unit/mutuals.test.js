const { assert, expect } = require("chai")
const { BigNumber } = require("ethers")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { moveBlocks } = require("../../utils/move-blocks")
const { moveTime } = require("../../utils/move-time")

const SECONDS_IN_A_DAY = 86400
const SECONDS_IN_A_YEAR = 31536000

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Mutuals Unit Tests", async function () {
        let mockWETH, mutuals, achiever, deployer, amount0, amount1, airdrop
        beforeEach(async () => {
            const accounts = await ethers.getSigners()
            deployer = accounts[0]
            player1 = accounts[1]
            player2 = accounts[2]
            await deployments.fixture(["mockWETH", "achiever", "mutuals"])
            mockWETH = await ethers.getContract("MockWETH")
            achiever = await ethers.getContract("Achiever")
            mutuals = await ethers.getContract("Mutuals")
            airdrop = ethers.utils.parseEther("1000000")
            await mockWETH.transfer(player1.address, airdrop)
            await achiever.mint(player1.address, airdrop)
            await mockWETH.transfer(player2.address, airdrop)
            await achiever.mint(player2.address, airdrop)
            amount0 = ethers.utils.parseEther("100000")
            amount1 = ethers.utils.parseEther("100000")
            amountIn = ethers.utils.parseEther("50000")
            await mockWETH.connect(player1).approve(mutuals.address, airdrop)
            await achiever.connect(player1).approve(mutuals.address, airdrop)
            await mockWETH.connect(player2).approve(mutuals.address, airdrop)
            await achiever.connect(player2).approve(mutuals.address, airdrop)
            
        })

        describe("contructor", () => {
            it("sets the pair token addresses correctly", async () => {
                const response0 = await mutuals.token0()
                const response1 = await mutuals.token1()
                assert.equal(response0, mockWETH.address)
                assert.equal(response1, achiever.address)
            })
        })

        describe("rewardPerToken", () => {
            it("Returns the reward amount of 1 share based off the locked up time", async () => {
                await mutuals.connect(player1).addLiquidity(amount0, amount1)
                // await moveTime(SECONDS_IN_A_DAY)
                // await moveBlocks(1)
                // let reward = await mutuals.rewardPerToken()
                // let expectedReward = "86"
                // assert.equal(reward.toString(), expectedReward)
                             
                await moveTime(SECONDS_IN_A_YEAR)
                await moveBlocks(1)
                reward = await mutuals.rewardPerToken()
                expectedReward = "31536"
                assert.equal(reward.toString(), expectedReward)               
            })
        })

        describe("earned", () => {
            it("Returns the earned amount based off the locked up time", async () => {
                await mutuals.connect(player1).addLiquidity(amount0, amount1)
                await moveTime(SECONDS_IN_A_DAY)
                await moveBlocks(1)
                earning = await mutuals.earned(player1.address)
                expectedEarning = "8600000"
                console.log(ethers.utils.formatEther(earning))
                assert.equal(earning.toString(), expectedEarning)

                // await moveTime(SECONDS_IN_A_YEAR)
                // await moveBlocks(1)
                // earning = await mutuals.earned(player1.address)
                // expectedEarning = "3153600000"
                // assert.equal(earning.toString(), expectedEarning)
            })
        })

        describe("swap", () => {
            it("Outputs bought token and changes reserves pair in the pool", async () => {
                await mutuals.connect(player1).addLiquidity(amount0, amount1)
                reserve1Before = (((await mutuals.reserve1()).toString()))
                console.log(reserve1Before)
                await mutuals.connect(player2).swap(mockWETH.address, amountIn)
                reserve1After = ((await mutuals.reserve1()).toString())
                console.log(reserve1After)                

                delta = (reserve1Before) - (reserve1After)
                console.log(delta)
                amountOut = 100000000000000000000000n - 66733400066733400066734n
                console.log(amountOut.toString())
                // console.log(Number(amountOut))
                // console.log(reserve1After,reserve1Before, 'a')
                // console.log(amountOut.toLocaleString('fullwide', {useGrouping:false}))
                // expectedAmountOut = "33266"
                // assert.equal(amountOut, expectedAmountOut)


                // // Reverting to wei level to bypass overflow issue
                // amount0 = 100000
                // amount1 = 100000                
                // amountIn = 50000
                // await mutuals.connect(player1).addLiquidity(amount0, amount1)
                // reserve1Before = await mutuals.reserve1()
                // await mutuals.connect(player2).swap(mockWETH.address, amountIn)
                // // amount1 = await mutuals.calculateToken1Amount(amount0)
                // // await mutuals.connect(player2).addLiquidity(amount0, amount1)
                // reserve1After = await mutuals.reserve1()
                // amountOut = (reserve1Before - reserve1After).toString()
                // expectedAmountOut = "33266"
                // assert.equal(amountOut, expectedAmountOut)
            })
        })

        describe("addLiquidity", () => {
            it("Allocate shares to staker", async () => {
                await mutuals.connect(player1).addLiquidity(amount0, amount1)
                player1Share = await mutuals.balanceOf(player1.address)
                expectedShareAmount1 = 100000
                assert.equal(ethers.utils.formatEther(player1Share), expectedShareAmount1)
                await mutuals.connect(player2).addLiquidity(amount0, amount1)
                player2Share = await mutuals.balanceOf(player2.address)
                expectedShareAmount2 = 100000
                assert.equal(ethers.utils.formatEther(player2Share), expectedShareAmount2)
                totalShare = await mutuals.totalSupply()
                expectedTotalShare = 200000
                assert.equal(ethers.utils.formatEther(totalShare), expectedTotalShare)

            })
        })
    })