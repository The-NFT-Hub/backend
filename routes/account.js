const express = require('express');
const router = express.Router();
const Moralis = require('moralis/node');
const axios = require('axios').default;

/* GET users listing. */
router.get('/:chain/:address', async function (req, res, next) {
  const chain = req.params.chain;
  const address = req.params.address;

  Moralis.start({ appId: process.env.MORALIS_APP_ID, serverUrl: process.env.MORALIS_SERVER_URL });

  const options = { chain: chain, address: address };
  try {
    const data = await Moralis.Web3API.account.getNFTs(options);

    res.json(await parseNFTData(data.result));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function parseNFTData(nftData) {
  let returnValue = [];
  nftData.forEach(async element => {
    let nft = element;
    if (!nft.metadata && nft.token_uri) {
      nft.metadata = (await axios.get(nft.token_uri)).response;
    }
    try {
      nft.metadata = JSON.parse(nft.metadata);
    } catch (_) {}
    returnValue.push(nft);
  });
  return returnValue;
}

module.exports = router;
