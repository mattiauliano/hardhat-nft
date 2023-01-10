const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft Unit Tests", () => {
          let deployer
          let randomIpfsNft

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["randomIpfsNft"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
          })

          describe("constructor", () => {})

          describe("requestNft", () => {})

          describe("fulfillRandomWords", () => {})

          describe("withdraw", () => {})

          describe("getBreedFromModdedRange", () => {})
      })
