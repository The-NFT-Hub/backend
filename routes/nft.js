const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const IpfsSolver = require('../helpers/ipfsSolver');

/* Explore NFTs */
router.get('/explore', async function (req, res, next) {
  try {
    const nfts = await getExploreNFTIds();
    res.status(200).json(nfts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getExploreNFTIds() {
  const ids = await axios.post('https://api-mainnet.rarible.com/marketplace/search/v1/items', {
    size: 50,
    filter: {
      verifiedOnly: true,
      sort: 'LATEST',
      statuses: ['AUCTION', 'FIXED_PRICE', 'OPEN_FOR_OFFERS'],
      currency: '0x0000000000000000000000000000000000000000',
      hideItemsSupply: 'HIDE_LAZY_SUPPLY',
      nsfw: false,
    },
  });

  const nftData = await axios.post('https://api-mainnet.rarible.com/marketplace/api/v4/items/byIds', getNFTIdArray(ids.data));

  return { nfts: convertNFTListToMoralis(nftData.data) };
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
    name: nft.properties.name,
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
