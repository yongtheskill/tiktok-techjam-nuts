const TTCoin = artifacts.require('TTCoin');
const SessionManager = artifacts.require('SessionManager');
const PaymentProcessor = artifacts.require('PaymentProcessor');

module.exports = async function (deployer, network, accounts) {
  // Deploy TTCoin (TTCoin)
  await deployer.deploy(TTCoin);
  const tTCoin = await TTCoin.deployed();

  // Deploy SessionManager
  await deployer.deploy(SessionManager);
  const sessionManager = await SessionManager.deployed();

  // Deploy PaymentProcessor with addresses of TTCoin and SessionManager
  await deployer.deploy(PaymentProcessor, tTCoin.address, sessionManager.address);
  const paymentProcessor = await PaymentProcessor.deployed();

  // Authorize the PaymentProcessor contract in TTCoin
  await tTCoin.authorizeContract(paymentProcessor.address);

  console.log('minting');
  await tTCoin.mint(accounts[0], 1000000000);
  console.log('adding session');
  await sessionManager.startSession(accounts[1], 1000);
  console.log('approving');
  //   await tTCoin.approve(paymentProcessor.address, 5000, { from: accounts[0] });
  console.log('paying');
  //   console.log(await paymentProcessor.pay(accounts[1], 5000, { from: accounts[0] }));
  //   console.log(await paymentProcessor.sellCoins(5000, { from: accounts[0] }));
  //   console.log(await paymentProcessor.hi(3, { from: accounts[0] }));
  console.log(await tTCoin.transfer(accounts[1], 1000, { from: accounts[0] }));
};
