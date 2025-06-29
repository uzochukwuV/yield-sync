// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FunctionsClient} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts@1.3.0/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from "@chainlink/contracts@1.3.0/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {Ownable} from "@openzeppelin/contracts@5.2.0/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts@5.2.0/utils/ReentrancyGuard.sol";

contract WeatherInsurance is FunctionsClient, AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Configuration (Sepolia)
    address constant ROUTER = 0xf9B8fc078197181C841c296C876945aaa425B278; //0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 constant DON_ID = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;
        //0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    uint32 constant GAS_LIMIT = 300000;
    
    // ETH/USD Price Feed (Sepolia)
    AggregatorV3Interface internal immutable i_priceFeed;
    
    // Automation Configuration
    uint256 public immutable i_checkInterval; // 24 hours = 86400 seconds
    uint256 public lastCheckTimestamp;
    uint64 public s_subscriptionId;
    string private APIKEY;

    // Stations Management - Fixed
    mapping(string => bool) public activeStations;
    mapping(uint256 => string) public stationIdByIndex;
    uint256 public stationCount;

    // Policy Management
    uint256 private s_nextPolicyId;
    mapping(uint256 => Policy) public s_policies;
    mapping(address => uint256[]) public s_userPolicies;
    mapping(string => uint256[]) public s_stationPolicies; // stationId => policyIds
    mapping(bytes32 => uint256) public s_requestIdToPolicy; // requestId => policyId

    // Weather Data Storage
    mapping(string => WeatherData[]) public s_stationWeatherHistory; // stationId => weather data
    mapping(bytes32 => string) public s_requestIdToStation; // requestId => stationId

    // New: Pending Payouts
    mapping(uint256 => uint256) public s_pendingPayouts; // policyId => amount in wei

    // Constants
    uint256 public constant PREMIUM_RATE = 5; // 5% of coverage amount
    uint256 public constant MAX_COVERAGE = 10 ether; // Maximum coverage per policy
    uint256 public constant MIN_COVERAGE = 0.1 ether; // Minimum coverage per policy
    uint256 public constant POLICY_DURATION = 90 days; // 3 months

    // Enums
    enum PolicyStatus { Active, Expired, Claimed, Cancelled }
    enum CoverageType { Drought, Flood, Wind, MultiPeril }
    enum ClaimStatus { None, Pending, Approved, Rejected, Paid, PendingPayout }

    // Structs
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
        ThresholdConfig thresholds;
    }

    struct ThresholdConfig {
        uint256 droughtDays; // consecutive days
        uint256 droughtHumidityThreshold; // percentage
        uint256 droughtTempThreshold; // celsius * 100
        uint256 floodPrecipitationThreshold; // mm * 100
        uint256 floodCumulativeDays; // days to check
        uint256 windSpeedThreshold; // m/s * 100
        uint256 windOccurrences; // number of occurrences
    }

    struct WeatherData {
        uint256 timestamp;
        int256 temperature; // celsius * 100
        uint256 humidity; // percentage
        uint256 precipitationRate; // mm/hour * 100
        uint256 precipitationAccumulated; // mm * 100
        uint256 windSpeed; // m/s * 100
        uint256 windGust; // m/s * 100
        uint256 pressure; // hPa * 100
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
        uint256 premiumPaid
    );
    
    event WeatherDataReceived(
        string indexed stationId,
        uint256 timestamp,
        int256 temperature,
        uint256 humidity,
        uint256 precipitationRate
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

    // JavaScript source code for Chainlink Functions - Fixed JSON parsing
    string public constant WEATHER_SOURCE = 
        "const stationId = args[0];"
        "const apiKey = args[1];"
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: `https://pro.weatherxm.com/api/v1/stations/${stationId}/latest`,"
        "headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' }"
        "});"
        "if (!apiResponse.data || !apiResponse.data.observation) {"
        "throw Error('Invalid API response structure');"
        "}"
        "const data = apiResponse.data.observation;"
        "const timestamp = Math.floor(Date.parse(data.timestamp) / 1000);"
        "const temperature = Math.round((data.temperature || 0) * 100);"
        "const humidity = Math.round(data.humidity || 0);"
        "const precipitationRate = Math.round((data.precipitation_rate || 0) * 100);"
        "const precipitationAccumulated = Math.round((data.precipitation_accumulated || 0) * 100);"
        "const windSpeed = Math.round((data.wind_speed || 0) * 100);"
        "const windGust = Math.round((data.wind_gust || 0) * 100);"
        "const pressure = Math.round((data.pressure || 1013) * 100);"
        "return Functions.encodeString([timestamp, temperature, humidity, precipitationRate, precipitationAccumulated, windSpeed, windGust, pressure]);";

    // Errors
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

    constructor(
        uint256 _checkInterval,
        uint64 _subscriptionId
    ) FunctionsClient(ROUTER) Ownable(msg.sender) {
        i_checkInterval = _checkInterval;
        s_subscriptionId = _subscriptionId;
        lastCheckTimestamp = block.timestamp;
        s_nextPolicyId = 1;
        
        // ETH/USD Price Feed (Sepolia)
        i_priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

    function setAPIKEY(string calldata key) external  onlyOwner {
        APIKEY= key;
    }

    // Add a weather station - Fixed
    function addStation(string memory _stationId) external onlyOwner {
        if (activeStations[_stationId]) {
            revert WeatherInsurance__StationAlreadyExists();
        }
        
        activeStations[_stationId] = true;
        stationIdByIndex[stationCount] = _stationId;
        stationCount++;
        
        emit StationAdded(_stationId);
    }

    // Create a new insurance policy - Fixed validation
    function createPolicy(
        string memory _stationId,
        CoverageType _coverageType,
        uint256 _coverageAmount,
        uint256 _deductible,
        ThresholdConfig memory _thresholds
    ) external payable nonReentrant {
        if (_coverageAmount < MIN_COVERAGE || _coverageAmount > MAX_COVERAGE) {
            revert WeatherInsurance__InvalidCoverageAmount();
        }
        
        if (bytes(_stationId).length == 0 || !activeStations[_stationId]) {
            revert WeatherInsurance__InvalidStationId();
        }

        if (_deductible > 100) {
            revert("Deductible cannot exceed 100%");
        }

        uint256 requiredPremium = calculatePremium(_coverageAmount, _coverageType, _deductible);
        if (msg.value < requiredPremium) {
            revert WeatherInsurance__InsufficientPremium();
        }

        uint256 policyId = s_nextPolicyId++;
        
        Policy storage newPolicy = s_policies[policyId];
        newPolicy.id = policyId;
        newPolicy.farmer = msg.sender;
        newPolicy.stationId = _stationId;
        newPolicy.coverageType = _coverageType;
        newPolicy.coverageAmount = _coverageAmount;
        newPolicy.premiumPaid = msg.value;
        newPolicy.startDate = block.timestamp;
        newPolicy.endDate = block.timestamp + POLICY_DURATION;
        newPolicy.status = PolicyStatus.Active;
        newPolicy.claimStatus = ClaimStatus.None;
        newPolicy.deductible = _deductible;
        newPolicy.thresholds = _thresholds;

        s_userPolicies[msg.sender].push(policyId);
        s_stationPolicies[_stationId].push(policyId);

        emit PolicyCreated(
            policyId,
            msg.sender,
            _stationId,
            _coverageType,
            _coverageAmount,
            msg.value
        );

        // Return excess payment
        if (msg.value > requiredPremium) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - requiredPremium}("");
            require(success, "Refund failed");
        }
    }

    // Chainlink Automation: Check if upkeep is needed
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastCheckTimestamp) > i_checkInterval && stationCount > 0;
        performData = "";
    }

    // Chainlink Automation: Perform upkeep - Fixed
    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastCheckTimestamp) > i_checkInterval && stationCount > 0) {
            lastCheckTimestamp = block.timestamp;
            
            // Request weather data for each active station
            for (uint i = 0; i < stationCount; i++) {
                string memory stationId = stationIdByIndex[i];
                if (activeStations[stationId]) {
                    requestWeatherData(stationId,APIKEY);
                }
            }
            
            emit AutomationPerformed(block.timestamp, stationCount);
        }
    }

    // Request weather data from WeatherXM API - Fixed
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

    function requestWeatherDataEx(string calldata _stationId, string calldata _apikey) public returns (bytes32 requestId) {
        // Only owner or automation can call this
        // require(msg.sender == owner() || msg.sender == address(this), "Unauthorized");
        
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

    // Chainlink Functions callback - Fixed error handling and JSON parsing
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
            // Could emit an error event here for debugging
            return;
        }

        if (response.length == 0) {
            return;
        }

        // Decode the packed bytes directly into WeatherData struct fields
        (uint256 timestamp, int256 temperature, uint256 humidity, uint256 precipitationRate, uint256 precipitationAccumulated, uint256 windSpeed, uint256 windGust, uint256 pressure) = 
            abi.decode(response, (uint256, int256, uint256, uint256, uint256, uint256, uint256, uint256));

        WeatherData memory newWeatherData = WeatherData({
            timestamp: timestamp,
            temperature: temperature,
            humidity: humidity,
            precipitationRate: precipitationRate,
            precipitationAccumulated: precipitationAccumulated,
            windSpeed: windSpeed,
            windGust: windGust,
            pressure: pressure
        });
        
        // Store weather data
        s_stationWeatherHistory[stationId].push(newWeatherData);
        
        emit WeatherDataReceived(
            stationId,
            newWeatherData.timestamp,
            newWeatherData.temperature,
            newWeatherData.humidity,
            newWeatherData.precipitationRate
        );

        // Process claims for this station
        processClaimsForStation(stationId);

        // Clean up the mapping
        delete s_requestIdToStation[requestId];
    }

    // Manual claim processing function for external calls
    function processClaimsForStationExternal(string memory _stationId) external {
        require(activeStations[_stationId], "Invalid station");
        processClaimsForStation(_stationId);
    }

    // Process claims for a specific station - Fixed
    function processClaimsForStation(string memory _stationId) internal {
        uint256[] memory policyIds = s_stationPolicies[_stationId];
        
        for (uint i = 0; i < policyIds.length; i++) {
            Policy storage policy = s_policies[policyIds[i]];
            
            if (policy.status == PolicyStatus.Active && 
                policy.claimStatus == ClaimStatus.None &&
                block.timestamp <= policy.endDate) {
                
                ClaimAssessment memory assessment = assessClaim(policy, _stationId);
                
                if (assessment.eligible && assessment.payoutAmount > 0) {
                    // Instead of direct payout, store pending payout
                    s_pendingPayouts[policy.id] = assessment.payoutAmount;
                    policy.claimStatus = ClaimStatus.PendingPayout;
                    emit ClaimProcessed(policy.id, policy.farmer, assessment.payoutAmount, ClaimStatus.PendingPayout, assessment.reason);
                }
            }
        }
    }

    // New: Function for farmers to cash out their claims
    function cashOutClaim(uint256 _policyId) external nonReentrant {
        Policy storage policy = s_policies[_policyId];
        require(policy.farmer == msg.sender, "WeatherInsurance__NotPolicyHolder");
        require(s_pendingPayouts[_policyId] > 0, "WeatherInsurance__NoPendingPayout");

        uint256 amountToTransfer = s_pendingPayouts[_policyId];
        s_pendingPayouts[_policyId] = 0; // Reset pending payout
        policy.claimStatus = ClaimStatus.Paid;

        (bool success, ) = payable(msg.sender).call{value: amountToTransfer}("");
        if (!success) {
            revert WeatherInsurance__PayoutFailed();
        }

        emit PayoutClaimed(_policyId, msg.sender, amountToTransfer);
    }

    // Assess if a policy is eligible for payout - Fixed logic
    function assessClaim(
        Policy memory _policy,
        string memory _stationId
    ) internal view returns (ClaimAssessment memory) {
        WeatherData[] memory weatherHistory = s_stationWeatherHistory[_stationId];
        
        if (weatherHistory.length < 3) { // Reduced minimum requirement for testing
            return ClaimAssessment({
                policyId: _policy.id,
                eligible: false,
                payoutAmount: 0,
                reason: "Insufficient weather data",
                assessmentDate: block.timestamp
            });
        }

        // Analyze based on coverage type
        if (_policy.coverageType == CoverageType.Drought) {
            return assessDroughtClaim(_policy, weatherHistory);
        } else if (_policy.coverageType == CoverageType.Flood) {
            return assessFloodClaim(_policy, weatherHistory);
        } else if (_policy.coverageType == CoverageType.Wind) {
            return assessWindClaim(_policy, weatherHistory);
        } else if (_policy.coverageType == CoverageType.MultiPeril) {
            // Check all conditions, return highest payout
            ClaimAssessment memory droughtAssessment = assessDroughtClaim(_policy, weatherHistory);
            ClaimAssessment memory floodAssessment = assessFloodClaim(_policy, weatherHistory);
            ClaimAssessment memory windAssessment = assessWindClaim(_policy, weatherHistory);
            
            ClaimAssessment memory bestAssessment = droughtAssessment;
            if (floodAssessment.payoutAmount > bestAssessment.payoutAmount) {
                bestAssessment = floodAssessment;
            }
            if (windAssessment.payoutAmount > bestAssessment.payoutAmount) {
                bestAssessment = windAssessment;
            }
            return bestAssessment;
        }

        return ClaimAssessment({
            policyId: _policy.id,
            eligible: false,
            payoutAmount: 0,
            reason: "Unknown coverage type",
            assessmentDate: block.timestamp
        });
    }

    // Assess drought conditions - Fixed boundary checks
    function assessDroughtClaim(
        Policy memory _policy,
        WeatherData[] memory _weatherHistory
    ) internal view returns (ClaimAssessment memory) {
        if (_weatherHistory.length == 0) {
            return ClaimAssessment({
                policyId: _policy.id,
                eligible: false,
                payoutAmount: 0,
                reason: "No weather data",
                assessmentDate: block.timestamp
            });
        }

        uint256 consecutiveDryDays = 0;
        uint256 maxConsecutiveDryDays = 0;
        
        // Check available data (limit to 30 days if more available)
        uint256 daysToCheck = _weatherHistory.length > 30 ? 30 : _weatherHistory.length;
        uint256 startIndex = _weatherHistory.length - daysToCheck;
        
        for (uint i = startIndex; i < _weatherHistory.length; i++) {
            WeatherData memory data = _weatherHistory[i];
            
            // Drought conditions: low humidity + high temperature + no precipitation
            bool isDroughtDay = (data.humidity < _policy.thresholds.droughtHumidityThreshold) &&
                               (data.temperature > int256(_policy.thresholds.droughtTempThreshold)) &&
                               (data.precipitationRate < 100); // < 1mm/hour
            
            if (isDroughtDay) {
                consecutiveDryDays++;
                if (consecutiveDryDays > maxConsecutiveDryDays) {
                    maxConsecutiveDryDays = consecutiveDryDays;
                }
            } else {
                consecutiveDryDays = 0;
            }
        }

        if (maxConsecutiveDryDays >= _policy.thresholds.droughtDays) {
            // Calculate payout based on severity
            uint256 payoutPercentage = 50;
            if (maxConsecutiveDryDays > _policy.thresholds.droughtDays) {
                payoutPercentage += (maxConsecutiveDryDays - _policy.thresholds.droughtDays) * 2;
            }
            if (payoutPercentage > 100) payoutPercentage = 100;
            
            // Apply deductible
            if (payoutPercentage > _policy.deductible) {
                payoutPercentage -= _policy.deductible;
                uint256 payoutAmount = (_policy.coverageAmount * payoutPercentage) / 100;
                
                return ClaimAssessment({
                    policyId: _policy.id,
                    eligible: true,
                    payoutAmount: payoutAmount,
                    reason: "Drought conditions exceeded threshold",
                    assessmentDate: block.timestamp
                });
            }
        }

        return ClaimAssessment({
            policyId: _policy.id,
            eligible: false,
            payoutAmount: 0,
            reason: "Drought threshold not met",
            assessmentDate: block.timestamp
        });
    }

    // Assess flood conditions - Fixed boundary checks
    function assessFloodClaim(
        Policy memory _policy,
        WeatherData[] memory _weatherHistory
    ) internal view returns (ClaimAssessment memory) {
        if (_weatherHistory.length == 0) {
            return ClaimAssessment({
                policyId: _policy.id,
                eligible: false,
                payoutAmount: 0,
                reason: "No weather data",
                assessmentDate: block.timestamp
            });
        }

        uint256 checkDays = _policy.thresholds.floodCumulativeDays;
        if (checkDays > _weatherHistory.length) checkDays = _weatherHistory.length;
        if (checkDays == 0) checkDays = 1;
        
        uint256 cumulativeRainfall = 0;
        uint256 maxDailyRate = 0;
        
        // Check recent days for cumulative rainfall
        uint256 startIndex = _weatherHistory.length - checkDays;
        for (uint i = startIndex; i < _weatherHistory.length; i++) {
            WeatherData memory data = _weatherHistory[i];
            cumulativeRainfall += data.precipitationAccumulated;
            if (data.precipitationRate > maxDailyRate) {
                maxDailyRate = data.precipitationRate;
            }
        }

        if (cumulativeRainfall > _policy.thresholds.floodPrecipitationThreshold || 
            maxDailyRate > _policy.thresholds.floodPrecipitationThreshold) {
            
            // Calculate payout based on excess rainfall
            uint256 excessRainfall = cumulativeRainfall > _policy.thresholds.floodPrecipitationThreshold 
                ? cumulativeRainfall - _policy.thresholds.floodPrecipitationThreshold 
                : maxDailyRate - _policy.thresholds.floodPrecipitationThreshold;
            
            uint256 payoutPercentage = 30;
            if (excessRainfall > 100) {
                payoutPercentage += (excessRainfall - 100) / 100; // 1% per mm excess over 1mm
            }
            if (payoutPercentage > 100) payoutPercentage = 100;
            
            // Apply deductible
            if (payoutPercentage > _policy.deductible) {
                payoutPercentage -= _policy.deductible;
                uint256 payoutAmount = (_policy.coverageAmount * payoutPercentage) / 100;
                
                return ClaimAssessment({
                    policyId: _policy.id,
                    eligible: true,
                    payoutAmount: payoutAmount,
                    reason: "Flood conditions exceeded threshold",
                    assessmentDate: block.timestamp
                });
            }
        }

        return ClaimAssessment({
            policyId: _policy.id,
            eligible: false,
            payoutAmount: 0,
            reason: "Flood threshold not met",
            assessmentDate: block.timestamp
        });
    }

    // Assess wind conditions - Fixed boundary checks
    function assessWindClaim(
        Policy memory _policy,
        WeatherData[] memory _weatherHistory
    ) internal view returns (ClaimAssessment memory) {
        if (_weatherHistory.length == 0) {
            return ClaimAssessment({
                policyId: _policy.id,
                eligible: false,
                payoutAmount: 0,
                reason: "No weather data",
                assessmentDate: block.timestamp
            });
        }

        uint256 highWindEvents = 0;
        uint256 maxWindSpeed = 0;
        
        // Check available data (limit to 7 days)
        uint256 daysToCheck = _weatherHistory.length > 7 ? 7 : _weatherHistory.length;
        uint256 startIndex = _weatherHistory.length - daysToCheck;
        
        for (uint i = startIndex; i < _weatherHistory.length; i++) {
            WeatherData memory data = _weatherHistory[i];
            uint256 maxWind = data.windSpeed > data.windGust ? data.windSpeed : data.windGust;
            
            if (maxWind > _policy.thresholds.windSpeedThreshold) {
                highWindEvents++;
            }
            if (maxWind > maxWindSpeed) {
                maxWindSpeed = maxWind;
            }
        }

        if (highWindEvents >= _policy.thresholds.windOccurrences) {
            // Calculate payout based on severity
            uint256 payoutPercentage = 40;
            if (maxWindSpeed > _policy.thresholds.windSpeedThreshold) {
                payoutPercentage += (maxWindSpeed - _policy.thresholds.windSpeedThreshold) / 100; // 1% per 1 m/s excess
            }
            if (payoutPercentage > 100) payoutPercentage = 100;
            
            // Apply deductible
            if (payoutPercentage > _policy.deductible) {
                payoutPercentage -= _policy.deductible;
                uint256 payoutAmount = (_policy.coverageAmount * payoutPercentage) / 100;
                
                return ClaimAssessment({
                    policyId: _policy.id,
                    eligible: true,
                    payoutAmount: payoutAmount,
                    reason: "Wind conditions exceeded threshold",
                    assessmentDate: block.timestamp
                });
            }
        }

        return ClaimAssessment({
            policyId: _policy.id,
            eligible: false,
            payoutAmount: 0,
            reason: "Wind threshold not met",
            assessmentDate: block.timestamp
        });
    }
    // Add a new mapping to store premium rates per coverage type
    mapping(CoverageType => uint256) public s_coverageTypePremiumRates;

    // The contract owner would set these rates, e.g., in the constructor or a dedicated function:
    // s_coverageTypePremiumRates[CoverageType.Drought] = 5; // 5% base rate for Drought
    // s_coverageTypePremiumRates[CoverageType.Flood] = 6;  // 6% base rate for Flood
    // s_coverageTypePremiumRates[CoverageType.Wind] = 4;   // 4% base rate for Wind
    // s_coverageTypePremiumRates[CoverageType.MultiPeril] = 8; // 8% base rate for MultiPeril

    function calculatePremium(
        uint256 _coverageAmount,
        CoverageType _coverageType,
        uint256 _deductible
    ) public view returns (uint256) {
        // Get the base premium rate for the specific coverage type
        uint256 baseRate = s_coverageTypePremiumRates[_coverageType];
        require(baseRate > 0, "WeatherInsurance__PremiumRateNotSet");

        // Calculate the initial premium
        uint256 premium = (_coverageAmount * baseRate) / 100;

        // Apply a deductible discount: for every 1% of deductible, reduce premium by 0.5% (this is an example, can be adjusted)
        // Max discount would be 50% for a 100% deductible in this example.
        uint256 deductibleDiscountPercentage = _deductible / 2; 
        if (deductibleDiscountPercentage > 0) {
            premium = (premium * (100 - deductibleDiscountPercentage)) / 100;
        }

        return premium;
    }


    

    // Fallback function to receive ETH
    receive() external payable {}
    fallback() external payable {}
}

