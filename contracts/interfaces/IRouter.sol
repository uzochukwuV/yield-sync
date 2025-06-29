// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IRouter
 * @dev Interface for the cross-chain router contract
 */
interface IRouter {
    // Structs
    struct FailedExecution {
        address user;
        address token;
        uint256 amount;
        address strategy;
        uint64 action;
        bytes data;
        uint256 timestamp;
        bool recovered;
    }

    struct ValidationParams {
        uint256 tokenPosition;    // Byte position of token address in calldata (0 = not validated)
        uint256 amountPosition;   // Byte position of amount in calldata (0 = not validated)
        bool validateToken;       // Whether to validate token address
        bool validateAmount;      // Whether to validate amount
    }

   
    // Errors

    // View functions

    // Main functions
    function crossChainSync(
        uint64 destinationChain,
        address receiver,
        address strategy,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes32 messageId);

    function crossChainAsync(
        uint64 destinationChain,
        address protocol,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes32 messageId);

    function retryExecution(bytes32 txId, bytes calldata data) external;
    function emergencyWithdraw(bytes32 txId) external;

    // Admin functions
    function setAction(
        uint64 chainSelector,
        address protocol,
        address strategy,
        uint64 action
    ) external;

    function setStrategyAction(
        uint64 chainSelector,
        address protocol,
        address strategy,
        uint64 action
    ) external;

    function setProtocol(uint64 chainSelector, address protocol, bool allowed) external;
}