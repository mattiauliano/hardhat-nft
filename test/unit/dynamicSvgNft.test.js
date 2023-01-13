const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const {
    lowSVGImageUri,
    highSVGimageUri,
    lowTokenUri,
    highTokenUri,
    lowSVG,
    highSVG,
} = require("../../utils/test")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DynamicSvgNft Unit Tests", () => {
          let deployer
          let mockV3Aggregator
          let dynamicSvgNft

          beforeEach(async () => {
              const accounts = ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "dynamicSvgNft"])

              dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", () => {
              it("Sets lowSVG correctly", async () => {
                  const lowSVG = await dynamicSvgNft.getLowSVG()
                  assert.equal(lowSVG, lowSVGImageUri)
              })
              it("Sets highSVG correctly", async () => {
                  const highSVG = await dynamicSvgNft.getHighSVG()
                  assert.equal(highSVG, highSVGimageUri)
              })
              it("Sets priceFeed correctly", async () => {
                  const priceFeed = await dynamicSvgNft.getPriceFeed()
                  assert.equal(priceFeed, mockV3Aggregator.address)
              })
          })

          describe("mintNft", () => {
              it("emits an event and creates the NFT", async function () {
                  const highValue = ethers.utils.parseEther("1") // 1 dollar per ether
                  await expect(dynamicSvgNft.mintNft(highValue)).to.emit(
                      dynamicSvgNft,
                      "CreatedNFT"
                  )
                  const tokenCounter = await dynamicSvgNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, highTokenUri)
              })

              it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function () {
                  // $100,000,000 dollar per ether. Maybe in the distant future this test will fail...
                  const highValue = ethers.utils.parseEther("100000000")
                  const txResponse = await dynamicSvgNft.mintNft(highValue)
                  await txResponse.wait(1)
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, lowTokenUri)
              })
          })
      })
