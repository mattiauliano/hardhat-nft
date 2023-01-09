const { ethers } = require("hardhat")

const networkConfig = {
    5: {
        name: "goerli",
    },
    31337: {
        name: "hardhat",
    },
}

// NOTE --> in developmentChains we're going to use mocks
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
