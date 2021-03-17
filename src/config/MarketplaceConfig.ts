const marketplaceServer = 'http://207.154.219.45:1823/api/v1/';
const ipfsNode = 'https://ipfs.infura.io:5001';
const serviceAccountAddress = 'NCSRQULWH2DFEGRFIQH5QX6BV3QA55QGGADP6TIc';
const hoursList: number[] = [6, 12, 24, 48];
const MarketplaceConfig = { marketplaceServer, hoursList: hoursList, ipfsNode, serviceAccountAddress };
console.log('Marketplace Config resolved!', MarketplaceConfig);
export { MarketplaceConfig };
