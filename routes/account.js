const express = require('express');
const router = express.Router();
const Moralis = require('moralis/node');
const axios = require('axios').default;

/* GET users listing. */
router.get('/:chain/:address', async function (req, res, next) {
  const chain = req.params.chain.toLowerCase();
  const address = req.params.address;

  Moralis.start({ appId: process.env.MORALIS_APP_ID, serverUrl: process.env.MORALIS_SERVER_URL });

  const options = { chain: chain, address: address };
  try {
    let nftData = await Moralis.Web3API.account.getNFTs(options);
    nftData = await enrichNFTData(nftData.result);
    const responseData = {nfts: nftData, chain: chain, address: address};

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function enrichNFTData(nftData) {
  await Promise.all(
    nftData.map(async nft => {
      if (!nft.metadata && nft.token_uri) {
        const response = await axios.get(nft.token_uri);
        nft.metadata = response.data;
      }
      try {
        nft.metadata = JSON.parse(nft.metadata);
      } catch (_) {}
    })
  );

  return nftData;
}

module.exports = router;
