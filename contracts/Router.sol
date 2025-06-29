// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IRouterClient} from "@chainlink/contracts@1.3.0/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts@1.3.0/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts@1.3.0/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts@1.3.0/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts@5.2.0/access/Ownable.sol";
import {CCIPReceiver} from "@chainlink/contracts@1.3.0/src/v0.8/ccip/applications/CCIPReceiver.sol";

import {IYieldStrategy} from "./interfaces/IYieldStrategy.sol";
import {IRouter} from "./interfaces/IRouter.sol";
import {RouterStorage} from "./RouterStorage.sol";
import {RouterEvents} from "./RouterEvents.sol";
import {RouterErrors} from "./RouterErrors.sol";

/**
 * @title Router
 * @dev Cross-chain router for yield strategies using Chainlink CCIP
 * @author YourTeam
 */
contract Router is 
    IRouter,
    CCIPReceiver, 
    Ownable, 
    RouterStorage, 
    RouterEvents, 
    RouterErrors 
{
    using SafeERC20 for IERC20;

    // Immutable variables
    IERC20 private immutable LINK_TOKEN;
    IRouterClient public immutable ROUTER;

    modifier validChain(uint64 chainSelector) {
        if (!chains[chainSelector]) revert ChainNotSupported(chainSelector);
        _;
    }

    modifier validProtocol(uint64 chainSelector, address protocol) {
        if (!protocols[chainSelector][protocol]) {
            revert ProtocolNotAllowed(chainSelector, protocol);
        }
        _;
    }

    modifier validStrategy(address protocol, address strategy) {
        if (!strategies[protocol][strategy]) {
            revert StrategyNotAllowed(protocol, strategy);
        }
        _;
    }

    modifier validAction(address strategy, uint64 action) {
        if (!actions[strategy][action]) {
            revert ActionNotAllowed(action, strategy, 0);
        }
        _;
    }

    constructor(
        address _router,
        address _link
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        if (_router == address(0) || _link == address(0)) {
            revert InvalidReceiver(address(0));
        }
        ROUTER = IRouterClient(_router);
        LINK_TOKEN = IERC20(_link);
    }

    /**
     * @dev Synchronous cross-chain execution
     */
    function crossChainSync(
        uint64 destinationChain,
        address receiver,
        address strategy,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) 
        external 
        validChain(destinationChain)
        validStrategy(receiver, strategy)
        validAction(strategy, action)
        returns (bytes32 messageId) 
    {
        if (receiver == address(0)) revert InvalidReceiver(receiver);

        return _executeCrossChain(
            destinationChain,
            receiver,
            strategy,
            action,
            token,
            amount,
            data
        );
    }

    /**
     * @dev Asynchronous cross-chain execution
     */
    function crossChainAsync(
        uint64 destinationChain,
        address protocol,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) 
        external 
        validChain(destinationChain)
        validProtocol(destinationChain, protocol)
        returns (bytes32 messageId) 
    {
        if (amount == 0) revert InvalidAmount(amount);

        return _executeCrossChain(
            destinationChain,
            protocol,
            protocol, // strategy same as protocol in async mode
            action,
            token,
            amount,
            data
        );
    }

    /**
     * @dev Internal function to execute cross-chain transactions
     */
    function _executeCrossChain(
        uint64 destinationChain,
        address receiver,
        address strategy,
        uint64 action,
        address token,
        uint256 amount,
        bytes calldata data
    ) internal returns (bytes32 messageId) {
        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(ROUTER), amount);

        // Prepare token amounts
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });

        // Prepare payload
        bytes memory payload = abi.encode(msg.sender, strategy, action, token, amount, data);

        // Prepare CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: payload,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: DEFAULT_GAS_LIMIT})
            ),
            feeToken: address(LINK_TOKEN)
        });

        // Calculate and check fee
        uint256 ccipFee = ROUTER.getFee(destinationChain, message);
        uint256 linkBalance = LINK_TOKEN.balanceOf(address(this));
        if (linkBalance < ccipFee) {
            revert InsufficientLinkBalance(ccipFee, linkBalance);
        }

        // Approve and send
        LINK_TOKEN.safeIncreaseAllowance(address(ROUTER), ccipFee);
        messageId = ROUTER.ccipSend(destinationChain, message);

        emit CrossChainExecuted(
            messageId,
            msg.sender,
            destinationChain,
            token,
            amount,
            ccipFee,
            payload
        );

        return messageId;
    }

    /**
     * @dev Handles incoming CCIP messages
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        (address user, address strategy, uint64 action, address token, uint256 amount, bytes memory data) = 
            abi.decode(any2EvmMessage.data, (address, address, uint64, address, uint256, bytes));

        receivedMessages++;

        if (data.length == 0) {
            return;
        }

        // Approve token for strategy if needed
        
        if (amount > 0) {
            IERC20(token).approve(strategy, amount);
        }

        // Execute strategy
        IYieldStrategy yieldStrategy = IYieldStrategy(strategy);

        
        try yieldStrategy.executeFunction(user, action, data) {
            _emitSuccessEvent(any2EvmMessage, user, strategy, action);
        } catch Error(string memory reason) {
            _storeFailed(any2EvmMessage, user, strategy, action, data, reason);
        } catch {
            _storeFailed(any2EvmMessage, user, strategy, action, data, "Unknown error");
        }
    }

    /**
     * @dev Emit success event
     */
    function _emitSuccessEvent(
        Client.Any2EVMMessage memory any2EvmMessage,
        address user,
        address strategy,
        uint64 action
    ) internal {
        if (any2EvmMessage.destTokenAmounts.length > 0) {
            emit ReceivedSuccess(
                any2EvmMessage.messageId,
                any2EvmMessage.sourceChainSelector,
                user,
                strategy,
                any2EvmMessage.destTokenAmounts[0].token,
                any2EvmMessage.destTokenAmounts[0].amount,
                action,
                any2EvmMessage.data
            );
        } else {
            emit ReceivedSuccess(
                any2EvmMessage.messageId,
                any2EvmMessage.sourceChainSelector,
                user,
                strategy,
                address(0),
                0,
                action,
                any2EvmMessage.data
            );
        }
    }

    /**
     * @dev Store failed execution
     */
    function _storeFailed(
        Client.Any2EVMMessage memory any2EvmMessage,
        address user,
        address strategy,
        uint64 action,
        bytes memory data,
        string memory reason
    ) internal {
        address token = address(0);
        uint256 amount = 0;

        if (any2EvmMessage.destTokenAmounts.length > 0) {
            token = any2EvmMessage.destTokenAmounts[0].token;
            amount = any2EvmMessage.destTokenAmounts[0].amount;

            // Update balances
            uint256 contractBalance = IERC20(token).balanceOf(address(this));
            if (tokenBalances[token] + amount == contractBalance) {
                balances[user][token] += amount;
                tokenBalances[token] += amount;
            }
        }

        failedExecutions[any2EvmMessage.messageId] = FailedExecution({
            user: user,
            token: token,
            amount: amount,
            strategy: strategy,
            action: action,
            data: data,
            timestamp: block.timestamp,
            recovered: false
        });

        userFailedTransactions[user].push(any2EvmMessage.messageId);

        emit ReceivedError(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            strategy,
            token,
            amount,
            action,
            any2EvmMessage.data,
            reason
        );
    }

    /**
     * @dev Retry failed execution
     */
    function retryExecution(bytes32 txId, bytes calldata data) external {
        FailedExecution storage failed = failedExecutions[txId];
        
        if (failed.user != msg.sender && msg.sender != owner()) {
            revert NotYourTransaction();
        }
        if (failed.recovered) revert AlreadyRecovered();
        if (block.timestamp <= failed.timestamp + RETRY_DELAY) {
            revert TooEarlyToRetry();
        }

        try IYieldStrategy(failed.strategy).executeFunction(failed.user, failed.action, data) {
            failed.recovered = true;
            if (failed.amount > 0) {
                balances[failed.user][failed.token] -= failed.amount;
                tokenBalances[failed.token] -= failed.amount;
            }
            emit ExecutionRetried(txId, true);
        } catch Error(string memory reason) {
            emit ExecutionRetried(txId, false);
            revert ExecutionFailed(reason);
        }
    }

    /**
     * @dev Emergency withdrawal for failed executions
     */
    function emergencyWithdraw(bytes32 txId) external {
        FailedExecution storage failed = failedExecutions[txId];
        
        if (failed.user != msg.sender) revert NotYourTransaction();
        if (failed.recovered) revert AlreadyRecovered();
        if (block.timestamp <= failed.timestamp + EMERGENCY_DELAY) {
            revert EmergencyPeriodNotReached();
        }

        failed.recovered = true;
        
        if (failed.amount > 0) {
            balances[failed.user][failed.token] -= failed.amount;
            tokenBalances[failed.token] -= failed.amount;
            IERC20(failed.token).safeTransfer(failed.user, failed.amount);
        }

        emit EmergencyWithdraw(txId, failed.user, failed.amount);
    }

    // Admin functions
    function setAction(
        uint64 chainSelector,
        address protocol,
        address strategy,
        uint64 action
    ) external onlyOwner {
        chains[chainSelector] = true;
        protocols[chainSelector][protocol] = true;
        strategies[protocol][strategy] = true;
        actions[strategy][action] = true;
        
        emit ProtocolConfigured(chainSelector, protocol, true);
        emit StrategyConfigured(protocol, strategy, true);
        emit ActionConfigured(strategy, action, true);
    }

    function setStrategyAction(
        uint64 chainSelector,
        address protocol,
        address strategy,
        uint64 action
    ) external onlyOwner {
        protocols[chainSelector][protocol] = true;
        strategies[protocol][strategy] = true;
        actions[strategy][action] = true;
        
        emit ProtocolConfigured(chainSelector, protocol, true);
        emit StrategyConfigured(protocol, strategy, true);
        emit ActionConfigured(strategy, action, true);
    }

    function setProtocol(uint64 chainSelector, address protocol, bool allowed)
        external
        onlyOwner
    {
        protocols[chainSelector][protocol] = allowed;
        emit ProtocolConfigured(chainSelector, protocol, allowed);
    }


    
    // View functions for testing
    function test_safeTransferFrom(uint256 amount) external {
        LINK_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
    }
}