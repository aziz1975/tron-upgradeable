// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ImplementationV1
 * @dev An example upgradeable ERC20 token contract that calls base constructors explicitly
 *      and relies on an `initialize()` function to set name, symbol, supply, etc.
 */
contract ImplementationV1 is ERC20, Ownable {
    // Manual storage for name/symbol, to avoid constructor usage in upgradable context.
    string private _tokenName;
    string private _tokenSymbol;

    // Example additional storage variable
    uint256 private _someValue;

    // Tracks whether initialize() was called
    bool private _initialized;

    /**
     * @dev Older-style Ownable that requires a parameter: Ownable(msg.sender).
     *      Even though we typically don't rely on constructors in upgradeable contracts,
     *      we keep this because your OpenZeppelin version requires it.
     */
    constructor() ERC20("", "") Ownable(msg.sender) {
        // Usually empty in upgradeable scenarios.
    }

    /**
     * @dev Initialize the contract (upgradeable pattern).
     *      - Sets a custom name and symbol
     *      - Mints an initial supply
     *      - Initializes any extra state variables
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_
    ) external {
        require(!_initialized, "ImplementationV1: Already initialized");
        _initialized = true;

        // Assign name/symbol to our private variables
        _tokenName = name_;
        _tokenSymbol = symbol_;

        // Mint some tokens to msg.sender
        _mint(msg.sender, initialSupply_);

        // Example: set a default value
        _someValue = 42;
    }

    /**
     * @dev Overridden ERC20 name() to return _tokenName.
     */
    function name() public view virtual override returns (string memory) {
        return _tokenName;
    }

    /**
     * @dev Overridden ERC20 symbol() to return _tokenSymbol.
     */
    function symbol() public view virtual override returns (string memory) {
        return _tokenSymbol;
    }

    // Additional getters/setters or custom logic:

    function getSomeValue() external view returns (uint256) {
        return _someValue;
    }

    function setSomeValue(uint256 newVal) external onlyOwner {
        _someValue = newVal;
    }
}
