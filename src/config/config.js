const KYCTEZOS = 'KYCTEZOS'
const TZLIBRE = 'TZLIBRE'

export default {
  tzlTokenAddress: '0x6B91BC206eED0a8474F071339D1FD7eD7156f856',
  tzlibreBaseApi: 'https://www.tzlibre.io/api/v1',
  tzLibreAddress: 'tz1iDu3tHhf7H4jyXk6rGV4FNUsMqQmRkwLp',
  bankAddress: 'KT1V7VoyjbvqSmnRtv9pHkRuBCPT7UubCrCX',
  minBalanceWarning: 100,
  KYCTEZOS,
  TZLIBRE,
  defaultChain: KYCTEZOS,
  kycTezos: {
    rpc: 'https://mainnet.tezrpc.me',
    explorer: 'https://api1.tzscan.io/v1',
    public_explorer: 'https://tzscan.io'
  },
  tzlibre: {
    rpc: 'https://rpc.tzlibre.io',
    explorer: 'https://api-explorer.tzlibre.io/v1',
    public_explorer: 'https://explorer.tzlibre.io'
  },
  protos: {
    'PtCJ7pwoxe8JasnHY8YonnLYjcVHmhiARPJvqcC6VfHT5s8k8sY': 'Betanet',
    'PsYLVpVvgbLhAhoqAkMFUo6gudkJ9weNXhUYCiLDzcUpFpkk8Wt': 'Mainnet'
  },
  OTCAddress: 'tz1iDu3tHhf7H4jyXk6rGV4FNUsMqQmRkwLp',
  bankFee: 30000,
  bankGasLimit: 250000,
  bankStorageLimit: 277,

  originFee: 1285,
  originGasLimit: 10000,
  originStorageLimit: 257,

  txFee: 1420,
  txGasLimit: 10300,
  txStorageLimit: 300
}
