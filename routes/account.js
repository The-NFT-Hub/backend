const express = require('express');
const router = express.Router();
const Moralis = require('moralis/node');
const axios = require('axios').default;
const NFTProfileModel = require('../models/NFTProfileModel');
const IpfsSolver = require('../helpers/ipfsSolver');
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

  if (nftProfile) {
    res.status(200).json(nftProfile);
    fetchAccountInfo(address, chain);
  } else {
    const accountInfo = await fetchAccountInfo(address, chain);
    res.status(accountInfo.status).json(accountInfo.data);
  }
});

async function getProfileBanner(address) {
  console.log('Getting profile banner');
  try {
    const profileData = await axios.post(`https://api-mainnet.rarible.com/marketplace/api/v4/profiles/list`, [address]);
    return IpfsSolver(profileData.data[0].cover);
  } catch (e) {
    return null;
  }
}

async function fetchAccountInfo(address, chain) {
  const options = { chain: chain, address: address };
  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  const profileBanner = await getProfileBanner(address);

  try {
    let nftData = await Moralis.Web3API.token.getAllTokenIds(options);
    if (nftData.result.length == 0) {
      console.log('Getting data by account');
      nftData = await Moralis.Web3API.account.getNFTs(options);
    }
    nftData = await enrichNFTData(nftData.result, chain);

    let responseData = {
      nfts: nftData,
      chain: chain,
      address: address.toLowerCase(),
      cachedAt: secondsSinceEpoch,
      profileBanner: profileBanner,
    };

    await NFTProfileModel.updateOne({ chain: chain, address: address }, responseData, { upsert: true, setDefaultsOnInsert: true });

    responseData.cached = false;

    return { status: 200, data: responseData };
  } catch (err) {
    return { status: 500, data: { message: err } };
  }
}

async function enrichNFTData(nftData, chain) {
  await Promise.all(
    nftData.map(async nft => {
      nft.chain = chain;
      try {
        if (!nft.metadata && nft.token_uri) {
          nft.token_uri = IpfsSolver(nft.token_uri);
          const response = await axios.get(nft.token_uri);
          nft.metadata = response.data;
        }
        try {
          nft.metadata = JSON.parse(nft.metadata);
        } catch (_) {}
        if (nft.metadata && nft.metadata.image) {
          nft.metadata.image = IpfsSolver(nft.metadata.image);
          nft.metadata.animation_url = IpfsSolver(nft.metadata.animation_url);
        }
        nft = makeAttributesArray(nft);
      } catch (error) {
        console.log(`Something went wrong while getting nft metadata`, error.message);
      }
    })
  );

  nftData = nftData.filter(function (nftObject) {
    return nftObject.metadata != null;
  });

  return nftData;
}

function makeAttributesArray(nft) {
  if (nft.metadata && nft.metadata.attributes) {
    if (!Array.isArray(nft.metadata.attributes)) {
      console.log('Making array');
      nft.metadata.attributes = [nft.metadata.attributes];
    }
  }
  return nft;
}

module.exports = router;
