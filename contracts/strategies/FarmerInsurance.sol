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
 * @author Victor
 * @notice A decentralized weather insurance contract with realistic premium calculations and payment options
 * @dev Supports both one-time and recurring payment models with regional and crop-specific risk factors
 */
contract WeatherInsurance is FunctionsClient, AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Configuration base (Sepolia)
    address constant ROUTER = 0xf9B8fc078197181C841c296C876945aaa425B278;
    bytes32 constant DON_ID = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;
    uint32 constant GAS_LIMIT = 300000;
    
    // ETH/USD Price Feed (Sepolia)
    AggregatorV3Interface internal immutable i_ethUsdPriceFeed;
    
    // Automation Configuration
    uint256 public immutable i_checkInterval;
    mapping(string stationId => uint256 timeStamp) public lastCheckTimestamp;
    uint64 public s_subscriptionId;
    string private APIKEY;

    // Stations Management
    mapping(string => bool) public activeStations;
    mapping(uint256 => string) public stationIdByIndex;
    mapping(string => RegionRisk) public stationRegionRisk; // stationId => risk multiplier
    uint256 public stationCount;
    uint256 public upkeepCheckCount;

    // Policy Management
    uint256 private s_nextPolicyId;
    mapping(uint256 => Policy) public s_policies;
    mapping(address => uint256[]) public s_userPolicies;
    mapping(string => uint256[]) public s_stationPolicies;
    mapping(bytes32 => uint256) public s_requestIdToPolicy;

    // Recurring Payment Management
    mapping(uint256 => RecurringPayment) public s_recurringPayments;
    mapping(address => uint256[]) public s_userRecurringPayments;
    uint256 public s_nextRecurringId;

    // Weather Risk Data Storage
    mapping(string => WeatherRiskData[]) public s_stationWeatherHistory;
    mapping(bytes32 => string) public s_requestIdToStation;

    // Pending Payouts
    mapping(uint256 => uint256) public s_pendingPayouts;

    // Multi-currency payment support
    mapping(address => AggregatorV3Interface) public s_supportedPaymentTokens;

    // Premium Calculation Constants (in basis points for precision)
    uint256 public constant BASE_RISK_RATE_MIN = 3000; // 15% annually
    uint256 public constant BASE_RISK_RATE_MAX = 6000; // 30% annually
    uint256 public constant LOADING_FACTOR_MIN = 2000; // 130% (30% markup)
    uint256 public constant LOADING_FACTOR_MAX = 3000; // 180% (80% markup)
    uint256 public constant ADMIN_FEE_RATE = 200; // 1% of sum insured
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // Coverage Constants
    uint256 public constant MAX_COVERAGE = 10 ether;
    uint256 public constant MIN_COVERAGE = 0.1 ether;
    uint256 public constant POLICY_DURATION_3M = 90 days;
    uint256 public constant POLICY_DURATION_6M = 180 days;
    uint256 public constant POLICY_DURATION_12M = 365 days;
    
    // Risk thresholds
    uint8 public constant DROUGHT_RISK_THRESHOLD = 70;
    uint8 public constant FLOOD_RISK_THRESHOLD = 70;
    uint8 public constant WIND_RISK_THRESHOLD = 70;

    // Enums
    enum PolicyStatus { Active, Expired, Claimed, Cancelled }
    enum CoverageType { Drought, Flood, Wind, MultiPeril }
    enum ClaimStatus { None, Pending, Approved, Rejected, Paid, PendingPayout }
    
    enum CropType { Corn, Wheat, Rice, Soybean, Cotton, Vegetable, Fruit, Other }
    enum PolicyDuration { ThreeMonths, SixMonths, TwelveMonths }

    // Structs
    struct Policy {
        uint256 id;
        address farmer;
        string stationId;
        CoverageType coverageType;
        CropType cropType;
        PolicyDuration duration;
        uint256 coverageAmount;
        uint256 totalPremium;
        uint256 paidPremium;
        uint256 startDate;
        // uint256 endDate;

        PolicyStatus status;
        ClaimStatus claimStatus;
        uint256 deductible;
        address paymentToken;
        uint256 recurringPaymentId; // 0 for one-time payments
    }

     struct PolicyStatusState {
        uint256 id;
        uint256 deductible;
     }

    struct RecurringPayment {
        uint256 id;
        uint256 policyId;
        address farmer;
        uint256 installmentAmount;
        uint256 totalInstallments;
        uint256 paidInstallments;
        uint256 nextPaymentDue;
        uint256 paymentInterval; // in seconds
        address paymentToken;
        bool isActive;
    }

    struct PremiumCalculation {
        uint256 baseRiskRate;     // 15-30% annually in basis points
        uint256 regionMultiplier; // 80-200% in basis points
        uint256 cropMultiplier;   // 90-150% in basis points
        uint256 seasonMultiplier; // 80-130% in basis points
        uint256 loadingFactor;    // 130-180% in basis points
        uint256 durationFactor;   // Duration as fraction of year in basis points
    }

    struct RegionRisk {
        uint256 droughtMultiplier;  // 80-200% in basis points
        uint256 floodMultiplier;    // 80-200% in basis points
        uint256 windMultiplier;     // 80-200% in basis points
        bool isSet;
    }

    struct WeatherRiskData {
        uint256 timestamp;
        uint8 droughtRisk;
        uint8 floodRisk;
        uint8 windRisk;
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
        CropType cropType,
        uint256 coverageAmount,
        uint256 totalPremium,
        address paymentToken
    );

    event RecurringPaymentCreated(
        uint256 indexed recurringId,
        uint256 indexed policyId,
        address indexed farmer,
        uint256 installmentAmount,
        uint256 totalInstallments
    );

    event RecurringPaymentMade(
        uint256 indexed recurringId,
        uint256 indexed policyId,
        address indexed farmer,
        uint256 installmentNumber,
        uint256 amount
    );

    event PolicyFullyPaid(
        uint256 indexed policyId,
        address indexed farmer,
        uint256 totalPremiumPaid
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
    event StationAdded(string stationId, RegionRisk regionRisk);
    event PayoutClaimed(uint256 indexed policyId, address indexed farmer, uint256 amount);
    event PaymentTokenAdded(address indexed token, address indexed priceFeed);
    event PaymentTokenRemoved(address indexed token);

    // Weather source code
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
    error WeatherInsurance__RecurringPaymentNotFound();
    error WeatherInsurance__PaymentNotDue();
    error WeatherInsurance__RecurringPaymentComplete();
    error WeatherInsurance__InvalidInstallmentCount();

    constructor(
        uint256 _checkInterval,
        uint64 _subscriptionId,
        string memory key
    ) FunctionsClient(ROUTER) Ownable(msg.sender) {
        i_checkInterval = _checkInterval;
        s_subscriptionId = _subscriptionId;
        s_nextPolicyId = 1;
        s_nextRecurringId = 1;
        APIKEY = key;
        
        // ETH/USD Price Feed base (Sepolia)
        i_ethUsdPriceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

   /**
     * @notice Add a weather station with regional risk factors
     */
    function addStation(
        string memory _stationId,
        uint256 _droughtMultiplier,
        uint256 _floodMultiplier,
        uint256 _windMultiplier
    ) external onlyOwner {
        require(!activeStations[_stationId], "Station already exists");
        require(_droughtMultiplier >= 1000 && _droughtMultiplier <= 3000, "Invalid drought multiplier");
        require(_floodMultiplier >= 1000 && _floodMultiplier <= 3000, "Invalid flood multiplier");
        require(_windMultiplier >= 1000 && _windMultiplier <= 3000, "Invalid wind multiplier");
        
        activeStations[_stationId] = true;
        stationIdByIndex[stationCount] = _stationId;
        lastCheckTimestamp[_stationId]= block.timestamp;
        stationCount++;
        
        stationRegionRisk[_stationId] = RegionRisk({
            droughtMultiplier: _droughtMultiplier,
            floodMultiplier: _floodMultiplier,
            windMultiplier: _windMultiplier,
            isSet: true
        });
        
        emit StationAdded(_stationId, stationRegionRisk[_stationId]);
    }
    
   

    /**
     * @notice Chainlink Functions callback
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (err.length > 0) {
            return;
        }

        string memory stationId = s_requestIdToStation[requestId];
        require(bytes(stationId).length > 0, "Unknown request");

        (uint8 droughtRisk, uint8 floodRisk, uint8 windRisk) = abi.decode(response, (uint8, uint8, uint8));

        // Store weather data
        s_stationWeatherHistory[stationId].push(WeatherRiskData({
            timestamp: block.timestamp,
            droughtRisk: droughtRisk,
            floodRisk: floodRisk,
            windRisk: windRisk
        }));

        emit WeatherRiskDataReceived(stationId, block.timestamp, droughtRisk, floodRisk, windRisk);

        // Process claims for this station
        _processClaimsForStation(stationId, droughtRisk, floodRisk, windRisk);

        // Clean up
        delete s_requestIdToStation[requestId];
    }

    /**
     * @notice Chainlink Automation upkeep check
     */
    function checkUpkeep(bytes calldata checkData) external view override returns (bool upkeepNeeded, bytes memory) {
        string memory stationId = string(checkData);

        upkeepNeeded = (block.timestamp - lastCheckTimestamp[stationId]) > i_checkInterval;
        
        return (upkeepNeeded, checkData);
    }

     /**
     * @notice Request weather data for a specific station
     */
    function requestWeatherData(string memory _stationId) public returns (bytes32 requestId)  {
        require(activeStations[_stationId], "Invalid station");
        require(bytes(APIKEY).length > 0, "API_KEY_NOT_SET");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(WEATHER_SOURCE);
        
        string[] memory args = new string[](2);
        args[0] = _stationId;
        args[1] = APIKEY;
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), s_subscriptionId, GAS_LIMIT, DON_ID);
        
        s_requestIdToStation[requestId] = _stationId;
        emit WeatherDataRequestSent(requestId, _stationId);
    }


    /**
     * @notice Chainlink Automation upkeep performance
     */
    function performUpkeep(bytes calldata performData) external override {
        string memory stationId = string(performData);
        require((block.timestamp - lastCheckTimestamp[stationId]) > i_checkInterval, "Upkeep not needed");
        
        lastCheckTimestamp[stationId] = block.timestamp;
        upkeepCheckCount++;
        

        requestWeatherData(stationId);
        
        emit AutomationPerformed(block.timestamp, stationCount);
    }


    /**
     * @notice Add supported payment token
     */
    function addSupportedPaymentToken(address _tokenAddress, address _priceFeedAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        
        s_supportedPaymentTokens[_tokenAddress] = AggregatorV3Interface(_priceFeedAddress);
        emit PaymentTokenAdded(_tokenAddress, _priceFeedAddress);
    }

    /**
     * @notice Remove supported payment token
     */
    function removeSupportedPaymentToken(address _tokenAddress) external onlyOwner {
        delete s_supportedPaymentTokens[_tokenAddress];
        emit PaymentTokenRemoved(_tokenAddress);
    }

    /**
     * @notice Get crop multiplier based on crop type
     */
    function getCropMultiplier(CropType _cropType) public pure returns (uint256) {
        if (_cropType == CropType.Corn) return 1000;      // 100% (base)
        if (_cropType == CropType.Wheat) return 950;      // 95%
        if (_cropType == CropType.Rice) return 1200;      // 120%
        if (_cropType == CropType.Soybean) return 1050;   // 105%
        if (_cropType == CropType.Cotton) return 1300;    // 130%
        if (_cropType == CropType.Vegetable) return 1400; // 140%
        if (_cropType == CropType.Fruit) return 1500;     // 150%
        return 1100; // Other crops: 110%
    }

    /**
     * @notice Get duration factor based on policy duration
     */
    function getDurationFactor(PolicyDuration _duration) public pure returns (uint256) {
        if (_duration == PolicyDuration.ThreeMonths) return 4000;  // 40% (3/12 months)
        if (_duration == PolicyDuration.SixMonths) return 6000;    // 60% (6/12 months)
        return 10000; // 100% (12/12 months)
    }

    /**
     * @notice Get policy duration in seconds
     */
    function getPolicyDurationSeconds(PolicyDuration _duration) public pure returns (uint256) {
        if (_duration == PolicyDuration.ThreeMonths) return POLICY_DURATION_3M;
        if (_duration == PolicyDuration.SixMonths) return POLICY_DURATION_6M;
        return POLICY_DURATION_12M;
    }

    /**
     * @notice Get seasonal risk multiplier
     */
    function getSeasonMultiplier() public view returns (uint256) {
        // Simplified seasonal adjustment - in practice, this would be more sophisticated
        uint256 month = (block.timestamp / 30 days) % 12;
        if (month >= 3 && month <= 8) { // Growing season
            return 12000; // 120%
        }
        return 8000; // 80% - off season
    }


    uint256 public constant MAX_DEDUCTIBLE_DISCOUNT = 2000; 

    /**
     * @notice Calculate realistic premium using comprehensive risk factors
     */
    function calculatePremium(
        uint256 _coverageAmount,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        string memory _stationId,
        uint256 _deductible
    ) public view returns (uint256 totalPremium, PremiumCalculation memory calculation) {
        require(stationRegionRisk[_stationId].isSet, "Station not configured");
        
        RegionRisk memory regionRisk = stationRegionRisk[_stationId];
        
        // Base risk rate varies by coverage type
        uint256 baseRiskRate;
        if (_coverageType == CoverageType.Drought) {
            baseRiskRate = BASE_RISK_RATE_MIN + 500; // 20%
        } else if (_coverageType == CoverageType.Flood) {
            baseRiskRate = BASE_RISK_RATE_MIN + 300; // 18%
        } else if (_coverageType == CoverageType.Wind) {
            baseRiskRate = BASE_RISK_RATE_MIN + 200; // 17%
        } else { // MultiPeril
            baseRiskRate = BASE_RISK_RATE_MAX; // 30%
        }
        
        // Get regional multiplier based on coverage type
        uint256 regionMultiplier;
        if (_coverageType == CoverageType.Drought) {
            regionMultiplier = regionRisk.droughtMultiplier;
        } else if (_coverageType == CoverageType.Flood) {
            regionMultiplier = regionRisk.floodMultiplier;
        } else if (_coverageType == CoverageType.Wind) {
            regionMultiplier = regionRisk.windMultiplier;
        } else { // MultiPeril - use highest regional risk
            regionMultiplier = regionRisk.droughtMultiplier;
            if (regionRisk.floodMultiplier > regionMultiplier) {
                regionMultiplier = regionRisk.floodMultiplier;
            }
            if (regionRisk.windMultiplier > regionMultiplier) {
                regionMultiplier = regionRisk.windMultiplier;
            }
        }
        
        calculation = PremiumCalculation({
            baseRiskRate: baseRiskRate,
            regionMultiplier: regionMultiplier,
            cropMultiplier: getCropMultiplier(_cropType),
            seasonMultiplier: getSeasonMultiplier(),
            loadingFactor: LOADING_FACTOR_MIN + 700, // 150% default
            durationFactor: getDurationFactor(_duration)
        });
        
        // Calculate premium: (Coverage × RiskRate × RegionMultiplier × CropMultiplier × SeasonMultiplier × DurationFactor × LoadingFactor) / BASIS_POINTS^5
        // Calculate premium step by step to avoid overflow
        // Start with base premium
        uint256 premium = (_coverageAmount * calculation.baseRiskRate) / BASIS_POINTS;
        
        // Apply region multiplier
        premium = (premium * calculation.regionMultiplier) / BASIS_POINTS;
        
        // Apply crop multiplier
        premium = (premium * calculation.cropMultiplier) / BASIS_POINTS;
        
        // Apply season multiplier
        premium = (premium * calculation.seasonMultiplier) / BASIS_POINTS;
        
        // Apply duration factor
        premium = (premium * calculation.durationFactor) / BASIS_POINTS;
        
        // Apply loading factor
        premium = (premium * calculation.loadingFactor) / BASIS_POINTS;
        
        // Add admin fee
        uint256 adminFee = (_coverageAmount * ADMIN_FEE_RATE) / BASIS_POINTS;
        premium += adminFee;
        
         if (_deductible > 0) {
            // Calculate discount percentage based on deductible
            uint256 deductiblePercentage = (_deductible * BASIS_POINTS) / _coverageAmount;
            // Cap the discount at MAX_DEDUCTIBLE_DISCOUNT
            uint256 discountRate = deductiblePercentage > MAX_DEDUCTIBLE_DISCOUNT 
                ? MAX_DEDUCTIBLE_DISCOUNT 
                : deductiblePercentage;
            
            discountRate = deductiblePercentage / 2;
            
            uint256 discount = (premium * discountRate) / BASIS_POINTS;
            premium = premium - discount;
        }
        
        totalPremium = premium;
    }

    /**
     * @notice Calculate premium in ERC20 tokens
     */
    function calculatePremiumInToken(
        address _tokenAddress,
        uint256 _coverageAmount,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        string memory _stationId,
        uint256 _deductible
    ) public view returns (uint256 tokenAmount) {
        require(address(s_supportedPaymentTokens[_tokenAddress]) != address(0), "Unsupported token");
        
        (uint256 premiumInEth, ) = calculatePremium(_coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible);
        
        // Get ETH/USD price
        int256 ethUsdPrice = getLatestPrice(i_ethUsdPriceFeed);
        require(ethUsdPrice > 0, "Invalid ETH price");
        
        // Get Token/USD price
        int256 tokenUsdPrice = getLatestPrice(s_supportedPaymentTokens[_tokenAddress]);
        require(tokenUsdPrice > 0, "Invalid token price");
        
        // Calculate token amount
        tokenAmount = (premiumInEth * uint256(ethUsdPrice)) / uint256(tokenUsdPrice);
    }

    /**
     * @notice Validate policy inputs
     */
    function _validatePolicyInputs(string memory _stationId, uint256 _coverageAmount, uint256 _deductible) internal view {
        require(activeStations[_stationId], "Invalid station");
        require(_coverageAmount >= MIN_COVERAGE && _coverageAmount <= MAX_COVERAGE, "Invalid coverage amount");
        require(_deductible <= _coverageAmount / 2, "Deductible too high");
    }

     /**
     * @notice Internal function to create policy
     */
    function _createPolicyInternal(
        string memory _stationId,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        uint256 _coverageAmount,
        uint256 _totalPremium,
        uint256 _paidPremium,
        address _paymentToken,
        uint256 _recurringPaymentId,
        uint256 _deductible
    ) internal returns (uint256) {
        uint256 policyId = s_nextPolicyId++;
        uint256 startDate = block.timestamp;

        Policy storage policy = s_policies[policyId];
        policy.id = policyId;
        policy.farmer = msg.sender;
        policy.stationId = _stationId;
        policy.coverageType = _coverageType;
        policy.cropType = _cropType;
        policy.duration = _duration;
        policy.coverageAmount = _coverageAmount;
        policy.totalPremium = _totalPremium;
        policy.paidPremium = _paidPremium;
        policy.startDate = startDate;
        policy.status = PolicyStatus.Active;
        policy.claimStatus = ClaimStatus.None;
        policy.deductible = _deductible;
        policy.paymentToken = _paymentToken;
        policy.recurringPaymentId = _recurringPaymentId;

        s_userPolicies[msg.sender].push(policyId);
        s_stationPolicies[_stationId].push(policyId);

        return policyId;
    }


     /**
     * @notice Create policy with one-time payment in ETH
     */
    function createPolicyOneTime(
        string memory _stationId,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        uint256 _coverageAmount,
        uint256 _deductible
    ) external payable nonReentrant {
        _validatePolicyInputs(_stationId, _coverageAmount, _deductible);

        (uint256 requiredPremium, ) = calculatePremium(
            _coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible
        );
        
        require(msg.value >= requiredPremium, "Insufficient premium");

        uint256 policyId = _createPolicyInternal(
            _stationId, _coverageType, _cropType, _duration, _coverageAmount,
            requiredPremium, requiredPremium, address(0), 0, _deductible
        );

        emit PolicyCreated(
            policyId, msg.sender, _stationId, _coverageType, _cropType,
            _coverageAmount, requiredPremium, address(0)
        );

        // Return excess payment
        if (msg.value > requiredPremium) {
            payable(msg.sender).transfer(msg.value - requiredPremium);
        }
    }

     /**
     * @notice Create policy with one-time payment in ERC20 tokens
     */
    function createPolicyOneTimeWithToken(
        string memory _stationId,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        uint256 _coverageAmount,
        uint256 _deductible,
        address _tokenAddress,
        uint256 _tokenAmount
    ) external nonReentrant {
        _validatePolicyInputs(_stationId, _coverageAmount, _deductible);
        require(address(s_supportedPaymentTokens[_tokenAddress]) != address(0), "Unsupported token");

        uint256 requiredTokenAmount = calculatePremiumInToken(
            _tokenAddress, _coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible
        );
        
        require(_tokenAmount >= requiredTokenAmount, "Insufficient token amount");

        IERC20 token = IERC20(_tokenAddress);
        require(token.transferFrom(msg.sender, address(this), requiredTokenAmount), "Token transfer failed");

        (uint256 premiumInEth, ) = calculatePremium(
            _coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible
        );

        uint256 policyId = _createPolicyInternal(
            _stationId, _coverageType, _cropType, _duration, _coverageAmount,
            premiumInEth, premiumInEth, _tokenAddress, 0, _deductible
        );

        emit PolicyCreated(
            policyId, msg.sender, _stationId, _coverageType, _cropType,
            _coverageAmount, premiumInEth, _tokenAddress
        );
    }


     /**
     * @notice Create policy with recurring payments in ETH
     */
    function createPolicyRecurring(
        string memory _stationId,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        uint256 _coverageAmount,
        uint256 _deductible,
        uint256 _installments
    ) external payable nonReentrant {
        _validatePolicyInputs(_stationId, _coverageAmount, _deductible);
        require(_installments >= 2 && _installments <= 12, "Invalid installment count");

        (uint256 totalPremium, ) = calculatePremium(
            _coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible
        );

        uint256 installmentAmount = totalPremium / _installments;
        require(msg.value >= installmentAmount, "Insufficient first installment");

        uint256 policyId = _createPolicyInternal(
            _stationId, _coverageType, _cropType, _duration, _coverageAmount,
            totalPremium, msg.value, address(0), 0, _deductible
        );

        // Create recurring payment plan
        uint256 recurringId = _createRecurringPayment(
            policyId, installmentAmount, _installments, address(0)
        );

        // Update policy with recurring payment ID
        s_policies[policyId].recurringPaymentId = recurringId;

        emit PolicyCreated(
            policyId, msg.sender, _stationId, _coverageType, _cropType,
            _coverageAmount, totalPremium, address(0)
        );

        // Return excess payment
        if (msg.value > installmentAmount) {
            payable(msg.sender).transfer(msg.value - installmentAmount);
        }
    }

    /**
     * @notice Internal function to create recurring payment
     */
    function _createRecurringPayment(
        uint256 _policyId,
        uint256 _installmentAmount,
        uint256 _totalInstallments,
        address _paymentToken
    ) internal returns (uint256) {
        uint256 recurringId = s_nextRecurringId++;
        uint256 paymentInterval = getPolicyDurationSeconds(s_policies[_policyId].duration) / _totalInstallments;

        RecurringPayment storage recurringPayment = s_recurringPayments[recurringId];
        recurringPayment.id = recurringId;
        recurringPayment.policyId = _policyId;
        recurringPayment.farmer = msg.sender;
        recurringPayment.installmentAmount = _installmentAmount;
        recurringPayment.totalInstallments = _totalInstallments;
        recurringPayment.paidInstallments = 1; // First payment already made
        recurringPayment.nextPaymentDue = block.timestamp + paymentInterval;
        recurringPayment.paymentInterval = paymentInterval;
        recurringPayment.paymentToken = _paymentToken;
        recurringPayment.isActive = true;

        s_userRecurringPayments[msg.sender].push(recurringId);

        emit RecurringPaymentCreated(recurringId, _policyId, msg.sender, _installmentAmount, _totalInstallments);

        return recurringId;
    }

     /**
     * @notice Create policy with recurring payments in ERC20 tokens
     */
    function createPolicyRecurringWithToken(
        string memory _stationId,
        CoverageType _coverageType,
        CropType _cropType,
        PolicyDuration _duration,
        uint256 _coverageAmount,
        uint256 _deductible,
        address _tokenAddress,
        uint256 _installments,
        uint256 _tokenAmount
    ) external nonReentrant {
        _validatePolicyInputs(_stationId, _coverageAmount, _deductible);
        require(_installments >= 2 && _installments <= 12, "Invalid installment count");
        require(address(s_supportedPaymentTokens[_tokenAddress]) != address(0), "Unsupported token");

        uint256 totalRequiredTokenAmount = calculatePremiumInToken(
            _tokenAddress, _coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible
        );

        uint256 installmentTokenAmount = totalRequiredTokenAmount / _installments;
        require(_tokenAmount >= installmentTokenAmount, "Insufficient token amount");

        IERC20 token = IERC20(_tokenAddress);
        require(token.transferFrom(msg.sender, address(this), installmentTokenAmount), "Token transfer failed");

        (uint256 premiumInEth, ) = calculatePremium(
            _coverageAmount, _coverageType, _cropType, _duration, _stationId, _deductible
        );

        uint256 policyId = _createPolicyInternal(
            _stationId, _coverageType, _cropType, _duration, _coverageAmount,
            premiumInEth, premiumInEth / _installments, _tokenAddress, 0, _deductible
        );

        // Create recurring payment plan
        uint256 recurringId = _createRecurringPayment(
            policyId, installmentTokenAmount, _installments, _tokenAddress
        );

        // Update policy with recurring payment ID
        s_policies[policyId].recurringPaymentId = recurringId;

        emit PolicyCreated(
            policyId, msg.sender, _stationId, _coverageType, _cropType,
            _coverageAmount, premiumInEth,  _tokenAddress
        );
    }

     /**
     * @notice Make recurring payment in ETH
     */
    function makeRecurringPayment(uint256 _recurringId) external payable nonReentrant {
        RecurringPayment storage recurringPayment = s_recurringPayments[_recurringId];
        require(recurringPayment.farmer == msg.sender, "Not authorized");
        require(recurringPayment.isActive, "Recurring payment inactive");
        require(block.timestamp >= recurringPayment.nextPaymentDue, "Payment not due");
        require(recurringPayment.paidInstallments < recurringPayment.totalInstallments, "Payment complete");

        require(msg.value >= recurringPayment.installmentAmount, "Insufficient payment");

        recurringPayment.paidInstallments++;
        recurringPayment.nextPaymentDue = block.timestamp + recurringPayment.paymentInterval;

        // Update policy paid premium
        Policy storage policy = s_policies[recurringPayment.policyId];
        policy.paidPremium += recurringPayment.installmentAmount;

        emit RecurringPaymentMade(
            _recurringId, recurringPayment.policyId, msg.sender,
            recurringPayment.paidInstallments, recurringPayment.installmentAmount
        );

        // Check if policy is fully paid
        if (recurringPayment.paidInstallments >= recurringPayment.totalInstallments) {
            recurringPayment.isActive = false;
            emit PolicyFullyPaid(recurringPayment.policyId, msg.sender, policy.paidPremium);
        }

        // Return excess payment
        if (msg.value > recurringPayment.installmentAmount) {
            payable(msg.sender).transfer(msg.value - recurringPayment.installmentAmount);
        }
    }


    /**
     * @notice Make recurring payment in ERC20 tokens
     */
    function makeRecurringPaymentWithToken(uint256 _recurringId, uint256 _tokenAmount) external nonReentrant {
        RecurringPayment storage recurringPayment = s_recurringPayments[_recurringId];
        require(recurringPayment.farmer == msg.sender, "Not authorized");
        require(recurringPayment.isActive, "Recurring payment inactive");
        require(block.timestamp >= recurringPayment.nextPaymentDue, "Payment not due");
        require(recurringPayment.paidInstallments < recurringPayment.totalInstallments, "Payment complete");
        require(recurringPayment.paymentToken != address(0), "ETH payments only");

        require(_tokenAmount >= recurringPayment.installmentAmount, "Insufficient token amount");

        IERC20 token = IERC20(recurringPayment.paymentToken);
        require(token.transferFrom(msg.sender, address(this), recurringPayment.installmentAmount), "Token transfer failed");

        recurringPayment.paidInstallments++;
        recurringPayment.nextPaymentDue = block.timestamp + recurringPayment.paymentInterval;

        // Update policy paid premium (in ETH equivalent)
        Policy storage policy = s_policies[recurringPayment.policyId];
        uint256 ethEquivalent = policy.totalPremium / recurringPayment.totalInstallments;
        policy.paidPremium += ethEquivalent;

        emit RecurringPaymentMade(
            _recurringId, recurringPayment.policyId, msg.sender,
            recurringPayment.paidInstallments, recurringPayment.installmentAmount
        );

        // Check if policy is fully paid
        if (recurringPayment.paidInstallments >= recurringPayment.totalInstallments) {
            recurringPayment.isActive = false;
            emit PolicyFullyPaid(recurringPayment.policyId, msg.sender, policy.paidPremium);
        }
    }



    

    /**
     * @notice Process claims for a specific station
     */
    function _processClaimsForStation(string memory _stationId, uint8 _droughtRisk, uint8 _floodRisk, uint8 _windRisk) internal {
        uint256[] memory stationPolicies = s_stationPolicies[_stationId];
        
        for (uint256 i = 0; i < stationPolicies.length; i++) {
            uint256 policyId = stationPolicies[i];
            Policy storage policy = s_policies[policyId];
            
            // Skip if policy is not active or already has a claim
            if (policy.status != PolicyStatus.Active || policy.claimStatus != ClaimStatus.None) {
                continue;
            }

            // Check if policy is fully paid
            if (policy.paidPremium < policy.totalPremium) {
                continue;
            }


            uint256 endDate = 0;

            if (policy.duration == PolicyDuration.ThreeMonths){
                endDate = policy.startDate + 90 days;
            }else if (policy.duration == PolicyDuration.SixMonths){
                endDate = policy.startDate + 180 days;
            }else{
                endDate = policy.startDate + 356 days;
            }

            // Check if policy is within coverage period
            if (block.timestamp < policy.startDate || block.timestamp > endDate) {
                continue;
            }

            // Assess claim based on coverage type
            ClaimAssessment memory assessment = _assessClaim(policy, _droughtRisk, _floodRisk, _windRisk);
            
            if (assessment.eligible) {
                policy.claimStatus = ClaimStatus.Approved;
                s_pendingPayouts[policyId] = assessment.payoutAmount;
                
                emit ClaimProcessed(policyId, policy.farmer, assessment.payoutAmount, ClaimStatus.Approved, assessment.reason);
            }
        }
    }

    /**
     * @notice Assess claim eligibility and calculate payout
     */
    function _assessClaim(Policy memory _policy, uint8 _droughtRisk, uint8 _floodRisk, uint8 _windRisk) internal view returns (ClaimAssessment memory) {
        ClaimAssessment memory assessment;
        assessment.policyId = _policy.id;
        assessment.assessmentDate = block.timestamp;
        
        bool triggered = false;
        uint256 maxPayout = _policy.coverageAmount - _policy.deductible;
        
        if (_policy.coverageType == CoverageType.Drought && _droughtRisk >= DROUGHT_RISK_THRESHOLD) {
            triggered = true;
            assessment.payoutAmount = (maxPayout * _droughtRisk) / 100;
            assessment.reason = "Drought conditions exceeded threshold";
        } else if (_policy.coverageType == CoverageType.Flood && _floodRisk >= FLOOD_RISK_THRESHOLD) {
            triggered = true;
            assessment.payoutAmount = (maxPayout * _floodRisk) / 100;
            assessment.reason = "Flood conditions exceeded threshold";
        } else if (_policy.coverageType == CoverageType.Wind && _windRisk >= WIND_RISK_THRESHOLD) {
            triggered = true;
            assessment.payoutAmount = (maxPayout * _windRisk) / 100;
            assessment.reason = "Wind conditions exceeded threshold";
        } else if (_policy.coverageType == CoverageType.MultiPeril) {
            // For multi-peril, trigger if any risk exceeds threshold
            uint8 maxRisk = _droughtRisk > _floodRisk ? _droughtRisk : _floodRisk;
            maxRisk = maxRisk > _windRisk ? maxRisk : _windRisk;
            
            if (maxRisk >= 70) {
                triggered = true;
                assessment.payoutAmount = (maxPayout * maxRisk) / 100;
                if (maxRisk == _droughtRisk) {
                    assessment.reason = "Multi-peril: Drought conditions exceeded threshold";
                } else if (maxRisk == _floodRisk) {
                    assessment.reason = "Multi-peril: Flood conditions exceeded threshold";
                } else {
                    assessment.reason = "Multi-peril: Wind conditions exceeded threshold";
                }
            }
        }
        
        assessment.eligible = triggered;
        return assessment;
    }

    /**
     * @notice Claim payout for approved claim
     */
    function claimPayout(uint256 _policyId) external nonReentrant {
        Policy storage policy = s_policies[_policyId];
        require(policy.farmer == msg.sender, "Not policy holder");
        require(policy.claimStatus == ClaimStatus.Approved, "No approved claim");
        require(s_pendingPayouts[_policyId] > 0, "No pending payout");

        uint256 payoutAmount = s_pendingPayouts[_policyId];
        require(address(this).balance >= payoutAmount, "Insufficient contract balance");

        policy.claimStatus = ClaimStatus.Paid;
        policy.status = PolicyStatus.Claimed;
        delete s_pendingPayouts[_policyId];

        payable(msg.sender).transfer(payoutAmount);

        emit PayoutClaimed(_policyId, msg.sender, payoutAmount);
        emit ClaimProcessed(_policyId, msg.sender, payoutAmount, ClaimStatus.Paid, "Payout claimed");
    }

     /**
     * @notice Get latest price from Chainlink price feed
     */
    function getLatestPrice(AggregatorV3Interface _priceFeed) internal view returns (int256) {
        (, int256 price, , , ) = _priceFeed.latestRoundData();
        return price;
    }

    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @notice Emergency withdraw tokens (owner only)
     */
    function emergencyWithdrawToken(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        token.transfer(owner(), token.balanceOf(address(this)));
    }

    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return s_userPolicies[_user];
    }

    /**
     * @notice Get user's recurring payments
     */
    function getUserRecurringPayments(address _user) external view returns (uint256[] memory) {
        return s_userRecurringPayments[_user];
    }

    /**
     * @notice Get station's policies
     */
    function getStationPolicies(string memory _stationId) external view returns (uint256[] memory) {
        return s_stationPolicies[_stationId];
    }

    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}


}