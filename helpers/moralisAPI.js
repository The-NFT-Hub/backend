const axios = require('axios').default;

async function getNFTsByContract(address, chain) {
  const data = await axios.get(`https://deep-index.moralis.io/api/v2/nft/${address}?chain=${chain}&format=decimal`, {
    headers: {
      accept: 'application/json',
      'X-API-KEY': process.env.MORALIS_WEB_API_KEY,
    },
  });
  return data.data;
}

async function getNFTsByAccount(address, chain) {
  const data = await axios.get(`https://deep-index.moralis.io/api/v2/${address}/nft?chain=${chain}&format=decimal`, {
    headers: {
      accept: 'application/json',
      'X-API-KEY': process.env.MORALIS_WEB_API_KEY,
    },
  });
  return data.data;
}

module.exports = { getNFTsByContract, getNFTsByAccount };
