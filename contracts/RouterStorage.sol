// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IRouter} from "./interfaces/IRouter.sol";

/**
 * @title RouterStorage
 * @dev Storage layout for the Router contract
 */
abstract contract RouterStorage {
    // Cross-chain configuration
    mapping(uint64 => bool) public chains;
    mapping(uint64 => mapping(address => bool)) public protocols;
    mapping(address => mapping(address => bool)) public strategies;
    mapping(address => mapping(uint64 => bool)) public actions;

    //
    mapping(address => mapping(uint64 => IRouter.ValidationParams)) public validationParams;

    // Message tracking
    uint256 public receivedMessages;

    // Balance tracking
    mapping(address user => mapping(address token => uint256 amount)) public balances;
    mapping(address token => uint256 balance) public tokenBalances;

    // Failed execution tracking
    mapping(bytes32 => IRouter.FailedExecution) public failedExecutions;
    mapping(address => bytes32[]) public userFailedTransactions;


    // Constants
    uint256 internal constant RETRY_DELAY = 1 hours;
    uint256 internal constant EMERGENCY_DELAY = 3 days;
    uint256 internal constant DEFAULT_GAS_LIMIT = 300000;
}