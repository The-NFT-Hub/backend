const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const IpfsSolver = require('../helpers/ipfsSolver');
const NFTExplore = require('../models/NFTExploreModel');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 * 1 });

/* Explore NFTs */
router.get('/explore', async function (req, res, next) {
  if (cache.get(req.originalUrl)) {
    console.log('Cached');
    return res.status(200).json(cache.get(req.originalUrl));
  }

  try {
    const nfts = await getExploreNFTIds();
    cache.set(req.originalUrl, nfts, 60 * 1);
    res.status(200).json(nfts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getExploreNFTIds() {
  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  const nftData = (await NFTExplore.find({}))[0];
  if (nftData && secondsSinceEpoch - nftData.cachedAt < 1 * 60) {
    nftData.cached = true;
    return nftData;
  }
  if (nftData) {
    nftData.cached = true;
    //Updating cacheAt, to prevent multiple updates because of slow API..

    nftData.cachedAt = secondsSinceEpoch;
    nftData.save();
    fetchAndSave();
    return nftData;
  }

  return await fetchAndSave();
}

async function fetchAndSave() {
  console.log('Saving explore NFTs');
  const raribleData = await getExploreNFTIdsFromRarible();
  await NFTExplore.deleteMany({});

  const nftExplore = new NFTExplore();
  nftExplore.nfts = raribleData.nfts;
  nftExplore.cachedAt = Math.round(Date.now() / 1000);
  nftExplore.save();

  nftExplore.cached = false;
  console.log('Saved explore NFTs');
  return raribleData;
}

async function getExploreNFTIdsFromRarible() {
  const ids = await axios.post('https://api-mainnet.rarible.com/marketplace/search/v1/items', {
    size: 300,
    filter: {
      verifiedOnly: true,
      sort: 'LATEST',
      statuses: ['AUCTION', 'FIXED_PRICE', 'OPEN_FOR_OFFERS'],
      currency: '0x0000000000000000000000000000000000000000',
      hideItemsSupply: 'HIDE_LAZY_SUPPLY',
      nsfw: false,
      blockchains: ['ETHEREUM'],
    },
  });

  const nftData = await axios.post('https://api-mainnet.rarible.com/marketplace/api/v4/items/byIds', getNFTIdArray(ids.data));

  let nfts = convertNFTListToMoralis(nftData.data);
  nfts = nfts.filter(function (nftObject) {
    return nftObject.metadata != null && nftObject.metadata.image != null;
  });

  return { nfts: nfts };
}

function getNFTIdArray(nftData) {
  let returnValue = [];
  const keys = Object.keys(nftData);
  keys.forEach(key => {
    returnValue.push(nftData[key].id);
  });
  return returnValue;
}

function convertAttributesToMoralis(attributes) {
  let returnAttributes = [];
  attributes.forEach(attribute => {
    returnAttributes.push({ trait_type: attribute.key, value: attribute.value });
  });
  return returnAttributes;
}

function convertNFTListToMoralis(nfts) {
  let returnValue = [];
  nfts.forEach(nft => {
    returnValue.push(convertToMoralisObject(nft));
  });
  return returnValue;
}

function tryRemoveTokenID(nftName) {
  if (!nftName || nftName.length == 0) return nftName;
  try {
    if (nftName.includes('#')) {
      nftName = nftName.split('#')[0].trim();
    }
    nftName = nftName.split(/(\d+)/)[0].trim();
  } catch (e) {}

  return nftName;
}

function convertBlockhainToAppChain(chain) {
  switch (chain.toUpperCase()) {
    case 'ETHEREUM':
      return 'eth';
    case 'POLYGON':
      return 'polygon';
    case 'FANTOM':
      return 'fantom';
    default:
      return 'eth';
  }
}

function convertToMoralisObject(nft) {
  return {
    chain: convertBlockhainToAppChain(nft.blockchain),
    token_address: nft.token,
    token_id: nft.tokenId,
    block_number_minted: 'Unknown',
    owner_of: nft.ownership?.owner ?? 'Unknown',
    block_number: 'Unknown',
    amount: nft.totalStock.toString(),
    contract_type: 'Unknown',
    name: tryRemoveTokenID(nft.properties.name),
    symbol: 'Unknown',
    token_uri: 'Unknown',
    metadata: {
      name: nft.properties.name,
      external_link: 'Unknown',
      image: IpfsSolver(nft.properties.mediaEntries[0]?.url ?? null),
      attributes: convertAttributesToMoralis(nft.properties.attributes),
    },
    synced_at: 'Unknown',
    is_valid: 0,
    syncing: 2,
    frozen: 0,
  };
}

module.exports = router;
