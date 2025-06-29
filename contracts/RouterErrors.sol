// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title RouterErrors
 * @dev Custom errors for the Router contract
 */
abstract contract RouterErrors {
    error InsufficientBalance(address token, uint256 currentBalance, uint256 requiredAmount);
    error NothingToWithdraw();
    error ProtocolNotAllowed(uint64 chain, address protocol);
    error ActionNotAllowed(uint64 action, address protocol, uint64 chainSelector);
    error StrategyNotAllowed(address protocol, address strategy);
    error ChainNotSupported(uint64 chainSelector);
    error InvalidReceiver(address receiver);
    error InvalidAmount(uint256 amount);
    error InvalidData();
    error NotYourTransaction();
    error AlreadyRecovered();
    error TooEarlyToRetry();
    error EmergencyPeriodNotReached();
    error ExecutionFailed(string reason);
    error InsufficientLinkBalance(uint256 required, uint256 available);
    error TokenMismatch(address expectedToken, address actualToken);
    error AmountMismatch(uint256 expectedAmount, uint256 actualAmount);
    error InvalidCalldataLength(uint256 required, uint256 actual);
    error ValidationNotConfigured(address strategy, uint64 action);
}