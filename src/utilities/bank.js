const fetch = window.fetch

export const retrieveBalanceByAddress = (address) => fetch(
  'https://rpc.tezrpc.me/chains/main/blocks/head/context/contracts/KT1V7VoyjbvqSmnRtv9pHkRuBCPT7UubCrCX/storage',
  {
    'headers': { 'content-type': 'application/json' },
    'method': 'GET',
    'mode': 'cors'
  })
  .then(r => r.json())
  .then(data => data.args[1].args[1].args[1].args[1].args[1].args[1].args[1].args[0])
  .then(list => {
    return list
      .map(l => ({
        address: l.args[0].string,
        balance: Math.floor(parseInt(l.args[1].int) / 1000000)
      }))
      .filter(l => l.balance > 0 && l.address === address)[0].balance || 0
  })
