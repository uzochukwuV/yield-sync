// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FunctionsClient} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts@1.3.0/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from "@chainlink/contracts@1.3.0/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts@5.2.0/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts@5.2.0/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts@5.2.0/utils/ReentrancyGuard.sol";

/**
 * @title WeatherInsurance
 * @author Victor Ezealor
 * @notice A decentralized weather insurance contract using Chainlink Functions, Automation, and Price Feeds utilizing weatherxm api
 * @dev This contract allows farmers to purchase weather insurance policies and receive automated payouts based on weather conditions
 */
contract WeatherInsurance is FunctionsClient, AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Configuration (Sepolia)
    address constant ROUTER = 0xf9B8fc078197181C841c296C876945aaa425B278;
    bytes32 constant DON_ID = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;
    uint32 constant GAS_LIMIT = 300000;
    
    // ETH/USD Price Feed (Sepolia)
    AggregatorV3Interface internal immutable i_ethUsdPriceFeed;
    
    // Automation Configuration
    uint256 public immutable i_checkInterval; // 24 hours = 86400 seconds
    uint256 public lastCheckTimestamp;
    uint64 public s_subscriptionId;
    string private APIKEY;

    // Stations Management
    mapping(string => bool) public activeStations;
    mapping(uint256 => string) public stationIdByIndex;
    uint256 public stationCount;

    // Policy Management
    uint256 private s_nextPolicyId;
    mapping(uint256 => Policy) public s_policies;
    mapping(address => uint256[]) public s_userPolicies;
    mapping(string => uint256[]) public s_stationPolicies; // stationId => policyIds
    mapping(bytes32 => uint256) public s_requestIdToPolicy; // requestId => policyId

    // Weather Risk Data Storage (updated from raw weather data)
    mapping(string => WeatherRiskData[]) public s_stationWeatherHistory; // stationId => weather risk data
    mapping(bytes32 => string) public s_requestIdToStation; // requestId => stationId

    // Pending Payouts
    mapping(uint256 => uint256) public s_pendingPayouts; // policyId => amount in wei

    // Multi-currency payment support
    mapping(address => AggregatorV3Interface) public s_supportedPaymentTokens; // token => price feed

    // Constants
    uint256 public constant PREMIUM_RATE = 5; // 5% of coverage amount
    uint256 public constant MAX_COVERAGE = 10 ether; // Maximum coverage per policy
    uint256 public constant MIN_COVERAGE = 0.1 ether; // Minimum coverage per policy
    uint256 public constant POLICY_DURATION = 90 days; // 3 months
    
    // Risk thresholds for claim assessment (fixed values, not user-configurable)
    uint8 public constant DROUGHT_RISK_THRESHOLD = 70; // 70% risk threshold
    uint8 public constant FLOOD_RISK_THRESHOLD = 70; // 70% risk threshold
    uint8 public constant WIND_RISK_THRESHOLD = 70; // 70% risk threshold

    // Enums
    enum PolicyStatus { Active, Expired, Claimed, Cancelled }
    enum CoverageType { Drought, Flood, Wind, MultiPeril }
    enum ClaimStatus { None, Pending, Approved, Rejected, Paid, PendingPayout }

    // Structs
    /**
     * @notice Policy struct representing an insurance policy
     * @dev Removed ThresholdConfig as weather calculations are now off-chain
     */
    struct Policy {
        uint256 id;
        address farmer;
        string stationId;
        CoverageType coverageType;
        uint256 coverageAmount; // in wei
        uint256 premiumPaid; // in wei
        uint256 startDate;
        uint256 endDate;
        PolicyStatus status;
        ClaimStatus claimStatus;
        uint256 deductible; // percentage (0-100)
        address paymentToken; // address(0) for ETH, ERC20 address for tokens
    }

    /**
     * @notice Weather risk data calculated off-chain by Chainlink Functions
     * @dev Replaces raw weather data with processed risk indicators
     */
    struct WeatherRiskData {
        uint256 timestamp; // Timestamp of when the data was recorded
        uint8 droughtRisk; // Drought risk (0-100)
        uint8 floodRisk;   // Flood risk (0-100)
        uint8 windRisk;    // Wind risk (0-100)
    }

    struct ClaimAssessment {
        uint256 policyId;
        bool eligible;
        uint256 payoutAmount;
        string reason;
        uint256 assessmentDate;
    }

    // Events
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed farmer,
        string stationId,
        CoverageType coverageType,
        uint256 coverageAmount,
        uint256 premiumPaid,
        address paymentToken
    );
    
    event WeatherRiskDataReceived(
        string indexed stationId,
        uint256 timestamp,
        uint8 droughtRisk,
        uint8 floodRisk,
        uint8 windRisk
    );
    
    event ClaimProcessed(
        uint256 indexed policyId,
        address indexed farmer,
        uint256 payoutAmount,
        ClaimStatus status,
        string reason
    );
    
    event AutomationPerformed(uint256 timestamp, uint256 policiesChecked);
    event WeatherDataRequestSent(bytes32 indexed requestId, string stationId);
    event StationAdded(string stationId);
    event PayoutClaimed(uint256 indexed policyId, address indexed farmer, uint256 amount);
    event PaymentTokenAdded(address indexed token, address indexed priceFeed);
    event PaymentTokenRemoved(address indexed token);

    // Updated JavaScript source code for Chainlink Functions to return risk indicators
    string public constant WEATHER_SOURCE = 
        "const ethers = await import('npm:ethers@6.10.0');"
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: `https://pro.weatherxm.com/api/v1/stations/${args[0]}/latest`,"
        "headers: {'X-API-KEY': args[1], 'Accept': 'application/json'}"
        "});"
        "const data = apiResponse.data.observation;"
        "const temperature = data.temperature || 0;"
        "const feelsLike = data.feels_like || temperature;"
        "const dewPoint = data.dew_point || 0;"
        "const humidity = data.humidity || 0;"
        "const precipitationRate = data.precipitation_rate || 0;"
        "const precipitationAccumulated = data.precipitation_accumulated || 0;"
        "const windSpeed = data.wind_speed || 0;"
        "const windGust = data.wind_gust || 0;"
        "const uvIndex = data.uv_index || 0;"
        "const solarIrradiance = data.solar_irradiance || 0;"
        "const pressure = data.pressure || 1013;"
        "let droughtRisk = 0;"
        "if (humidity < 20) droughtRisk += 35;"
        "else if (humidity < 30) droughtRisk += 25;"
        "else if (humidity < 40) droughtRisk += 15;"
        "if (precipitationRate < 0.1 && precipitationAccumulated < 1) droughtRisk += 25;"
        "else if (precipitationRate < 0.5 && precipitationAccumulated < 5) droughtRisk += 15;"
        "if (feelsLike > 40) droughtRisk += 25;"
        "else if (feelsLike > 35) droughtRisk += 20;"
        "else if (feelsLike > 30) droughtRisk += 10;"
        "const dewPointSpread = temperature - dewPoint;"
        "if (dewPointSpread > 20) droughtRisk += 10;"
        "else if (dewPointSpread > 15) droughtRisk += 5;"
        "if (uvIndex > 8 && solarIrradiance > 800) droughtRisk += 5;"
        "droughtRisk = Math.min(droughtRisk, 100);"
        "let floodRisk = 0;"
        "if (precipitationRate > 25) floodRisk += 60;"
        "else if (precipitationRate > 15) floodRisk += 45;"
        "else if (precipitationRate > 10) floodRisk += 30;"
        "else if (precipitationRate > 5) floodRisk += 15;"
        "if (precipitationAccumulated > 100) floodRisk += 40;"
        "else if (precipitationAccumulated > 50) floodRisk += 25;"
        "else if (precipitationAccumulated > 25) floodRisk += 15;"
        "floodRisk = Math.min(floodRisk, 100);"
        "let windRisk = 0;"
        "const maxWind = Math.max(windSpeed, windGust);"
        "const gustFactor = windGust / Math.max(windSpeed, 1);"
        "if (maxWind > 20) windRisk = 100;"
        "else if (maxWind > 15) windRisk = 80;"
        "else if (maxWind > 12) windRisk = 60;"
        "else if (maxWind > 10) windRisk = 40;"
        "else if (maxWind > 8) windRisk = 25;"
        "else if (maxWind > 6) windRisk = 10;"
        "if (gustFactor > 2.5 && windRisk > 0) windRisk = Math.min(windRisk + 15, 100);"
        "else if (gustFactor > 2.0 && windRisk > 0) windRisk = Math.min(windRisk + 10, 100);"
        "const droughtRiskInt = Math.round(droughtRisk);"
        "const floodRiskInt = Math.round(floodRisk);"
        "const windRiskInt = Math.round(windRisk);"
        "const encoded = ethers.AbiCoder.defaultAbiCoder().encode(['uint8', 'uint8', 'uint8'], [droughtRiskInt, floodRiskInt, windRiskInt]);"
        "return ethers.getBytes(encoded);";

    // Custom Errors
    error WeatherInsurance__InvalidCoverageAmount();
    error WeatherInsurance__InvalidStationId();
    error WeatherInsurance__PolicyNotFound();
    error WeatherInsurance__PolicyNotActive();
    error WeatherInsurance__UnauthorizedClaim();
    error WeatherInsurance__InsufficientPremium();
    error WeatherInsurance__PayoutFailed();
    error WeatherInsurance__UnexpectedRequestID(bytes32 requestId);
    error WeatherInsurance__StationAlreadyExists();
    error WeatherInsurance__InsufficientBalance();
    error WeatherInsurance__NoPendingPayout();
    error WeatherInsurance__NotPolicyHolder();
    error WeatherInsurance__UnsupportedPaymentToken();
    error WeatherInsurance__InvalidTokenAmount();
    error WeatherInsurance__TokenTransferFailed();
    error WeatherInsurance__PriceFeedError();

    /**
     * @notice Constructor
     * @param _checkInterval Interval for Chainlink Automation checks
     * @param _subscriptionId Chainlink Functions subscription ID
     */
    constructor(
        uint256 _checkInterval,
        uint64 _subscriptionId
    ) FunctionsClient(ROUTER) Ownable(msg.sender) {
        i_checkInterval = _checkInterval;
        s_subscriptionId = _subscriptionId;
        lastCheckTimestamp = block.timestamp;
        s_nextPolicyId = 1;
        
        // ETH/USD Price Feed (Sepolia)
        i_ethUsdPriceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

    /**
     * @notice Set the API key for weather data requests
     * @param key The API key for WeatherXM
     */
    function setAPIKEY(string calldata key) external onlyOwner {
        APIKEY = key;
    }

    /**
     * @notice Add a supported payment token with its price feed
     * @param _tokenAddress Address of the ERC20 token
     * @param _priceFeedAddress Address of the Chainlink price feed for the token
     */
    function addSupportedPaymentToken(address _tokenAddress, address _priceFeedAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        
        s_supportedPaymentTokens[_tokenAddress] = AggregatorV3Interface(_priceFeedAddress);
        emit PaymentTokenAdded(_tokenAddress, _priceFeedAddress);
    }

    /**
     * @notice Remove a supported payment token
     * @param _tokenAddress Address of the ERC20 token to remove
     */
    function removeSupportedPaymentToken(address _tokenAddress) external onlyOwner {
        delete s_supportedPaymentTokens[_tokenAddress];
        emit PaymentTokenRemoved(_tokenAddress);
    }

    /**
     * @notice Add a weather station
     * @param _stationId The station ID to add
     */
    function addStation(string memory _stationId) external onlyOwner {
        if (activeStations[_stationId]) {
            revert WeatherInsurance__StationAlreadyExists();
        }
        
        activeStations[_stationId] = true;
        stationIdByIndex[stationCount] = _stationId;
        stationCount++;
        
        emit StationAdded(_stationId);
    }

    /**
     * @notice Get the latest price from a Chainlink price feed
     * @param _priceFeed The price feed contract
     * @return price The latest price with 8 decimals
     */
    function getLatestPrice(AggregatorV3Interface _priceFeed) public view returns (int256 price) {
        (, price, , , ) = _priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
    }

    /**
     * @notice Calculate premium in ETH
     * @param _coverageAmount Coverage amount in wei
     * @param _coverageType Type of coverage
     * @param _deductible Deductible percentage (0-100)
     * @return premium Premium amount in wei
     */
    function calculatePremium(
        uint256 _coverageAmount,
        CoverageType _coverageType,
        uint256 _deductible
    ) public pure returns (uint256 premium) {
        premium = (_coverageAmount * PREMIUM_RATE) / 100;
        
        // Adjust premium based on coverage type
        if (_coverageType == CoverageType.MultiPeril) {
            premium = (premium * 150) / 100; // 50% higher for multi-peril
        }
        
        // Adjust premium based on deductible (higher deductible = lower premium)
        if (_deductible > 0) {
            premium = (premium * (100 - _deductible / 2)) / 100;
        }
    }

    /**
     * @notice Calculate premium in a specific ERC20 token
     * @param _tokenAddress Address of the payment token
     * @param _coverageAmount Coverage amount in wei
     * @param _coverageType Type of coverage
     * @param _deductible Deductible percentage (0-100)
     * @return tokenAmount Premium amount in the specified token
     */
    function calculatePremiumInToken(
        address _tokenAddress,
        uint256 _coverageAmount,
        CoverageType _coverageType,
        uint256 _deductible
    ) public view returns (uint256 tokenAmount) {
        require(address(s_supportedPaymentTokens[_tokenAddress]) != address(0), "Unsupported token");
        
        uint256 premiumInEth = calculatePremium(_coverageAmount, _coverageType, _deductible);
        
        // Get ETH/USD price
        int256 ethUsdPrice = getLatestPrice(i_ethUsdPriceFeed);
        require(ethUsdPrice > 0, "Invalid ETH price");
        
        // Get Token/USD price
        int256 tokenUsdPrice = getLatestPrice(s_supportedPaymentTokens[_tokenAddress]);
        require(tokenUsdPrice > 0, "Invalid token price");
        
        // Calculate token amount: (premiumInEth * ethUsdPrice) / tokenUsdPrice
        // Adjusting for decimals: ETH has 18 decimals, price feeds have 8 decimals
        tokenAmount = (premiumInEth * uint256(ethUsdPrice)) / uint256(tokenUsdPrice);
        
        // Get token decimals (assuming 18 for simplicity, could be made dynamic)
        // tokenAmount = tokenAmount * (10 ** tokenDecimals) / (10 ** 18);
    }

    /**
     * @notice Create a new insurance policy with ETH payment
     * @param _stationId Weather station ID
     * @param _coverageType Type of coverage
     * @param _coverageAmount Coverage amount in wei
     * @param _deductible Deductible percentage (0-100)
     */
    function createPolicy(
        string memory _stationId,
        CoverageType _coverageType,
        uint256 _coverageAmount,
        uint256 _deductible
    ) external payable nonReentrant {
        _validatePolicyInputs(_stationId, _coverageAmount, _deductible);

        uint256 requiredPremium = calculatePremium(_coverageAmount, _coverageType, _deductible);
        if (msg.value < requiredPremium) {
            revert WeatherInsurance__InsufficientPremium();
        }

        uint256 policyId = _createPolicyInternal(
            _stationId,
            _coverageType,
            _coverageAmount,
            _deductible,
            msg.value,
            address(0) // ETH payment
        );

        emit PolicyCreated(
            policyId,
            msg.sender,
            _stationId,
            _coverageType,
            _coverageAmount,
            msg.value,
            address(0)
        );

        // Return excess payment
        if (msg.value > requiredPremium) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - requiredPremium}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Create a new insurance policy with ERC20 token payment
     * @param _stationId Weather station ID
     * @param _coverageType Type of coverage
     * @param _coverageAmount Coverage amount in wei
     * @param _deductible Deductible percentage (0-100)
     * @param _tokenAddress Address of the payment token
     * @param _tokenAmount Amount of tokens to pay
     */
    function createPolicyWithERC20(
        string memory _stationId,
        CoverageType _coverageType,
        uint256 _coverageAmount,
        uint256 _deductible,
        address _tokenAddress,
        uint256 _tokenAmount
    ) external nonReentrant {
        _validatePolicyInputs(_stationId, _coverageAmount, _deductible);
        
        if (address(s_supportedPaymentTokens[_tokenAddress]) == address(0)) {
            revert WeatherInsurance__UnsupportedPaymentToken();
        }

        uint256 requiredTokenAmount = calculatePremiumInToken(_tokenAddress, _coverageAmount, _coverageType, _deductible);
        if (_tokenAmount < requiredTokenAmount) {
            revert WeatherInsurance__InsufficientPremium();
        }

        // Transfer tokens from user to contract
        IERC20 token = IERC20(_tokenAddress);
        bool success = token.transferFrom(msg.sender, address(this), _tokenAmount);
        if (!success) {
            revert WeatherInsurance__TokenTransferFailed();
        }

        uint256 policyId = _createPolicyInternal(
            _stationId,
            _coverageType,
            _coverageAmount,
            _deductible,
            _tokenAmount,
            _tokenAddress
        );

        emit PolicyCreated(
            policyId,
            msg.sender,
            _stationId,
            _coverageType,
            _coverageAmount,
            _tokenAmount,
            _tokenAddress
        );
    }

    /**
     * @notice Internal function to create a policy
     */
    function _createPolicyInternal(
        string memory _stationId,
        CoverageType _coverageType,
        uint256 _coverageAmount,
        uint256 _deductible,
        uint256 _premiumPaid,
        address _paymentToken
    ) internal returns (uint256 policyId) {
        policyId = s_nextPolicyId++;
        
        Policy storage newPolicy = s_policies[policyId];
        newPolicy.id = policyId;
        newPolicy.farmer = msg.sender;
        newPolicy.stationId = _stationId;
        newPolicy.coverageType = _coverageType;
        newPolicy.coverageAmount = _coverageAmount;
        newPolicy.premiumPaid = _premiumPaid;
        newPolicy.startDate = block.timestamp;
        newPolicy.endDate = block.timestamp + POLICY_DURATION;
        newPolicy.status = PolicyStatus.Active;
        newPolicy.claimStatus = ClaimStatus.None;
        newPolicy.deductible = _deductible;
        newPolicy.paymentToken = _paymentToken;

        s_userPolicies[msg.sender].push(policyId);
        s_stationPolicies[_stationId].push(policyId);
    }

    /**
     * @notice Validate policy creation inputs
     */
    function _validatePolicyInputs(
        string memory _stationId,
        uint256 _coverageAmount,
        uint256 _deductible
    ) internal view {
        if (_coverageAmount < MIN_COVERAGE || _coverageAmount > MAX_COVERAGE) {
            revert WeatherInsurance__InvalidCoverageAmount();
        }
        
        if (bytes(_stationId).length == 0 || !activeStations[_stationId]) {
            revert WeatherInsurance__InvalidStationId();
        }

        if (_deductible > 100) {
            revert("Deductible cannot exceed 100%");
        }
    }

    /**
     * @notice Chainlink Automation: Check if upkeep is needed
     */
    function checkUpkeep(
        bytes calldata checkData 
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        string memory stationId = string(checkData);
        upkeepNeeded = (block.timestamp - lastCheckTimestamp) > i_checkInterval && stationCount > 0;
        performData = bytes(stationId);
    }

    /**
     * @notice Chainlink Automation: Perform upkeep
     */
    function performUpkeep(bytes calldata  performData ) external override {
        if ((block.timestamp - lastCheckTimestamp) > i_checkInterval && stationCount > 0) {
            lastCheckTimestamp = block.timestamp;
            
            // // Request weather data for each active station
            // for (uint i = 0; i < stationCount; i++) {
            //     string memory stationId = stationIdByIndex[i];
            //     if (activeStations[stationId]) {
            //         requestWeatherData(stationId, APIKEY);
            //     }
            // }
            string memory stationId = string(performData);

            if (activeStations[stationId]) {
                    requestWeatherData(stationId, APIKEY);
            }
            
            emit AutomationPerformed(block.timestamp, stationCount);
        }
    }

    function toBytes(string memory data) public  pure returns (bytes memory) {
        return bytes(data);
    }

    /**
     * @notice Request weather data from WeatherXM API
     * @param _stationId Station ID to request data for
     * @param _apikey API key for WeatherXM
     */
    function requestWeatherData(string memory _stationId, string memory _apikey) public returns (bytes32 requestId) {
        // Only owner or automation can call this
        require(msg.sender == owner() || msg.sender == address(this), "Unauthorized");
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(WEATHER_SOURCE);
        
        string[] memory args = new string[](2);
        args[0] = _stationId;
        args[1] = _apikey;
        req.setArgs(args);

        requestId = _sendRequest(
            req.encodeCBOR(),
            s_subscriptionId,
            GAS_LIMIT,
            DON_ID
        );

        s_requestIdToStation[requestId] = _stationId;
        
        emit WeatherDataRequestSent(requestId, _stationId);
        return requestId;
    }

   

    /**
     * @notice Chainlink Functions callback - Updated to handle risk data
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        string memory stationId = s_requestIdToStation[requestId];
        if (bytes(stationId).length == 0) {
            return; // Invalid request ID
        }

        if (err.length > 0) {
            return; // Error in request
        }

        if (response.length == 0) {
            return; // Empty response
        }

        // Decode the risk indicators from the Chainlink Function response
        (uint8 droughtRisk, uint8 floodRisk, uint8 windRisk) = 
            abi.decode(response, (uint8, uint8, uint8));

        WeatherRiskData memory newRiskData = WeatherRiskData({
            timestamp: block.timestamp,
            droughtRisk: droughtRisk,
            floodRisk: floodRisk,
            windRisk: windRisk
        });
        
        // Store weather risk data
        s_stationWeatherHistory[stationId].push(newRiskData);
        
        emit WeatherRiskDataReceived(
            stationId,
            newRiskData.timestamp,
            newRiskData.droughtRisk,
            newRiskData.floodRisk,
            newRiskData.windRisk
        );

        // Process claims for this station


        // Clean up the mapping
        delete s_requestIdToStation[requestId];
    }

     /**
     * @notice Process claims for a specific station - Updated for risk-based assessment
     */
    function processClaimsForStation(string memory _stationId) internal {
        uint256[] memory policyIds = s_stationPolicies[_stationId];
        
        for (uint i = 0; i < policyIds.length; i++) {
            Policy storage policy = s_policies[policyIds[i]];
            
            if (policy.status == PolicyStatus.Active && 
                policy.claimStatus == ClaimStatus.None &&
                block.timestamp <= policy.endDate) {
                
                ClaimAssessment memory assessment = assessClaim(policy, _stationId);
                
                if (assessment.eligible && assessment.payoutAmount > 0) {
                    // Store pending payout
                    s_pendingPayouts[policy.id] = assessment.payoutAmount;
                    policy.claimStatus = ClaimStatus.PendingPayout;
                    
                    emit ClaimProcessed(
                        policy.id,
                        policy.farmer,
                        assessment.payoutAmount,
                        ClaimStatus.PendingPayout,
                        assessment.reason
                    );
                }
            }
        }
    }

     /**
     * @notice Assess claim eligibility based on weather risk data - Updated logic
     */
    function assessClaim(Policy memory _policy, string memory _stationId) internal view returns (ClaimAssessment memory assessment) {
        assessment.policyId = _policy.id;
        assessment.assessmentDate = block.timestamp;
        
        WeatherRiskData[] memory riskHistory = s_stationWeatherHistory[_stationId];
        if (riskHistory.length == 0) {
            assessment.eligible = false;
            assessment.reason = "No weather data available";
            return assessment;
        }
        
        // Get the latest risk data
        WeatherRiskData memory latestRisk = riskHistory[riskHistory.length - 1];
        
        bool riskExceeded = false;
        string memory riskType = "";
        
        // Check if risk thresholds are exceeded based on coverage type
        if (_policy.coverageType == CoverageType.Drought) {
            if (latestRisk.droughtRisk >= DROUGHT_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Drought";
            }
        } else if (_policy.coverageType == CoverageType.Flood) {
            if (latestRisk.floodRisk >= FLOOD_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Flood";
            }
        } else if (_policy.coverageType == CoverageType.Wind) {
            if (latestRisk.windRisk >= WIND_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Wind";
            }
        } else if (_policy.coverageType == CoverageType.MultiPeril) {
            if (latestRisk.droughtRisk >= DROUGHT_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Drought";
            } else if (latestRisk.floodRisk >= FLOOD_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Flood";
            } else if (latestRisk.windRisk >= WIND_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Wind";
            }
        }
        
        if (riskExceeded) {
            assessment.eligible = true;
            assessment.payoutAmount = _policy.coverageAmount;
            
            // Apply deductible
            if (_policy.deductible > 0) {
                uint256 deductibleAmount = (assessment.payoutAmount * _policy.deductible) / 100;
                assessment.payoutAmount -= deductibleAmount;
            }
            
            assessment.reason = string(abi.encodePacked(riskType, "RTE"));
        } else {
            assessment.eligible = false;
            assessment.reason = "RTNE";
        }
    }

    function claimPayout(uint256 _policyId) external nonReentrant {
        Policy storage policy = s_policies[_policyId];
        
        if (policy.farmer != msg.sender) {
            revert WeatherInsurance__NotPolicyHolder();
        }
        
        if (policy.claimStatus != ClaimStatus.PendingPayout) {
            revert WeatherInsurance__NoPendingPayout();
        }
        
        uint256 payoutAmount = s_pendingPayouts[_policyId];
        if (payoutAmount == 0) {
            revert WeatherInsurance__NoPendingPayout();
        }
        
        // Update policy status
        policy.status = PolicyStatus.Claimed;
        policy.claimStatus = ClaimStatus.Paid;
        
        // Clear pending payout
        delete s_pendingPayouts[_policyId];
        
        // Transfer payout
        (bool success, ) = payable(msg.sender).call{value: payoutAmount}("");
        if (!success) {
            revert WeatherInsurance__PayoutFailed();
        }
        
        emit PayoutClaimed(_policyId, msg.sender, payoutAmount);
    }


     function isPaymentTokenSupported(address _tokenAddress) external view returns (bool) {
        return address(s_supportedPaymentTokens[_tokenAddress]) != address(0);
    }

    

    /**
     * @notice Emergency withdrawal function (owner only)
     * @param _amount Amount to withdraw in wei
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        if(_amount >= address(this).balance){
            (bool success, ) = payable(owner()).call{value: _amount}("");
            require(success);
        }
    }

    /**
     * @notice Emergency token withdrawal function (owner only)
     * @param _tokenAddress Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdrawToken(address _tokenAddress, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        bool success = token.transfer(owner(), _amount);
        require(success);
    }
   
   
   
    receive() external payable {}
}

