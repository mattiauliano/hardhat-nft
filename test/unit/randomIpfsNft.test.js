const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, deployments, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft Unit Tests", () => {
          let deployer
          let randomIpfsNft
          let vrfCoordinatorV2Mock
          const chainId = network.config.chainId

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["randomIpfsNft", "mocks"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
          })

          describe("constructor", () => {
              it("sets mintFee correctly", async () => {
                  const mintFee = await randomIpfsNft.getMintFee()
                  assert.equal(mintFee.toString(), networkConfig[chainId]["mintFee"])
              })

              it("sets tokenCounter to 0", async () => {
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("requestNft", () => {
              it("reverts if sender doesn't send enough ETH", async () => {
                  // No ETH sent
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__NotEnoughETHSent"
                  )
              })

              it("emits an event and kicks off a random word request", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number id returned", async () => {
                  await new Promise(async (resolve, reject) => {
                      // Once emit the event do...
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              // Token with an ID of "0"
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()

                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      // Code to trigger emit
                      try {
                          // Send a request
                          const mintFee = await randomIpfsNft.getMintFee()
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: mintFee.toString(),
                          })

                          // Fulfill random words, get access to requestId
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (error) {
                          console.log(error)
                          reject(error)
                      }
                  })
              })
          })

          describe("withdraw", () => {})

          describe("getBreedFromModdedRange", () => {})
      })
