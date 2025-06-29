// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FunctionsClient} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts@1.3.0/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from "@chainlink/contracts@1.3.0/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts@5.2.0/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts@5.2.0/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts@5.2.0/utils/ReentrancyGuard.sol";

contract WeatherInsurance is FunctionsClient, AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    address constant ROUTER = 0xf9B8fc078197181C841c296C876945aaa425B278;
    bytes32 constant DON_ID = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;
    uint32 constant GAS_LIMIT = 300000;
    
    AggregatorV3Interface internal immutable i_ethUsdPriceFeed;
    
    uint256 public immutable i_checkInterval;
    uint256 public lastCheckTimestamp;
    uint64 public s_subscriptionId;
    string private s_apiKey;

    mapping(string => bool) public activeStations;
    mapping(uint256 => string) public stationIdByIndex;
    uint256 public stationCount;

    uint256 private s_nextPolicyId;
    mapping(uint256 => Policy) public s_policies;
    mapping(address => uint256[]) public s_userPolicies;
    mapping(string => uint256[]) public s_stationPolicies;
    mapping(bytes32 => uint256) public s_reqIdToPolicy;

    mapping(string => WeatherRiskData[]) public s_stationRiskHistory;
    mapping(bytes32 => string) public s_reqIdToStation;

    mapping(uint256 => uint256) public s_pendingPayouts;

    mapping(address => AggregatorV3Interface) public s_supportedTokens;

    uint256 public constant PREMIUM_RATE = 5;
    uint256 public constant MAX_COVERAGE = 10 ether;
    uint256 public constant MIN_COVERAGE = 0.1 ether;
    uint256 public constant POLICY_DURATION = 90 days;
    
    uint8 public constant DROUGHT_RISK_THRESHOLD = 70;
    uint8 public constant FLOOD_RISK_THRESHOLD = 70;
    uint8 public constant WIND_RISK_THRESHOLD = 70;

    enum PolicyStatus { Active, Expired, Claimed, Cancelled }
    enum CoverageType { Drought, Flood, Wind, MultiPeril }
    enum ClaimStatus { None, Pending, Approved, Rejected, Paid, PendingPayout }

    struct Policy {
        uint256 id;
        address farmer;
        string stationId;
        CoverageType covType;
        uint256 covAmt;
        uint256 premPaid;
        uint256 startDate;
        uint256 endDate;
        PolicyStatus status;
        ClaimStatus claimStatus;
        uint256 deductible;
        address payToken;
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
        uint256 payoutAmt;
        string reason;
        uint256 assessDate;
    }

    event PolicyCreated(uint256 indexed policyId, address indexed farmer, string stationId, CoverageType covType, uint256 covAmt, uint256 premPaid, address payToken);
    event WeatherRiskDataReceived(string indexed stationId, uint256 timestamp, uint8 droughtRisk, uint8 floodRisk, uint8 windRisk);
    event ClaimProcessed(uint256 indexed policyId, address indexed farmer, uint256 payoutAmt, ClaimStatus status, string reason);
    event AutomationPerformed(uint256 timestamp, uint256 policiesChecked);
    event WeatherDataRequestSent(bytes32 indexed requestId, string stationId);
    event StationAdded(string stationId);
    event PayoutClaimed(uint256 indexed policyId, address indexed farmer, uint256 amount);
    event PaymentTokenAdded(address indexed token, address indexed priceFeed);
    event PaymentTokenRemoved(address indexed token);

    string public constant WEATHER_SOURCE = "const ethers=await import(\"npm:ethers@6.10.0\");const apiResponse=await Functions.makeHttpRequest({url:`https://pro.weatherxm.com/api/v1/stations/${args[0]}/latest`,headers:{\'X-API-KEY\':args[1],\'Accept\':\'application/json\'}});const data=apiResponse.data.observation;const temperature=data.temperature||0;const feelsLike=data.feels_like||temperature;const dewPoint=data.dew_point||0;const humidity=data.humidity||0;const precipitationRate=data.precipitation_rate||0;const precipitationAccumulated=data.precipitation_accumulated||0;const windSpeed=data.wind_speed||0;const windGust=data.wind_gust||0;const uvIndex=data.uv_index||0;const solarIrradiance=data.solar_irradiance||0;const pressure=data.pressure||1013;let droughtRisk=0;if(humidity<20)droughtRisk+=35;else if(humidity<30)droughtRisk+=25;else if(humidity<40)droughtRisk+=15;if(precipitationRate<0.1&&precipitationAccumulated<1)droughtRisk+=25;else if(precipitationRate<0.5&&precipitationAccumulated<5)droughtRisk+=15;if(feelsLike>40)droughtRisk+=25;else if(feelsLike>35)droughtRisk+=20;else if(feelsLike>30)droughtRisk+=10;const dewPointSpread=temperature-dewPoint;if(dewPointSpread>20)droughtRisk+=10;else if(dewPointSpread>15)droughtRisk+=5;if(uvIndex>8&&solarIrradiance>800)droughtRisk+=5;droughtRisk=Math.min(droughtRisk,100);let floodRisk=0;if(precipitationRate>25)floodRisk+=60;else if(precipitationRate>15)floodRisk+=45;else if(precipitationRate>10)floodRisk+=30;else if(precipitationRate>5)floodRisk+=15;if(precipitationAccumulated>100)floodRisk+=40;else if(precipitationAccumulated>50)floodRisk+=25;else if(precipitationAccumulated>25)floodRisk+=15;floodRisk=Math.min(floodRisk,100);let windRisk=0;const maxWind=Math.max(windSpeed,windGust);const gustFactor=windGust/Math.max(windSpeed,1);if(maxWind>20)windRisk=100;else if(maxWind>15)windRisk=80;else if(maxWind>12)windRisk=60;else if(maxWind>10)windRisk=40;else if(maxWind>8)windRisk=25;else if(maxWind>6)windRisk=10;if(gustFactor>2.5&&windRisk>0)windRisk=Math.min(windRisk+15,100);else if(gustFactor>2.0&&windRisk>0)windRisk=Math.min(windRisk+10,100);const droughtRiskInt=Math.round(droughtRisk);const floodRiskInt=Math.round(floodRisk);const windRiskInt=Math.round(windRisk);const encoded=ethers.AbiCoder.defaultAbiCoder().encode([\'uint8\',\'uint8\',\'uint8\'],[droughtRiskInt,floodRiskInt,windRiskInt]);return Functions.encodeString(ethers.getBytes(encoded));";

    error InvalidCovAmt();
    error InvalidStationId();
    error PolicyNotFound();
    error PolicyNotActive();
    error UnauthorizedClaim();
    error InsufficientPrem();
    error PayoutFailed();
    error UnexpectedReqId(bytes32 requestId);
    error StationExists();
    error InsufficientBal();
    error NoPendingPayout();
    error NotPolicyHolder();
    error UnsupportedPayToken();
    error InvalidTokenAmt();
    error TokenTransferFailed();
    error PriceFeedErr();

    constructor(uint256 _checkInterval, uint64 _subId) FunctionsClient(ROUTER) Ownable(msg.sender) {
        i_checkInterval = _checkInterval;
        s_subscriptionId = _subId;
        lastCheckTimestamp = block.timestamp;
        s_nextPolicyId = 1;
        
        i_ethUsdPriceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

    function setAPIKEY(string calldata key) external onlyOwner {
        s_apiKey = key;
    }

    function addSupportedPaymentToken(address _token, address _priceFeed) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_priceFeed != address(0), "Invalid price feed address");
        
        s_supportedTokens[_token] = AggregatorV3Interface(_priceFeed);
        emit PaymentTokenAdded(_token, _priceFeed);
    }

    function removeSupportedPaymentToken(address _token) external onlyOwner {
        delete s_supportedTokens[_token];
        emit PaymentTokenRemoved(_token);
    }

    function addStation(string memory _stationId) external onlyOwner {
        if (activeStations[_stationId]) {
            revert StationExists();
        }
        
        activeStations[_stationId] = true;
        stationIdByIndex[stationCount] = _stationId;
        stationCount++;
        
        emit StationAdded(_stationId);
    }

    function getLatestPrice(AggregatorV3Interface _priceFeed) public view returns (int256 price) {
        (, price, , , ) = _priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
    }

    function calculatePremium(uint256 _covAmt, CoverageType _covType, uint256 _deductible) public pure returns (uint256 premium) {
        premium = (_covAmt * PREMIUM_RATE) / 100;
        
        if (_covType == CoverageType.MultiPeril) {
            premium = (premium * 150) / 100;
        }
        
        if (_deductible > 0) {
            premium = (premium * (100 - _deductible / 2)) / 100;
        }
    }

    function calculatePremiumInToken(address _token, uint256 _covAmt, CoverageType _covType, uint256 _deductible) public view returns (uint256 tokenAmt) {
        require(address(s_supportedTokens[_token]) != address(0), "Unsupported token");
        
        uint256 premEth = calculatePremium(_covAmt, _covType, _deductible);
        
        int256 ethUsd = getLatestPrice(i_ethUsdPriceFeed);
        require(ethUsd > 0, "Invalid ETH price");
        
        int256 tokenUsd = getLatestPrice(s_supportedTokens[_token]);
        require(tokenUsd > 0, "Invalid token price");
        
        tokenAmt = (premEth * uint256(ethUsd)) / uint256(tokenUsd);
    }

    function createPolicy(string memory _stationId, CoverageType _covType, uint256 _covAmt, uint256 _deductible) external payable nonReentrant {
        _validatePolicyInputs(_stationId, _covAmt, _deductible);

        uint256 reqPrem = calculatePremium(_covAmt, _covType, _deductible);
        if (msg.value < reqPrem) {
            revert InsufficientPrem();
        }

        uint256 pId = _createPolicyInternal(_stationId, _covType, _covAmt, _deductible, msg.value, address(0));

        emit PolicyCreated(pId, msg.sender, _stationId, _covType, _covAmt, msg.value, address(0));

        if (msg.value > reqPrem) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - reqPrem}("");
            require(success, "Refund failed");
        }
    }

    function createPolicyWithERC20(string memory _stationId, CoverageType _covType, uint256 _covAmt, uint256 _deductible, address _token, uint256 _tokenAmt) external nonReentrant {
        _validatePolicyInputs(_stationId, _covAmt, _deductible);
        
        if (address(s_supportedTokens[_token]) == address(0)) {
            revert UnsupportedPayToken();
        }

        uint256 reqTokenAmt = calculatePremiumInToken(_token, _covAmt, _covType, _deductible);
        if (_tokenAmt < reqTokenAmt) {
            revert InsufficientPrem();
        }

        IERC20 token = IERC20(_token);
        bool success = token.transferFrom(msg.sender, address(this), _tokenAmt);
        if (!success) {
            revert TokenTransferFailed();
        }

        uint256 pId = _createPolicyInternal(_stationId, _covType, _covAmt, _deductible, _tokenAmt, _token);

        emit PolicyCreated(pId, msg.sender, _stationId, _covType, _covAmt, _tokenAmt, _token);
    }

    function _createPolicyInternal(string memory _stationId, CoverageType _covType, uint256 _covAmt, uint256 _deductible, uint256 _premPaid, address _payToken) internal returns (uint256 pId) {
        pId = s_nextPolicyId++;
        
        Policy storage newPolicy = s_policies[pId];
        newPolicy.id = pId;
        newPolicy.farmer = msg.sender;
        newPolicy.stationId = _stationId;
        newPolicy.covType = _covType;
        newPolicy.covAmt = _covAmt;
        newPolicy.premPaid = _premPaid;
        newPolicy.startDate = block.timestamp;
        newPolicy.endDate = block.timestamp + POLICY_DURATION;
        newPolicy.status = PolicyStatus.Active;
        newPolicy.claimStatus = ClaimStatus.None;
        newPolicy.deductible = _deductible;
        newPolicy.payToken = _payToken;

        s_userPolicies[msg.sender].push(pId);
        s_stationPolicies[_stationId].push(pId);
    }

    function _validatePolicyInputs(string memory _stationId, uint256 _covAmt, uint256 _deductible) internal view {
        if (_covAmt < MIN_COVERAGE || _covAmt > MAX_COVERAGE) {
            revert InvalidCovAmt();
        }
        
        if (bytes(_stationId).length == 0 || !activeStations[_stationId]) {
            revert InvalidStationId();
        }

        if (_deductible > 100) {
            revert("Deductible cannot exceed 100%");
        }
    }

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastCheckTimestamp) > i_checkInterval && stationCount > 0;
        performData = "";
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastCheckTimestamp) > i_checkInterval && stationCount > 0) {
            lastCheckTimestamp = block.timestamp;
            
            for (uint i = 0; i < stationCount; i++) {
                string memory stationId = stationIdByIndex[i];
                if (activeStations[stationId]) {
                    requestWeatherData(stationId, s_apiKey);
                }
            }
            
            emit AutomationPerformed(block.timestamp, stationCount);
        }
    }

    function requestWeatherData(string memory _stationId, string memory _apiKey) public returns (bytes32 requestId) {
        require(msg.sender == owner() || msg.sender == address(this), "Unauthorized");
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(WEATHER_SOURCE);
        
        string[] memory args = new string[](2);
        args[0] = _stationId;
        args[1] = _apiKey;
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), s_subscriptionId, GAS_LIMIT, DON_ID);

        s_reqIdToStation[requestId] = _stationId;
        
        emit WeatherDataRequestSent(requestId, _stationId);
        return requestId;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        string memory stationId = s_reqIdToStation[requestId];
        if (bytes(stationId).length == 0) {
            return;
        }

        if (err.length > 0) {
            return;
        }

        if (response.length == 0) {
            return;
        }

        (uint8 droughtRisk, uint8 floodRisk, uint8 windRisk) = abi.decode(response, (uint8, uint8, uint8));

        WeatherRiskData memory newRiskData = WeatherRiskData({
            timestamp: block.timestamp,
            droughtRisk: droughtRisk,
            floodRisk: floodRisk,
            windRisk: windRisk
        });
        
        s_stationRiskHistory[stationId].push(newRiskData);
        
        emit WeatherRiskDataReceived(stationId, newRiskData.timestamp, newRiskData.droughtRisk, newRiskData.floodRisk, newRiskData.windRisk);

        processClaimsForStation(stationId);

        delete s_reqIdToStation[requestId];
    }

    function processClaimsForStationExternal(string memory _stationId) external {
        require(activeStations[_stationId], "Invalid station");
        processClaimsForStation(_stationId);
    }

    function processClaimsForStation(string memory _stationId) internal {
        uint256[] memory pIds = s_stationPolicies[_stationId];
        
        for (uint i = 0; i < pIds.length; i++) {
            Policy storage p = s_policies[pIds[i]];
            
            if (p.status == PolicyStatus.Active && p.claimStatus == ClaimStatus.None && block.timestamp <= p.endDate) {
                ClaimAssessment memory assessment = assessClaim(p, _stationId);
                
                if (assessment.eligible && assessment.payoutAmt > 0) {
                    s_pendingPayouts[p.id] = assessment.payoutAmt;
                    p.claimStatus = ClaimStatus.PendingPayout;
                    
                    emit ClaimProcessed(p.id, p.farmer, assessment.payoutAmt, ClaimStatus.PendingPayout, assessment.reason);
                }
            }
        }
    }

    function assessClaim(Policy memory _p, string memory _stationId) internal view returns (ClaimAssessment memory assessment) {
        assessment.policyId = _p.id;
        assessment.assessDate = block.timestamp;
        
        WeatherRiskData[] memory riskHistory = s_stationRiskHistory[_stationId];
        if (riskHistory.length == 0) {
            assessment.eligible = false;
            assessment.reason = "No weather data available";
            return assessment;
        }
        
        WeatherRiskData memory latestRisk = riskHistory[riskHistory.length - 1];
        
        bool riskExceeded = false;
        string memory riskType = "";
        
        if (_p.covType == CoverageType.Drought) {
            if (latestRisk.droughtRisk >= DROUGHT_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Drought";
            }
        } else if (_p.covType == CoverageType.Flood) {
            if (latestRisk.floodRisk >= FLOOD_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Flood";
            }
        } else if (_p.covType == CoverageType.Wind) {
            if (latestRisk.windRisk >= WIND_RISK_THRESHOLD) {
                riskExceeded = true;
                riskType = "Wind";
            }
        } else if (_p.covType == CoverageType.MultiPeril) {
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
            assessment.payoutAmt = _p.covAmt;
            
            if (_p.deductible > 0) {
                uint256 deductibleAmt = (assessment.payoutAmt * _p.deductible) / 100;
                assessment.payoutAmt -= deductibleAmt;
            }
            
            assessment.reason = string(abi.encodePacked(riskType, " risk threshold exceeded"));
        } else {
            assessment.eligible = false;
            assessment.reason = "Risk thresholds not exceeded";
        }
    }

    function claimPayout(uint256 _pId) external nonReentrant {
        Policy storage p = s_policies[_pId];
        
        if (p.farmer != msg.sender) {
            revert NotPolicyHolder();
        }
        
        if (p.claimStatus != ClaimStatus.PendingPayout) {
            revert NoPendingPayout();
        }
        
        uint256 payoutAmt = s_pendingPayouts[_pId];
        if (payoutAmt == 0) {
            revert NoPendingPayout();
        }
        
        p.status = PolicyStatus.Claimed;
        p.claimStatus = ClaimStatus.Paid;
        
        delete s_pendingPayouts[_pId];
        
        (bool success, ) = payable(msg.sender).call{value: payoutAmt}("");
        if (!success) {
            revert PayoutFailed();
        }
        
        emit PayoutClaimed(_pId, msg.sender, payoutAmt);
    }

    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return s_userPolicies[_user];
    }

    function getStationPolicies(string memory _stationId) external view returns (uint256[] memory) {
        return s_stationPolicies[_stationId];
    }

    function getStationWeatherHistory(string memory _stationId) external view returns (WeatherRiskData[] memory) {
        return s_stationRiskHistory[_stationId];
    }

    function isPaymentTokenSupported(address _token) external view returns (bool) {
        return address(s_supportedTokens[_token]) != address(0);
    }

    function emergencyWithdraw(uint256 _amt) external onlyOwner {
        require(_amt <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: _amt}("");
        require(success, "Withdrawal failed");
    }

    function emergencyWithdrawToken(address _token, uint256 _amt) external onlyOwner {
        IERC20 token = IERC20(_token);
        bool success = token.transfer(owner(), _amt);
        require(success, "Token withdrawal failed");
    }

    receive() external payable {}
}

