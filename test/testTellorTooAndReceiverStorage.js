const TellorPlayground = artifacts.require("./TellorPlayground.sol"); 
const UsingTellor = artifacts.require("./UsingTellor.sol"); 
const TellorSender = artifacts.require("./TellorSender.sol"); 
const MockSender = artifacts.require("./MockSender.sol")
const ReceiverStorage = artifacts.require("./ReceiverStorage.sol"); 
const TellorToo = artifacts.require("./TellorToo.sol");
const helpers = require("./helpers/test_helpers");

 contract("TellorToo Contract fx testing", function(accounts) {
  let mockTellor
  let mockSender
  let usingTellor
  let usingTellorMock
  let sender
  let receiverStorage
  let tellorToo

  beforeEach("Setup contract for each test", async function() {
    mockTellor= await TellorPlayground.new([accounts[0], accounts[1],accounts[2],accounts[3],accounts[4]], [5000,5000,5000,5000,5000])
    mockSender = await MockSender.new();
    usingTellorMock = await UsingTellor.new(mockTellor.address)
    receiverStorage = await ReceiverStorage.new()
  	sender = await TellorSender.new(mockTellor.address, mockSender.address, receiverStorage.address) 
    tellorToo = await TellorToo.new(receiverStorage.address, accounts[0], accounts[0],web3.utils.toWei("10"))
    //usingTellor = await UsingTellor.new(tellorToo.address)
  });

  it("Add new dataset to tellorToo and submit data ", async function() {
  	let _now  =  (Date.now() - (Date.now() % 84000))/1000;
    let _now1 = _now - 1800;
    await tellorToo.newDataset( 1,  3600)  //  can be disputed within one hour
    await tellorToo.submitData(1, _now1, 1000)
    let val1 = await tellorToo.retrieveData(1, _now1)
    await tellorToo.submitData(1, _now, 2000)
    let val2 = await tellorToo.retrieveData(1, _now)
    assert(val1==1000, "the value should be 1000")
    assert(val2==2000, "the value should be 2000")
   });

  it("getNewValueCountbyRequestId ", async function() {
  	let _now  =  (Date.now() - (Date.now() % 84000))/1000;
    let _now1 = _now - 84000;
    await tellorToo.newDataset( 1,  3600) 
    await tellorToo.submitData(1, _now1, 1000)
    await tellorToo.retrieveData(1, _now1)
    await tellorToo.submitData(1, _now, 2000)
    let count = await tellorToo.getNewValueCountbyRequestId(1)
    assert(count==2, "the count should be 2")
   });

  it(" getTimestampbyRequestIDandIndex ", async function() {
  	let _now  =  (Date.now() - (Date.now() % 84000))/1000;
    let _now1 = _now - 84000;
    await tellorToo.newDataset( 1,  3600) 
    await tellorToo.submitData(1, _now1, 1000)
    await tellorToo.retrieveData(1, _now1)
    await tellorToo.submitData(1, _now, 2000)
    let timestamp1 = await tellorToo.getTimestampbyRequestIDandIndex(1,0)
    let timestamp2 = await tellorToo.getTimestampbyRequestIDandIndex(1,1)
    assert(timestamp1==_now1, "the timesamtp should be now1")
    assert(timestamp2==_now, "the timesamtp should be _now")
   });

  it(" getTimestampbyRequestIDandIndex ", async function() {
  	let _now  =  (Date.now() - (Date.now() % 84000))/1000;
    let _now1 = _now - 84000;
    await tellorToo.newDataset( 1,  3600) 
    await tellorToo.submitData(1, _now1, 1000)
    await tellorToo.retrieveData(1, _now1)
    await tellorToo.submitData(1, _now, 2000)
    let timestamp1 = await tellorToo.getTimestampbyRequestIDandIndex(1,0)
    let timestamp2 = await tellorToo.getTimestampbyRequestIDandIndex(1,1)
    assert(timestamp1==_now1, "the timesamtp should be now1")
    assert(timestamp2==_now, "the timesamtp should be _now")
   });

  it(" Test challengeData and isUnderChallenge and settle challenge", async function() {
    //let _now  =  (Date.now() - (Date.now() % 84000))/1000;
    let _now  = ( (Date.now() /1000)| 0 );
    // console.log("now js", _now)
    // let _now1  =  await mockTellor.getTime()
    // console.log("now solidity", _now1*1)
    await tellorToo.newDataset( 1,3600) 
    await tellorToo.submitData(1, _now, 1000)
    let val =await tellorToo.retrieveData(1, _now)
    assert(val == 1000)
    await tellorToo.challengeData(1, _now,{from:accounts[2],value:web3.utils.toWei("10")}) 
    let dispute = await tellorToo.isUnderChallenge(1, _now)
    assert(dispute == true, "Value is not under dispute")
    val = await tellorToo.retrieveData(1, _now)
    assert(val == 0," no value should be available")
    await mockTellor.submitValue(1,8000);
    let res = await sender.getCurrentValueAndSend(1, {from: accounts[3]});
    let logdata = res.receipt.rawLogs[0].data
    logdata= logdata.substring(131)
    logdata = '0x' + logdata
    await receiverStorage.testOnStateRecieve(1,logdata);
    await helpers.advanceTime(3600)
    let balance1 = await web3.eth.getBalance(accounts[3]);
    await tellorToo.settleChallenge(1,_now);
    val = await tellorToo.retrieveData(1, _now)
    let balance2 = await web3.eth.getBalance(accounts[3]);
    assert(balance2 * 1 == (balance1 * 1) + web3.utils.toWei("10") * 1, "Data provider should have received challengeFee" )
    assert(val == 8000)
   });

  it("test three data points", async function() {
    let _now  =  (Date.now() - (Date.now() % 84000))/1000;
    //let _now  =  await mockTellor.getTime()
    await tellorToo.newDataset( 1,  3600) 
    await tellorToo.newDataset( 2,  60) 
    await tellorToo.newDataset( 3,  360) 
    for(var i=1;i<=3;i++){
      await tellorToo.submitData(i, _now - 1000 * i, 1000* i);
    }
    for(var i=1;i<=3;i++){
      val = await tellorToo.retrieveData(i, _now - 1000 * i);
      assert(val == 1000*i,"value should be correct");
    }
   });

  it("test challenge then resumption of optimistic oracle and assert throw of locked period", async function() {
    
    let _now  = ( (Date.now() /1000)| 0 ) + 3600 ;
    //console.log("now", _now)
    //let _now1  =  await mockTellor.getTime()
    //console.log("solidity now", _now1*1)
    await tellorToo.newDataset( 1,  3600) 
    await tellorToo.submitData(1, _now, 1000)
    let val =await tellorToo.retrieveData(1, _now)
    assert(val == 1000)
    await mockTellor.submitValue(1,8000);
    let res = await sender.getCurrentValueAndSend(1);
    let logdata = res.receipt.rawLogs[0].data
    logdata= logdata.substring(131)
    logdata = '0x' + logdata
    await receiverStorage.testOnStateRecieve(1,logdata);
    await tellorToo.challengeData(1, _now,{from:accounts[3],value:web3.utils.toWei("10")}) 
    let dispute = await tellorToo.isUnderChallenge(1, _now)
    assert(dispute == true, "Value is not under dispute")
    val = await tellorToo.retrieveData(1, _now)
    assert(val == 0," no value should be available")
    await helpers.expectThrow(tellorToo.submitData(1,_now-10,2000))
    await helpers.advanceTime(3600)
    await tellorToo.settleChallenge(1,_now);
    val = await tellorToo.retrieveData(1, _now)
    assert(val == 8000)
    await tellorToo.submitData(1, _now-10, 4000)
    val =await tellorToo.retrieveData(1, _now-10)
    assert(val == 4000)

   });
   it("test worst case scenario (broken centralized oracle, all disputes)", async function() {
    let val
    let res
    let logdata
    let dispute
    let _now
    for(var i=1;i<5;i++){
      let _now  = ( (Date.now() /1000)| 0 ) + (3600*(1+i));
      //let _nowSolidity  =  await mockTellor.getTime()
      //console.log("_nowSolidity", _nowSolidity*1)

      await tellorToo.newDataset( 1,  3600) 
      await tellorToo.submitData(1, _now, 1000*i)
      val =await tellorToo.retrieveData(1, _now)
      assert(val == 1000*i)
      await mockTellor.submitValue(1,8000*i);
      res = await sender.getCurrentValueAndSend(1);
      logdata = res.receipt.rawLogs[0].data
      logdata= logdata.substring(131)
      logdata = '0x' + logdata
      await receiverStorage.testOnStateRecieve(1,logdata);
      await tellorToo.challengeData(1, _now,{from:accounts[4],value:web3.utils.toWei("10")}) 
      dispute = await tellorToo.isUnderChallenge(1, _now)
      assert(dispute == true, "Value is not under dispute")
      val = await tellorToo.retrieveData(1, _now)
      assert(val == 0," no value should be available")
      await helpers.expectThrow(tellorToo.submitData(1,_now+ 1000,2000))
      await helpers.advanceTime(3600)
      await tellorToo.settleChallenge(1,_now);
      val = await tellorToo.retrieveData(1, _now)
      assert(val == 8000*i)
    }
   });
   // it("test central oracle usingTellor functions", async function() {
   //    //let _now  =  await mockTellor.getTime()
   //    let _now  =  (Date.now() - (Date.now() % 84000))/1000;
   //    await tellorToo.newDataset( 1,  3600) 
   //    await tellorToo.submitData(1, _now, 1000)
   //    let val = await usingTellor.retrieveData(1,_now);
   //    assert(val == 1000)
   //    val = await usingTellor.isInDispute(1,_now)
   //    assert(!val)
   //    val = await usingTellor.getNewValueCountbyRequestId(1)
   //    assert(val == 1)
   //    val = await usingTellor.getTimestampbyRequestIDandIndex(1,0)
   //    assert(val - _now == 0)
   //    val = await usingTellor.getCurrentValue(1)
   //    assert(val[0])
   //    assert(val[1] == 1000)
   //    assert(val[2] - _now == 0)
   //    val = await usingTellor.getIndexForDataBefore(1,_now+100)
   //    assert(val[0] == true)
   //    assert(val[1] == 0)
   //    val = await usingTellor.getDataBefore.call(1, _now+ 1000)
   //    assert(val[0])
   //    assert(val[1] == 1000)
   //    assert(val[2] - _now ==0 )
   // });
   // it("test worst case scenario using Tellor)", async function() {
   //  for(var i=1;i<5;i++){
   //        let val
   //    let res
   //    let logdata
   //    let dispute
   //    let _now
   //    //_now  =  await mockTellor.getTime()
   //    _now  =  (Date.now() - (Date.now() % 84000))/1000;
   //    await tellorToo.newDataset( 1,  3600) 
   //    await tellorToo.submitData(1, _now, 1000*i)
   //    val = await tellorToo.retrieveData(1, _now)
   //    assert(val == 1000*i)
   //    await mockTellor.submitValue(1,8000*i);
   //     res = await sender.getCurrentValueAndSend(1);
   //    logdata = res.receipt.rawLogs[0].data
   //    logdata= logdata.substring(131)
   //    logdata = '0x' + logdata
   //    await receiverStorage.testOnStateRecieve(1,logdata);
   //    await tellorToo.challengeData(1, _now,{from:accounts[i],value:web3.utils.toWei("10")}) 
   //    dispute = await tellorToo.isUnderChallenge(1, _now)
   //    assert(dispute == true, "Value is not under dispute")
   //    val = await tellorToo.retrieveData(1, _now)
   //    assert(val == 0," no value should be available")
   //    await helpers.expectThrow(tellorToo.submitData(1,_now+ 1000,2000))
   //    await helpers.advanceTime(3600)
   //    await tellorToo.settleChallenge(1,_now);
   //    val = await tellorToo.retrieveData(1, _now)
   //    assert(val == 8000*i)
   //    val = await usingTellor.retrieveData(1,_now);
   //    assert(val == 8000*i)
   //    val = await usingTellor.isInDispute(1,_now)
   //    assert(!val)
   //    val = await usingTellor.getNewValueCountbyRequestId(1)
   //    assert(val == i)
   //    val = await usingTellor.getTimestampbyRequestIDandIndex(1,i-1)
   //    assert(val -_now ==0)
   //    val = await usingTellor.getCurrentValue(1)
   //    assert(val[0])
   //    assert(val[1] == 8000*i)
   //    assert(val[2] - _now ==0)
   //    val = await usingTellor.getIndexForDataBefore(1,_now+10)
   //    assert(val[0] == true)
   //    assert(val[1] == i-1)
   //    val = await usingTellor.getDataBefore.call(1, _now+ 1000)
   //    assert(val[0])
   //    assert(val[1] == 8000*i)
   //    assert(val[2] -_now ==0)
   //  }
   // });

  // *********************Receiver/ Sender******************************************/
  it("Test onStateReceive", async function() {
    await mockTellor.submitValue(55,50001,{from:accounts[3]});
    let res = await sender.getCurrentValueAndSend(55,{from:accounts[3]});
    let logdata = res.receipt.rawLogs[0].data
    logdata= logdata.substring(131)
    logdata = '0x' + logdata
    await receiverStorage.testOnStateRecieve(1,logdata);
    let val = await receiverStorage.retrieveLatestValue(55)
    assert(val[1] == 50001, "Value should be correct")
    assert(val[0] > 0, "Timestamp should be correct")
    assert(val[2] == accounts[3], "Dataprovider should be correct")
    val = await receiverStorage.retrieveData(55,val[0])
    assert(val[0] == true)
    assert(val[1] == 50001)
    assert(val[2] == accounts[3])
  });

  it("Test retrieveDataAndSend", async function() {
    let res = await mockTellor.submitValue(58,2001,{from:accounts[5]});
    let val = await usingTellorMock.getCurrentValue(58)
    res = await sender.retrieveDataAndSend(58, val[2],{from:accounts[5]});
    let logdata = res.receipt.rawLogs[0].data
    logdata= logdata.substring(131)
    logdata = '0x' + logdata
    await receiverStorage.testOnStateRecieve(1,logdata);
    val = await receiverStorage.retrieveLatestValue(58)
    assert(val[1] == 2001, "Value should be correct")
    assert(val[0] > 0, "Timestamp should be correct")
    assert(val[2] == accounts[5], "Data provider should be correct")
    val = await receiverStorage.retrieveData(58,val[0])
    assert(val[0] == true)
    assert(val[1] == 2001)
    assert(val[2] == accounts[5])
  });
});