const express = require('express');
const router = express.Router();
const Moralis = require('moralis/node');
const axios = require('axios').default;
const NFTProfileModel = require('../models/NFTProfileModel');
Moralis.start({ appId: process.env.MORALIS_APP_ID, serverUrl: process.env.MORALIS_SERVER_URL });

/* GET users listing. */
router.get('/:chain/:address', async function (req, res, next) {
  const chain = req.params.chain.toLowerCase();
  const address = req.params.address;
  const secondsSinceEpoch = Math.round(Date.now() / 1000);

  const nftProfile = await NFTProfileModel.findOne(
    { chain: chain, address: address.toLowerCase() },
    { __v: 0, _id: 0, createdAt: 0, updatedAt: 0 }
  );
  if (nftProfile && secondsSinceEpoch - nftProfile.cachedAt < 5 * 60) {
    return res.status(200).json(nftProfile);
  }

  const options = { chain: chain, address: address };

  try {
    let nftData = await Moralis.Web3API.account.getNFTs(options);
    nftData = await enrichNFTData(nftData.result);

    let responseData = { nfts: nftData, chain: chain, address: address.toLowerCase(), cachedAt: secondsSinceEpoch };

    await NFTProfileModel.updateOne({ chain: chain, address: address }, responseData, { upsert: true, setDefaultsOnInsert: true });

    responseData.cached = false;

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function enrichNFTData(nftData) {
  await Promise.all(
    nftData.map(async nft => {
      if (!nft.metadata && nft.token_uri) {
        nft.token_uri = parseIPFSUrl(nft.token_uri);
        const response = await axios.get(nft.token_uri);
        nft.metadata = response.data;
      }
      try {
        nft.metadata = JSON.parse(nft.metadata);
      } catch (_) {}
      if (nft.metadata && nft.metadata.image) {
        nft.metadata.image = parseIPFSUrl(nft.metadata.image);
        nft.metadata.animation_url = parseIPFSUrl(nft.metadata.animation_url);
      }
    })
  );

  return nftData;
}

function parseIPFSUrl(url) {
  if (!url) return url;
  if (url.startsWith('ipfs://')) {
    url = url.split('ipfs://')[1];
    url = `https://cloudflare-ipfs.com/ipfs/${url}`;
  } else if (url.startsWith('https://ipfs.io/ipfs/')) {
    url = url.split('https://ipfs.io/ipfs/')[1];
    url = `https://cloudflare-ipfs.com/ipfs/${url}`;
  }
  return url;
}

module.exports = router;
