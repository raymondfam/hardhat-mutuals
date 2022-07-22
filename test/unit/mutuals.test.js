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
            airdrop = ethers.utils.parseEther("100000000000000000000")

            // wethBalance = await mockWETH.balanceOf(deployer.address)
            // console.log(wethBalance.toString())

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
            await mutuals.connect(player1).addLiquidity(amount0, amount1)
        })

        describe("contructor", () => {
            it("Sets the pair token addresses correctly", async () => {
                const response0 = await mutuals.token0()
                const response1 = await mutuals.token1()
                assert.equal(response0, mockWETH.address)
                assert.equal(response1, achiever.address)
            })
        })

        describe("rewardPerToken", () => {
            it("Returns the reward amount of 1 share based off the locked up time", async () => {
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
                await moveTime(SECONDS_IN_A_DAY)
                await moveBlocks(1)
                earnings = await mutuals.earned(player1.address)
                expectedEarning = "8600000"
                assert.equal(earnings.toString(), expectedEarning)

                // await moveTime(SECONDS_IN_A_YEAR)
                // await moveBlocks(1)
                // earning = await mutuals.earned(player1.address)
                // expectedEarning = "3153600000"
                // assert.equal(earning.toString(), expectedEarning)
            })
        })

        describe("swap", () => {
            it("Outputs bought token and changes reserves pair in the pool", async () => {
                reserve1Before = await mutuals.reserve1()
                await mutuals.connect(player2).swap(mockWETH.address, amountIn)
                reserve1After = await mutuals.reserve1()
                amountOut = parseInt(ethers.utils.formatEther(BigInt(reserve1Before) - BigInt(reserve1After)))
                console.log(BigInt(reserve1Before) - BigInt(reserve1After))
                expectedAmountOut = 33266
                assert.equal(amountOut, expectedAmountOut)

                x = BigInt(await mutuals.reserve0())
                y = BigInt(await mutuals.reserve1())
                dx = BigInt(amount0)
                dy = y * dx / x
                console.log(dy)
                
                await expect(mutuals.connect(player2).addLiquidity(amount0, dy * BigInt(1053) / BigInt(1000)))
                .to.be.revertedWith("x / y != dx / dy")
                
            })
        })

        describe("addLiquidity", () => {
            it("Allocates shares to staker", async () => {
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

        // describe("removeLiquidity", () => {
        //     it("Returns tokens to staker proportionate to the shares in current reserves balance", async () => {
        //         shareToRemove = (await mutuals.balanceOf(player1.address)) / 10
        //         console.log(shareToRemove.toString())
        //         await mutuals.connect(player1).removeLiquidity(BigInt(shareToRemove))
        //         mockWETHBalance = parseInt(ethers.utils.formatEther(await mockWETH.balanceOf(player1.address)))
        //         expectedmockWETHBalance = "910000"
        //         assert.equal(mockWETHBalance, expectedmockWETHBalance)
        //     })
        // })

        describe("getReward", () => {
            it("Contract Mints Achiever tokens to staker", async () => {
                bytes = await achiever.MINTER_ROLE
                console.log(typeof bytes())
                await achiever.grantRole(bytes(), mutuals.address)
                await moveTime(SECONDS_IN_A_YEAR)
                await moveBlocks(1)
                earnings = await mutuals.earned(player1.address)
                balanceBefore = await achiever.balanceOf(player1.address)
                await mutuals.connect(player1).getReward()
                balanceAfter = await achiever.balanceOf(player1.address)
                console.log(balanceAfter.toString())
                assert.equal(balanceBefore.add(earnings).toString(), balanceAfter.toString())
            })
        })

        describe("calculateToken0Amount", () => {
            it("Calculates the corresponding amount of MockWETH needed to stake", async () => {
                amountIn = ethers.utils.parseEther("0.000000000000001")                
                await mutuals.connect(player2).swap(mockWETH.address, amountIn)
                dx = await mutuals.calculateToken0Amount(amount1)
                console.log(dx.toString())
                
                x = BigInt(await mutuals.reserve0())
                y = BigInt(await mutuals.reserve1())
                dy = BigInt(amount1)
                dx = x * dy / y
                console.log(x)
                console.log(dx)
                console.log(y)
                console.log(dy)
                LHS = x * BigInt(1e0) * dy
                RHS = y * BigInt(1e0) * dx
                console.log(LHS)
                console.log(RHS)
                LHS = x * BigInt(1e0) / dx
                RHS = y * BigInt(1e0) / dy
                console.log(LHS)
                console.log(RHS)
                LHS = dx * BigInt(1e0) / x
                RHS = dy * BigInt(1e0) / y
                console.log(LHS)
                console.log(RHS)

               
                await mutuals.connect(player2).addLiquidity(dx, amount1)
            })
        })

        describe("calculateToken1Amount", () => {
            it("Calculates the corresponding amount of Achiever needed to stake", async () => {
                
                amount0 = ethers.utils.parseEther("100000")
                amount1 = ethers.utils.parseEther("100000")

                await mutuals.connect(player1).addLiquidity(amount0, amount1)
                
                amountIn = ethers.utils.parseEther("7800")                
                await mutuals.connect(player2).swap(achiever.address, amountIn)
                // dy = await mutuals.calculateToken1Amount(amount0)
                
                

                amount0 = "1"

                x = BigInt(await mutuals.reserve0())
                y = BigInt(await mutuals.reserve1())
                dx = BigInt(amount0)
                dy = y * dx / x
                console.log(x)
                console.log(dx)
                console.log(y)
                console.log(dy)
                LHS = x * BigInt(1e0) * dy
                RHS = y * BigInt(1e0) * dx
                console.log(LHS)
                console.log(RHS)
                LHS = x * BigInt(1e0) / dx
                RHS = y * BigInt(1e0) / dy
                console.log(LHS)
                console.log(RHS)
                LHS = dx * BigInt(1e0) / x
                RHS = dy * BigInt(1e0) / y
                console.log(LHS)
                console.log(RHS)
                                            
                // await mutuals.connect(player2).addLiquidity(amount0, dy + BigInt(0))
            })
        })
    })