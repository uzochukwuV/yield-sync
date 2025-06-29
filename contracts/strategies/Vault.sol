// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@chainlink/contracts@1.3.0/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {IYieldStrategy} from "contracts/interfaces/IYieldStrategy.sol";


contract Vault is IYieldStrategy {
    // hard coded to Base Sepolia
    
    mapping(address => uint256) public balances;

    event Deposit(address indexed account, uint256 amount);
    event Withdraw(address indexed account, uint256 amount);

    error Vault__InsufficientBalance(uint256 currentBalance, uint256 requiredAmount);
    error Vault__FailedToTransfer(address to, uint256 amount);
    error Vault__FailedToDeposit(address to, uint256 amount);
    error Vault__FailedToWithdraw(address to, uint256 amount);
    error Invalid__Action(uint64 action);
    

    uint64 public constant DEPOSIT_ACTION = 1;
    uint64 public constant WITHDRAW_ACTION =2 ;

    function executeFunction(
        address sender,
        uint64 action,
        bytes calldata data
    ) external returns (bool success, bytes memory result){
        if(action == DEPOSIT_ACTION ){
            (address token, uint256 amount) = abi.decode(data, (address, uint256));
            if (token == address(0)) {
                revert Vault__FailedToDeposit(address(0), amount);
            }
            deposit(sender, token, amount);
            return (true, "Success");
        }else if(action == WITHDRAW_ACTION) {
            (address token, uint256 amount) = abi.decode(data, (address, uint256));
            if (token == address(0)) {
                revert Vault__FailedToWithdraw(address(0), amount);
            }
            withdraw(amount, token, sender);
            return (true, "Success");
        }else {
            revert Invalid__Action(action);
        }
    }

    function getBalance(address user) public view returns (uint256) {
        return balances[user];
    }

    // Allow anyone to deposit USDC
    // Make sure you approve this contract before calling!
    function deposit(address account, address token, uint256 amount) public  {
        balances[account] += amount;
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(account, amount);
    }

    function withdraw(uint256 amount,address token, address sender) public {
        if(balances[sender] < amount) {
            revert Vault__InsufficientBalance(balances[sender], amount);
        }
        balances[sender] -= amount;
        IERC20(token).transfer(sender, amount);
        emit Withdraw(sender, amount);
    }

    function encodeDepositData(address token, uint256 amount) external pure returns (bytes memory) {
        return abi.encode(token, amount);
    }

    function encodeWithdrawData(address token, uint256 amount) external pure returns (bytes memory) {
        return abi.encode(token, amount);
    }



    function getStrategyName() external pure returns (string memory name){
        return "Vault";
    }
    
    function getStrategyVersion() external pure returns (string memory version){
        return "1.0.0";
    }

    function getSupportedActions() external pure returns (uint64[] memory actions){
        actions[0] = DEPOSIT_ACTION ;
        actions[1] = WITHDRAW_ACTION ;
    }

    function isActionSupported( uint64 action) external pure override returns(bool supported) {
        if (action == DEPOSIT_ACTION || action == WITHDRAW_ACTION ){
            supported= true;
        }else  {
            supported= false;
        }
    }

}