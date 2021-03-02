// const marketplaceServer = 'http://207.154.219.45:1823/api/v1/';
const marketplaceServer = 'http://192.168.0.116:1823/api/v1/';
const ipfsNode = 'https://ipfs.infura.io:5001';
const serviceAccountAddress = 'TBQRYGBRTOIIOVQQQENMCTL2RLW2DV3UPQ3RG3I';
const hoursList: number[] = [6, 12, 24, 48];
const MarketplaceConfig = { marketplaceServer, hoursList: hoursList, ipfsNode, serviceAccountAddress };
console.log('Marketplace Config resolved!', MarketplaceConfig);
export { MarketplaceConfig };
