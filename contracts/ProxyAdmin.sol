// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProxyAdmin
 * @dev A minimal admin contract to manage a TransparentUpgradeableProxy:
 *      - Upgrades to new implementations
 *      - Calls functions on the proxy (e.g., new initializer)
 */
contract ProxyAdmin is Ownable {
    /**
     * @dev Sets the deployer (msg.sender) as the initial owner 
     *      due to the older Ownable that needs a constructor parameter.
     */
    constructor() Ownable(msg.sender) {
        // The deployer is the initial owner.
    }

    /**
     * @dev Upgrades the proxy to a new implementation.
     * @param proxyAddress The TransparentUpgradeableProxy address.
     * @param newImplementation The address of the new logic contract.
     */
    function upgrade(address proxyAddress, address newImplementation) external onlyOwner {
        (bool success, ) = proxyAddress.call(
            abi.encodeWithSignature("upgradeTo(address)", newImplementation)
        );
        require(success, "ProxyAdmin: upgrade call failed");
    }

    /**
     * @dev Allows the admin to call a function on the proxy (e.g. initializeV2()). Very unlikely.
     * @param proxyAddress The proxy that will receive the call.
     * @param data The encoded function call data.
     */
    function callProxy(address proxyAddress, bytes calldata data)
        external
        onlyOwner
        returns (bytes memory)
    {
        (bool success, bytes memory result) = proxyAddress.call(data);
        require(success, "ProxyAdmin: callProxy failed");
        return result;
    }

    /**
     * @dev Explicit function for transferring the ownership
     *      of this ProxyAdmin contract to a new account.
     *      This calls the inherited Ownable's transferOwnership(...)
     *
     * @param newOwner The address of the new owner
     */
    function transferProxyAdminOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ProxyAdmin: new owner is the zero address");
        transferOwnership(newOwner);  // Inherited from Ownable
    }
}
