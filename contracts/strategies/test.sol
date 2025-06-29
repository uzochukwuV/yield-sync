// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Deploy on Sepolia

import {FunctionsClient} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.3.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract FunctionsConsumer is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    string public s_lastCity;   
    string public s_requestedCity;
    string public s_lastTemperature;

    // State variables to store the last request ID, response, and error
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    // Hardcoded for Sepolia
    // Supported networks https://docs.chain.link/chainlink-functions/supported-networks
    address constant ROUTER = 0xf9B8fc078197181C841c296C876945aaa425B278; //0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 constant DON_ID = 0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000;
        //0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    //Callback gas limit
    uint32 constant GAS_LIMIT = 300000;
    // JavaScript source code
    string public  constant SOURCE =
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
        "return Functions.encodeString(JSON.stringify([timestamp, temperature, humidity, precipitationRate, precipitationAccumulated, windSpeed, windGust, pressure]));";

    
    // Event to log responses
    event Response(
        bytes32 indexed requestId,
        string temperature,
        bytes response,
        bytes err
    );
    
    error UnexpectedRequestID(bytes32 requestId);

    constructor() FunctionsClient(ROUTER) {}

    function getTemperature(
        string memory stationId,
        string memory apikey,
        uint64 subscriptionId
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE); // Initialize the request with JS code

        string[] memory args = new string[](2);
        args[0] = stationId;
        args[1]= apikey;
        req.setArgs(args); // Set the arguments for the request

        // Send the request and store the request ID
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            GAS_LIMIT,
            DON_ID
        );

        // set the city for which we are obtaining the temperature
        s_requestedCity = stationId;
        return s_lastRequestId;
    }

    // Receive the weather in the city requested
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId); // Check if request IDs match
        }

        s_lastError = err;
        s_lastResponse = response;

        s_lastTemperature = string(response);
        s_lastCity = s_requestedCity;

        // Emit an event to log the response
        emit Response(requestId, s_lastTemperature, s_lastResponse, s_lastError);
    }
}