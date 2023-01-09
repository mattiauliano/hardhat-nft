const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT Unit Tests", () => {
          let deployer
          let basicNft

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicNft"])
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", () => {
              it("sets name correctly", async () => {
                  const name = await basicNft.name()
                  assert.equal(name, "Dogie")
              })
              it("sets symbol correctly", async () => {
                  const symbol = await basicNft.symbol()
                  assert.equal(symbol, "DOG")
              })
              it("sets the tokenCounter to 0", async () => {
                  const counter = await basicNft.getTokenCounter()
                  assert.equal(counter.toString(), "0")
              })
          })

          describe("mintNft", () => {
              beforeEach(async () => {
                  const tx = await basicNft.mintNft()
                  await tx.wait(1)
              })

              it("allows users to mint, increments tokenCounter by 1", async () => {
                  const counter = await basicNft.getTokenCounter()
                  assert.equal(counter, "1")
              })

              it("gives the minted nft to the owner", async () => {
                  const owner = await basicNft.ownerOf(0)
                  assert.equal(owner, deployer.address)
              })

              it("shows the correct balance", async () => {
                  const deployerAddress = deployer.address
                  const deployerBalance = await basicNft.balanceOf(deployerAddress)
                  assert.equal(deployerBalance.toString(), "1")
              })
          })

          describe("tokenURI", () => {
              it("returns the correct tokenURI", async () => {
                  const getTokenURI = await basicNft.tokenURI(0)
                  const TOKEN_URI = await basicNft.TOKEN_URI()
                  assert.equal(getTokenURI, TOKEN_URI)
              })
          })
      })
