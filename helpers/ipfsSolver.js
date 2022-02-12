function parseIPFSUrl(url) {
  if (!url) return url;

  if (url.startsWith('ipfs://')) {
    url = url.split('ipfs://')[1];
  } else if (url.startsWith('https://ipfs.io/ipfs/')) {
    url = url.split('https://ipfs.io/ipfs/')[1];
  }
  if (url.startsWith('/ipfs/')) {
    url = url.split('/ipfs/')[1];
  }
  if (url.startsWith('ipfs/')) {
    url = url.split('ipfs/')[1];
  }
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    url = `https://gateway.ipfs.io/ipfs/${url}`;
  }
  return url;
}

module.exports = parseIPFSUrl;
