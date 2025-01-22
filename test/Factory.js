const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Factory", function () {
    const FEE = ethers.parseUnits("0.01", 18)
    
    async function buyTokenFixture() {
        const { factory, token, deployer, creator, buyer } = await deployFactoryFixture()

        const amount = ethers.parseUnits("10000", 18)
        const cost = ethers.parseUnits("1", 18)

        const tx = await factory.connect(buyer).buy(await token.getAddress(), amount, {value: cost})
        const receipt = await tx.wait()

        return { factory, token, deployer, creator, buyer }
    }

    async function deployFactoryFixture() {
        const [deployer, creator, buyer] = await ethers.getSigners()

        //deploy
        const Factory = await ethers.getContractFactory("Factory")
        const factory = await Factory.deploy(FEE)

        //connect signer/creator to factory
        const tx = await factory.connect(creator).create("My Token", "MTK", {value: FEE})
        const receipt = await tx.wait()

        //get token
        const tokenAddress = await factory.tokens(0)
        const token = await ethers.getContractAt("Token", tokenAddress)

        return { factory, token, deployer, creator, buyer }
    }

    describe("Deployment", function () {
        it("should set a fee", async function () {
            const { factory } = await loadFixture(deployFactoryFixture)
            expect(await factory.fee()).to.equal(FEE)
        })

        it("should set the owner", async function () {
            const { factory, deployer } = await loadFixture(deployFactoryFixture)
            expect(await factory.owner()).to.equal(deployer.address)
        })
    })

    describe("Creating", function () {
        it("should set the factory as the owner", async function () {
            const { factory, token } = await loadFixture(deployFactoryFixture)
            expect(await token.owner()).to.equal(await factory.getAddress())
        })

        it("should set the creator", async function () {
            const { token, creator } = await loadFixture(deployFactoryFixture)
            expect(await token.creator()).to.equal(creator.address)
        })

        it("should set the supply", async function () {
            const { factory, token } = await loadFixture(deployFactoryFixture)
            const supply = ethers.parseUnits("1000000", 18)

            expect(await token.balanceOf(await factory.getAddress())).to.equal(supply)
        })

        it("should update the ETH balance", async function () {
            const { factory } = await loadFixture(deployFactoryFixture)
            
            const balance = await ethers.provider.getBalance(await factory.getAddress())
            
            expect(balance).to.equal(FEE)
        })

        it("should create the sale", async function () {
            const { factory, token, creator } = await loadFixture(deployFactoryFixture)
            
            const count = await factory.totalTokens()
            const sale = await factory.getTokenSale(0)
            
            expect(count).to.equal(1)
            expect(sale.token).to.equal(await token.getAddress())
            expect(sale.creator).to.equal(creator.address)
            expect(sale.sold).to.equal(0)
            expect(sale.raised).to.equal(0)
            expect(sale.isOpen).to.equal(true)
        })
    })

    describe("Buying", function () {
        const AMOUNT = ethers.parseUnits("10000", 18)
        const COST = ethers.parseUnits("1", 18)

        //contract receives ETH -- FAILLING
        it("Should update ETH balance", async function () {
            const { factory } = await loadFixture(buyTokenFixture)
            
            const balance = await ethers.provider.getBalance(await factory.getAddress())
            expect(balance).to.equal(FEE + COST)
        })

        //check buyer receives token
        it("Should update token balance", async function () {
            const { token, buyer } = await loadFixture(buyTokenFixture)
            
            const balance = await token.balanceOf(buyer.address)
            expect(balance).to.equal(AMOUNT)
        })

        it("Should update token sale", async function () {
            const { factory, token } = await loadFixture(buyTokenFixture)
            
            const sale = await factory.tokenToSale(await token.getAddress())
            
            expect(sale.sold).to.equal(AMOUNT)
            expect(sale.raised).to.equal(COST)
            expect(sale.isOpen).to.equal(true)
        })
        
        it("Should increase base cost", async function () {
            const { factory, token } = await loadFixture(buyTokenFixture)
            
            const sale = await factory.tokenToSale(await token.getAddress())
            const cost = await factory.getCost(sale.sold)
            
            expect(cost).to.equal(ethers.parseUnits("0.0002"))
        })
    })

    describe("Depositing", function () {
        const AMOUNT = ethers.parseUnits("10000", 18)
        const COST = ethers.parseUnits("2", 18)

        it("Sale should close and deposits are successful", async function () {
            const { factory, token, buyer, creator } = await loadFixture(buyTokenFixture)
            
            // buy again to reach target
            const buyTx = await factory.connect(buyer).buy(await token.getAddress(), AMOUNT, {value: COST})
            await buyTx.wait()

            const sale = await factory.tokenToSale(await token.getAddress())
            expect(sale.isOpen).to.equal(false)

            //verify deposit
            const depositTx = await factory.connect(creator).deposit(await token.getAddress())
            await depositTx.wait()

            //check balance: 1M - 200K
            const balance = await token.balanceOf(creator.address)
            expect(balance).to.equal(ethers.parseUnits("980000", 18))
        })
    })

    describe("Withdraw Fees", function () {
        it("Should update ETH balance", async function () {
            const { factory, deployer } = await loadFixture(deployFactoryFixture)
            
            const tx = await factory.connect(deployer).withdraw(FEE)
            await tx.wait()

            const balance = await ethers.provider.getBalance(await factory.getAddress())
            
            expect(balance).to.equal(0)
        })
    })
})
