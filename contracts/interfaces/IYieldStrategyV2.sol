// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IYieldStrategy
 * @dev Interface for yield strategy contracts
 */
interface IYieldStrategy {

    // for view call, tracking user position on frontend
    struct TokenBalance {
        uint256 amount;
        address token;
    }
    /**
     * @dev Execute a function with the given action and data
     * @param user The user address
     * @param action The action identifier
     * @param data The encoded function data
     */
    function executeFunction(
        address user,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool success, bytes memory result);

    /**
     * @dev Get the supported actions for this strategy
     * @return actions Array of supported action identifiers
     */
    function getSupportedActions() external view returns (uint64[] memory actions);

    /**
     * @dev Check if an action is supported
     * @param action The action identifier
     * @return supported True if the action is supported
     */
    function isActionSupported(uint64 action) external view returns (bool supported);

    /**
     * @dev Get the strategy name
     * @return name The strategy name
     */
    function getStrategyName() external view returns (string memory name);

    

    function userPositions(address user) external view returns (TokenBalance[] memory);

    /**
     * @dev Get the strategy version
     * @return version The strategy version
     */
    function getStrategyVersion() external view returns (string memory version);
}