// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ImplementationV2
 * @dev Upgraded version with additional state & logic,
 *      must preserve the same storage layout from V1 at the top.
 */
contract ImplementationV2 is ERC20, Ownable {
    // == Copy V1's storage in the same order/placement ==
    string private _tokenName;
    string private _tokenSymbol;
    uint256 private _someValue;
    bool private _initialized;  // from V1

    // == NEW STORAGE for V2 goes after existing variables ==
    uint256 private _newValue;
    bool private _initializedV2;

    /**
     * @dev Older-style Ownable that requires a parameter: Ownable(msg.sender).
     */
    constructor() ERC20("", "") Ownable(msg.sender) {
        // Typically unused in an upgradeable scenario.
    }

    /**
     * @dev Set up new fields post-upgrade.
     */
    function initializeV2() external {
        require(!_initializedV2, "ImplementationV2: Already initialized");
        _initializedV2 = true;

        // Example: set a new default
        _newValue = 777;
    }

    // Override name & symbol from ERC20
    function name() public view virtual override returns (string memory) {
        return _tokenName;
    }

    function symbol() public view virtual override returns (string memory) {
        return _tokenSymbol;
    }

    // =========== V1 Logic ===========

    function getSomeValue() external view returns (uint256) {
        return _someValue;
    }

    function setSomeValue(uint256 newVal) external onlyOwner {
        _someValue = newVal;
    }

    // =========== NEW LOGIC in V2 ===========

    function getNewValue() external view returns (uint256) {
        return _newValue;
    }

    function setNewValue(uint256 val) external onlyOwner {
        _newValue = val;
    }
}
