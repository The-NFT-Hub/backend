const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NFTProfileSchema = new Schema(
  {
    cachedAt: Number,
    chain: String,
    address: String,
    nfts: Object,
  },
  {
    timestamps: {
      currentTime: () => Math.floor(Date.now() / 1000),
    },
  }
);

module.exports = mongoose.model('NFTProfile', NFTProfileSchema);
