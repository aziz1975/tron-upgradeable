// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ImplementationV2 using the new OwnableUpgradeable (v5).
 * We preserve the same storage layout as V1 at the top, 
 * and we typically do NOT re-init Ownable again unless we want to set a new owner.
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ImplementationV2 is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    // == Copy V1's storage in the same exact order ==
    string private _tokenName;
    string private _tokenSymbol;
    uint256 private _someValue;
    bool private _initialized; // from V1

    // == New storage for V2 goes next ==
    uint256 private _newValue;
    bool private _initializedV2;

    /**
     * @dev Initialization entrypoint for V2. 
     *      We do NOT call __Ownable_init again, as it would override the current owner.
     *      The owner is carried forward from V1's storage.
     */
    function initializeV2() external reinitializer(2) {
        require(!_initializedV2, "ImplementationV2: Already initialized");
        _initializedV2 = true;

        // Example: set a new default
        _newValue = 777;
    }

    // =========== Overridden ERC20 name & symbol ===========

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

    // =========== New V2 Logic ===========

    function getNewValue() external view returns (uint256) {
        return _newValue;
    }

    function setNewValue(uint256 val) external onlyOwner {
        _newValue = val;
    }

    // Expose the bool if we want to see the V2 is already initialized
    function isV2Initialized() external view returns (bool) {
        return _initializedV2;
    }
}
