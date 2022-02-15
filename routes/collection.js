const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const IpfsSolver = require('../helpers/ipfsSolver');
const consts = require('../consts.json');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: consts.Cache.Cache_TTL });

router.get('/hot', async function (req, res, next) {
  if (await cache.get(req.originalUrl.toLowerCase())) {
    console.log('Cached collection');
    return res.status(200).json(cache.get(req.originalUrl.toLowerCase()));
  }
  try {
    const nfts = await getHotCollections();
    cache.set(req.originalUrl.toLowerCase(), nfts, consts.Cache.Cache_TTL);
    res.status(200).json(nfts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getHotCollections() {
  const nfts = await axios.get('https://api-mainnet.rarible.com/marketplace/api/v4/collections/hot');
  let moralisObjects = [];
  nfts.data.forEach(nft => {
    moralisObjects.push(convertToMoralisObject(nft));
  });
  return { nfts: moralisObjects };
}

function convertToMoralisObject(nft) {
  return {
    chain: 'eth',
    token_address: nft.id,
    token_id: 'Unknown',
    block_number_minted: 'Unknown',
    owner_of: 'Unknown',
    block_number: 'Unknown',
    amount: nft.count,
    contract_type: 'Unknown',
    name: nft.name,
    symbol: nft.symbol,
    token_uri: 'Unknown',
    metadata: {
      name: nft.name,
      external_link: 'Unknown',
      image: IpfsSolver(nft.pic ?? null),
      cover: IpfsSolver(nft.cover ?? null),
      attributes: [],
    },
    synced_at: 'Unknown',
    is_valid: 0,
    syncing: 2,
    frozen: 0,
  };
}

module.exports = router;
