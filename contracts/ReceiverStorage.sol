// ReceiverStorage.sol

pragma solidity 0.5.16;

// IStateReceiver represents interface to receive state
interface IStateReceiver {
  function onStateReceive(uint256 stateId, bytes calldata data) external;
}

/**
@title ReceiverStorage
This contract helps receive and decode Tellor's data from Ethereum on Matic's Network
*/
contract ReceiverStorage {
  mapping(uint256 => mapping(uint256 => address)) public dataProvider;
  mapping(uint256 => mapping(uint256 => uint256)) public values;
  mapping(uint256 => mapping(uint256 => bool)) public set;
  mapping(uint256 => uint256[]) public timestamps;

  address constant STATE_SYNCER_ROLE = 0x0000000000000000000000000000000000001001;

  /**
  @dev This function allows Matic validators to provide Tellor's data. 
  @param stateId is used by Matic validators to uniquely identify the state when the byte data was provided ???
  @param data is the byte data with the specified output from an event on Ethereum
  */
  function onStateReceive(uint256 stateId, bytes calldata data) external {
    require(msg.sender == STATE_SYNCER_ROLE);
    (uint256 requestId, uint256 timestamp, uint256 value) = parse96BytesToThreeUint256(data);

    values[requestId][timestamp] = value;   // Save to values datastore
    timestamps[requestId].push(timestamp);
    set[requestId][timestamp] = true;
  }
  
  /**
  @dev This function returns data saved on this contract that is received through onStateReceive to be read 
  by centralized contract on Matic
  @param _requestId is Tellor's requestId to retreive
  @param _timestamp of value to retreive
  */
  function retrieveData(uint256 _requestId, uint256 _timestamp) public view returns(bool, uint256, address) {
    return(set[_requestId][_timestamp], values[_requestId][_timestamp],dataProvider[_requestId][_timestamp]);
  }

  /**
  @dev This function the latest timestamp and value for the specified requestId 
  @param _requestId is Tellor's requestId to retreive
  @return timestamp and value
  */
  function retreiveLatestValue(uint256 _requestId) public returns(uint256, uint256, address) {
    uint len = timestamps[_requestId].length;
    uint timestamp = timestamps[_requestId][len-1];
    values[_requestId][timestamp];
    return (timestamp, values[_requestId][timestamp], dataProvider[_requestId][timestamp]); 
  } 

  /**
  @dev This function allows the contract to decode the bytes data provided by Matic's validators
  @param data is the byte data with the specified output from an event on Ethereum
  */
  function parse96BytesToThreeUint256(bytes memory data) internal pure returns(uint256, uint256, uint256,address) {
    uint256 parsed1;
    uint256 parsed2;
    uint256 parsed3;
    address parsed4;
    assembly {
	    parsed1 := mload(add(data, 32))
	    parsed2 := mload(add(data, 64))
	    parsed3 := mload(add(data, 96))
      parsed4 := mload(add(data, 128))
    }
    return(parsed1, parsed2, parsed3, parsed4);
  }


  /**
  @dev This is a test function and will be commented out for production
  */
  function testProvideData(uint256 _requestId, uint256 _timestamp, uint256 _value, address _dataProvider) public  {
    values[_requestId][_timestamp] = _value;   // Save to values datastore
    timestamps[_requestId].push(_timestamp);
    set[_requestId][_timestamp] = true;
  }



}