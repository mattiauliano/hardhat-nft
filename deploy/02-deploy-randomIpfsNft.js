const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
require("dotenv").config()

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("3")
const imagesLocation = "./images/randomNft"
// const dogTokenUris = [
//     "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
//     "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
//     "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
// ]
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorV2Address, vrfCoordinatorV2Mock, subscriptionId

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        // Create a subId using mock
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        // Get access to subId through events
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription, you'd need LINK on a real net
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    const mintFee = networkConfig[chainId]["mintFee"]
    const keyHash = networkConfig[chainId]["keyHash"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]

    // If you don't want hardcode tokenURIs, you can do it programmatically
    let tokenUris
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    /*
    address vrfCoordinatorV2, mock
    uint64 subscriptionId,
    bytes32 keyHash,
    uint32 callbackGasLimit,
    string[3] memory dogTokenUris, ???
    uint256 mintFee
    */
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        keyHash,
        callbackGasLimit,
        tokenUris,
        mintFee,
    ]

    log("---------------------------------")
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
    log("---------------------------------")
}

const handleTokenUris = async () => {
    tokenUris = []
    // Store the image in IPFS
    // Store the metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (imageUploadResponseIndex in imageUploadResponses) {
        // Create a metadata
        let tokenUriMetadata = { ...metadataTemplate }
        // Name = pug.png --> pug
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        // storeImages returns an object with the ipfsHash
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].ipfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)

        // Upload the metadata
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.ipfsHash}`)
    }

    console.log("Token URIs Uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "randomIpfsNft", "main"]
