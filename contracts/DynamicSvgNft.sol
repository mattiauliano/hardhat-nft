// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// To get real time off chain priceFeeds
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";

error ERC721Metadata__URI_QueryFor_NonExistentToken();

// On chain
contract DynamicSvgNft is ERC721, Ownable {
    // Mint
    // Store our SVG infromation somewhere
    // Some logic to say "Show X Image" or "Show Y Image"

    uint256 private s_tokenCounter;
    string private s_lowImageURI;
    string private s_highImageURI;

    AggregatorV3Interface internal immutable i_priceFeed;
    // Assign to each minted token a high value
    mapping(uint256 => int256) public s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
        s_lowImageURI = svgToImageURI(lowSvg);
        s_highImageURI = svgToImageURI(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory BASE64_ENCODED_SVG_PREFIX = "data:image/svg+xml;base64,";

        // Use base64-sol to encode SVGs
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(BASE64_ENCODED_SVG_PREFIX, svgBase64Encoded));
    }

    function mintNft(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    // BASE64_ENCODED_JSON_PREFIX
    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    // Insert ImageURI in the JSON tokenURI (from ERC721.sol)
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }

        // Get price from Chainlink priceFeeds
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        // imageURI changes based on highValue
        string memory imageURI = s_lowImageURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = s_highImageURI;
        }

        // Concatenate baseURI, Base64 bytecode and get a string
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        // From string to bytes to encode it
                        bytes(
                            // Concatenate strings to get a JSON file
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "descriprion":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getLowSVG() public view returns (string memory) {
        return s_lowImageURI;
    }

    function getHighSVG() public view returns (string memory) {
        return s_highImageURI;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
