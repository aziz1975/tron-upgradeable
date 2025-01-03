// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ImplementationV1 using the new OwnableUpgradeable (v5).
 * Notice the initializer now requires an address argument: __Ownable_init(address).
 */

// Upgradeable variants
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// The new v5 OwnableUpgradeable that has __Ownable_init(address)
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ImplementationV1 is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    // == Storage layout (V1) ==
    string private _tokenName;
    string private _tokenSymbol;
    uint256 private _someValue;
    bool private _initialized;

    /**
     * @dev Initialize the contract (upgradeable pattern).
     *      Note the extra parameter for `initialOwner_` to pass into __Ownable_init().
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address initialOwner_
    ) external initializer {
        // Initialize parent contracts
        __ERC20_init("", ""); // We'll override name/symbol anyway
        __Ownable_init(initialOwner_); // v5 requires initial owner address

        // Ensure we only do this once
        require(!_initialized, "ImplementationV1: Already initialized");
        _initialized = true;

        _tokenName = name_;
        _tokenSymbol = symbol_;

        // Mint tokens to the initial owner
        _mint(initialOwner_, initialSupply_);

        // Example additional logic
        _someValue = 42;
    }

    // =========== Overridden ERC20 name & symbol ===========

    function name() public view virtual override returns (string memory) {
        return _tokenName;
    }

    function symbol() public view virtual override returns (string memory) {
        return _tokenSymbol;
    }

    // =========== Additional getters/setters ===========

    function getSomeValue() external view returns (uint256) {
        return _someValue;
    }

    function setSomeValue(uint256 newVal) external onlyOwner {
        _someValue = newVal;
    }
}
