function parseIPFSUrl(url) {
  if (!url) return url;
  if (url.startsWith('ipfs://')) {
    url = url.split('ipfs://')[1];
    url = `https://cloudflare-ipfs.com/ipfs/${url}`;
  } else if (url.startsWith('https://ipfs.io/ipfs/')) {
    url = url.split('https://ipfs.io/ipfs/')[1];
    url = `https://cloudflare-ipfs.com/ipfs/${url}`;
  }
  return url;
}

module.exports = parseIPFSUrl;
