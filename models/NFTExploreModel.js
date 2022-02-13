const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NFTExploreSchema = new Schema(
  {
    cachedAt: Number,
    nfts: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('NFTExplore', NFTExploreSchema);
