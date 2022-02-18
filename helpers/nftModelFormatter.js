function fixCollectionName(nft) {
  if (!nft.name && nft.metadata) {
    if (nft.metadata.collection) {
      nft.name = nft.metadata.collection;
    } else if (nft.metadata.name) {
      nft.name = nft.metadata.name;
      if (nft.name.includes('#')) {
        nft.name = nft.name.split('#')[0];
      }
    }
  }
  return nft;
}

function fixNFTMetadataName(nft) {
  if (nft.metadata && !nft.metadata.name) {
    nft.metadata.name = nft.name;
    if (!nft.metadata.name.includes('#')) {
      nft.metadata.name = `${nft.metadata.name} #${nft.metadata.edition ?? nft.token_id}`;
    }
  }
  if (nft.metadata && nft.metadata.name && nft.name) {
    if (nft.metadata.name.startsWith('#')) {
      nft.metadata.name = `${nft.name} ${nft.metadata.name}`.trim();
    }
  }
  return nft;
}

function makeAttributesArray(nft) {
  if (nft.metadata && nft.metadata.attributes) {
    if (!Array.isArray(nft.metadata.attributes)) {
      console.log('Making array');
      nft.metadata.attributes = [nft.metadata.attributes];
    }
    if (!module.exports.checkIfArrayIsObjectArray(nft.metadata.attributes)) {
      nft.metadata.attributes = [];
    }
  }
  return nft;
}

function checkIfArrayIsObjectArray(array) {
  let isObjectArray = false;
  if (array.length > 0) {
    isObjectArray = true;
    array.forEach(attribute => {
      if (typeof attribute !== 'object') {
        isObjectArray = false;
      }
    });
  }
  return isObjectArray;
}

module.exports = { fixCollectionName, fixNFTMetadataName, makeAttributesArray, checkIfArrayIsObjectArray };
