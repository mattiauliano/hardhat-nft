// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";

error DynamicSvgNft__TokenIdDoesntExists();

// On chain
contract DynamicSvgNft is ERC721 {
    // Mint
    // Store our SVG infromation somewhere
    // Some logic to say "Show X Image" or "Show Y Image"

    uint256 private s_tokenCounter;
    string private immutable i_lowImageURI;
    string private immutable i_highImageURI;
    string private constant BASE64_ENCODED_SVG_PREFIX = "data:image/svg+xml;base64,";

    constructor(string memory lowSvg, string memory highSvg) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        // Use base64-sol to encode SVGs
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(BASE64_ENCODED_SVG_PREFIX, svgBase64Encoded));
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
    }

    // BASE64_ENCODED_JSON_PREFIX
    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    // Insert ImageURI in the JSON tokenURI (from ERC721.sol)
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert DynamicSvgNft__TokenIdDoesntExists();
        }
        string memory imageURI = "Hi";

        // Concatenate baseURI, Base64 bytecode and get a string
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
}
