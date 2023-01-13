const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

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

          describe("constructor", () => {})

          describe("svgToImageURI", () => {})

          describe("mintNft", () => {})

          describe("tokenURI", () => {})
      })
