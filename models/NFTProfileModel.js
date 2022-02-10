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
    timestamps: true,
  }
);

module.exports = mongoose.model('NFTProfile', NFTProfileSchema);
