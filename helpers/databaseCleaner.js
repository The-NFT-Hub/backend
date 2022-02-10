const NFTProfileModel = require('../models/NFTProfileModel');

async function cleanDatabase() {
  console.log('Cleaning database...');
  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  const nftProfiles = await NFTProfileModel.find({}, { __v: 0, _id: 0, createdAt: 0, updatedAt: 0 });
  for (let i = 0; i < nftProfiles.length; i++) {
    const nftProfile = nftProfiles[i];
    if (secondsSinceEpoch - nftProfile.cachedAt > 60 * 60) {
      await NFTProfileModel.deleteOne({ chain: nftProfile.chain, address: nftProfile.address });
    }
  }
  console.log('Database cleaned.');
}

module.exports = cleanDatabase;
