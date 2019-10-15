import config from '../config/config'
import popup from '../helpers/popup'
import { retrieveBalanceByAddress } from '../utilities/bank'
import Web3 from 'web3'

export default ['$scope', '$location', '$http', 'Storage', 'SweetAlert', 'tzLibreApi', 'angularEztz', function($scope, $location, $http, Storage, SweetAlert, tzLibreApi, angularEztz) {
  const { tzLibreAddress, protos } = config
  const ss = Storage.loadStore()
  if (Storage.isWalletEmpty()) {
    $location.path('/new')
  }
  if (typeof ss.temp !== 'undefined') delete ss.temp
  if (!Storage.isLogged()) {
    $location.path('/unlock')
  }
  $scope.type = 'encrypted'
  if (ss.link) $scope.type = 'ledger'
  $scope.setting = Storage.loadSetting()
  window.eztz.node.setProvider($scope.setting.rpc)
  $scope.accounts = ss.accounts
  $scope.account = ss.account
  $http.get($scope.setting.explorer + '/operations/' + $scope.accounts[0].address + '?type=Origination')
    .then(function(r) {
      if (r.status === 200) {
        const newAccounts = r.data.filter(receivedAccounts => {
          const address = receivedAccounts.type.operations[0].tz1.tz
          const isNewKT1 = $scope.accounts.filter(a => a.address === address).length === 0
          return isNewKT1
        })
        if (newAccounts.length > 0) {
          SweetAlert.swal({
            title: 'Import KT addresses',
            text: 'We have found ' + r.data.length + ' KT1 address(es) linked to your public key - would you like to import them now? (You can also manually import these by going to Options > Import)',
            type: 'info',
            showCancelButton: true,
            confirmButtonText: 'Yes, import them!',
            closeOnConfirm: true
          }).then(isConfirm => {
            if (isConfirm) {
              const indexFrom = $scope.accounts.length
              for (let i = 0; i < newAccounts.length; i++) {
                $scope.accounts.push(
                  {
                    title: 'Account ' + (indexFrom + i),
                    address: r.data[i].type.operations[0].tz1.tz,
                    chain: config.TZLIBRE
                  }
                )
              }
              ss.accounts = $scope.accounts
              Storage.setStore(ss)
              $scope.refresh()
            }
            popup.hideLoader()
          })
        }
      }
    })
  $scope.accountDetails = {}
  $scope.transactions = []
  $scope.accountLive = true
  $scope.tt = $scope.accounts[$scope.account].title
  $scope.amount = 0
  $scope.amount_to_deposit = 0
  $scope.fee = config.txFee
  $scope.parameters = ''
  $scope.delegateType = 'n/a'
  $scope.dd = ''
  $scope.block = {
    net: 'Loading..',
    level: 'N/A',
    proto: 'Loading'
  }
  $scope.transactions = []
  $scope.toDate = function(d) {
    const myDate = new Date(d)
    const date = myDate.getDate()
    const month = myDate.getMonth()
    const year = myDate.getFullYear()
    const hours = myDate.getHours()
    const minutes = myDate.getMinutes()
    function pad(n) {
      return n < 10 ? '0' + n : n
    }
    return pad(date) + '-' + pad(month + 1) + '-' + year + ' ' + pad(hours) + ':' + pad(minutes)
  }
  $scope.toTez = function(m) {
    return window.eztz.utility.totez(parseInt(m))
  }
  const refreshTransactions = function() {
    $http.get($scope.setting.explorer + '/operations/' + $scope.accounts[$scope.account].address + '?type=Transaction').then(function(r) {
      if (r.status === 200 && r.data.length > 0) {
        $scope.transactions = r.data.map(tx => ({
          source: tx.type.source.tz,
          destination: tx.type.operations[0].destination.tz,
          time: tx.type.operations[0].timestamp,
          hash: tx.hash,
          amount: tx.type.operations[0].amount
        }))
      }
    })
  }
  const refreshHash = function() {
    window.eztz.rpc.getHead().then(function(r) {
      $scope.$apply(function() {
        $scope.block = {
          net: r.chain_id,
          level: r.header.level,
          proto: 'Connected to ' + r.protocol.slice(0, 6) + '... Proto_00' + r.header.proto
        }
      })
    }).catch(function(e) {
      $scope.$apply(function() {
        $scope.block = {
          net: 'Error',
          level: 'N/A',
          proto: 'Not Connected'
        }
      })
    })
  }
  refreshHash()
  refreshTransactions()
  const refreshAll = function() {
    refreshHash()
    refreshTransactions()
  }
  const ct = setInterval(refreshAll, 20000)
  $scope.viewSettings = function() {
    clearInterval(ct)
    $location.path('/setting')
  }
  $scope.lock = function() {
    clearInterval(ct)
    Storage.logged = false
    $location.path('/unlock')
  }
  $scope.delegate = function() {
    if (!$scope.dd || $scope.dd === '') {
      SweetAlert.swal('Uh-oh!', 'Please enter a delegate address')
      return
    }
    const type = $scope.type
    const address = $scope.accounts[$scope.account].address
    return angularEztz.delegate(type, address, $scope.dd)
  }
  $scope.saveTitle = function() {
    if (!$scope.tt) {
      SweetAlert.swal('Uh-oh!', 'Please enter a new title')
      return
    }
    $scope.accounts[$scope.account].title = $scope.tt
    ss.accounts = $scope.accounts
    Storage.setStore(ss)
    $scope.refresh()
  }
  $scope.kt1 = ''
  $scope.import = function() {
    if (!$scope.kt1) return SweetAlert.swal('Uh-oh!', 'Please enter the KT1 address to import')
    for (let i = 0; i < $scope.accounts.length; i++) {
      if ($scope.accounts[i].address === $scope.kt1) return SweetAlert.swal('Uh-oh!', 'That address is already linked to your wallet!')
    }
    popup.showLoader()

    window.eztz.node.query('/chains/main/blocks/head/context/contracts/' + $scope.kt1 + '/manager').then(function(r) {
      if (r !== $scope.accounts[0].address) return SweetAlert.swal('Uh-oh!', 'That contract is not managed by your account key')
      $scope.$apply(function() {
        $scope.accounts.push(
          {
            title: 'Account ' + ($scope.accounts.length),
            address: $scope.kt1,
            chain: config.TZLIBRE
          }
        )
        $scope.account = ($scope.accounts.length - 1)
        ss.accounts = $scope.accounts
        ss.account = $scope.account
        Storage.setStore(ss)
        $scope.refresh()
        $scope.kt1 = ''
        popup.hideLoader()
      })
    }).catch(function(r) {
      popup.hideLoader()
      SweetAlert.swal('Uh-oh!', 'There was an error importing that account')
    })
  }
  $scope.add_kt1_on_tzl = async function() {
    const type = $scope.type
    const address = await angularEztz.originOnTzl(type, config.tzLibreAddress)
    $scope.$apply(function() {
      if ($scope.accounts[$scope.accounts.length - 1].address !== address) {
        $scope.accounts.push({ title: 'Account ' + ($scope.accounts.length), address, chain: config.TZLIBRE })
        $scope.account = ($scope.accounts.length - 1)
        ss.accounts = $scope.accounts
        ss.account = $scope.account
        Storage.setStore(ss)
      } else {
        SweetAlert.swal('Uh-oh!', 'Error: awaiting existing origination to activate')
      }
      $scope.refresh()
      popup.hideLoader()
    })
  }
  $scope.delegates = {
    keys: [
      'false',
      tzLibreAddress
    ],
    names: [
      'Undelegated',
      'TzLibre'
    ]
  }
  $scope.loadAccount = function(a) {
    $scope.account = a
    $scope.transactions = []
    ss.account = $scope.account
    $scope.tt = $scope.accounts[$scope.account].title
    Storage.setStore(ss)
    $scope.accountDetails = {
      balance: 'n/a',
      bank_balance: 'n/a',
      tzl_balance: 'n/a',
      is_withdrawable: false,
      is_depositable: false,
      usd: 'Loading...',
      raw_balance: 'Loading...',
      loaded: false
    }
    if (a) {
      window.eztz.rpc.getDelegate($scope.accounts[a].address).then(function(r) {
        $scope.$apply(function() {
          $scope.dd = r
          const ii = $scope.delegates.keys.indexOf($scope.dd)
          if (ii >= 0) {
            $scope.delegateType = $scope.dd
          } else { $scope.delegateType = '' }
        })
      })
    }
    tzLibreApi.isVerified($scope.accounts[0].address)
      .then(({ verified, ethereumAddress }) => {
        $scope.$evalAsync(function() {
          $scope.ethereumAddress = ethereumAddress
        })
        if (ethereumAddress) {
          return tzLibreApi.getTzlBalanceByEthAddress(ethereumAddress)
        }
        return 0
      })
      .then(tzlBalance => {
        $scope.$evalAsync(function() {
          $scope.accountDetails.tzl_balance = tzlBalance
        })
      })

    refreshTransactions()

    retrieveBalanceByAddress($scope.accounts[a].address)
      .then(function(balance) {
        $scope.$apply(function() {
          $scope.accountDetails.bank_balance = balance
          $scope.accountDetails.is_withdrawable = balance > 0
        })
      })
      .catch(function() {
        $scope.$apply(function() {
          $scope.accountDetails.bank_balance = 0
          $scope.accountDetails.is_withdrawable = false
        })
      })
    window.eztz.rpc.getBalance($scope.accounts[a].address).then(function(r) {
      $scope.$apply(function() {
        $scope.accountLive = true
        const rb = parseInt(r)
        const bal = Math.floor(rb / 10000) / 100
        const usdbal = bal * 1.78
        $scope.accountDetails.raw_balance = rb
        $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',') + ' TZL'
        $scope.accountDetails.usd = '$' + window.eztz.utility.formatMoney(usdbal, 2, '.', ',') + 'USD'
        $scope.accountDetails.is_depositable = bal >= 1000
        $scope.amount_to_deposit = $scope.accountDetails.is_depositable ? Math.ceil((bal - 2) * 100) / 100 : 0
        $scope.accountDetails.loaded = true
      })
    }).catch(function(e) {
      $scope.$apply(function() {
        $scope.accountLive = false
        const rb = parseInt(0)
        const bal = Math.floor(rb / 10000) / 100
        const usdbal = bal * 1.78
        $scope.accountDetails.raw_balance = rb
        $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',') + ' TZL'
        $scope.accountDetails.usd = '$' + window.eztz.utility.formatMoney(usdbal, 2, '.', ',') + 'USD'
        $scope.accountDetails.loaded = false
      })
    })
  }
  $scope.refresh = function() {
    $scope.loadAccount($scope.account)
  }
  $scope.copy = function() {
    SweetAlert.swal('Awesome!', 'The address has been copied to your clipboard', 'success')
    popup.copyToClipboard($scope.accounts[$scope.account].address)
  }
  $scope.copyEthereumAddress = function() {
    SweetAlert.swal('Awesome!', 'The ethereum address has been copied to your clipboard', 'success')
    popup.copyToClipboard($scope.ethereumAddress)
  }
  $scope.send = function() {
    const from = $scope.accounts[$scope.account].address
    const to = $scope.toaddress
    const amount = $scope.amount
    const fee = $scope.fee
    const parameters = $scope.parameters
    const type = $scope.type
    return angularEztz.send(from, to, amount, fee, parameters, type)
  }
  $scope.deposit = function() {
    const from = $scope.accounts[$scope.account].address
    const to = 'KT1V7VoyjbvqSmnRtv9pHkRuBCPT7UubCrCX'
    const amount = $scope.amount_to_deposit
    const parameters = ''
    const type = $scope.type
    if ((($scope.accountDetails.raw_balance / 1000000) - amount) < 2) {
      return SweetAlert.swal('Uh-oh!', 'Not enough funds to pay for network fees (min. 2 TZL)')
    }
    return angularEztz.send(from, to, amount, config.bankFee, parameters, type, config.bankGasLimit, config.bankStorageLimit)
  }
  $scope.withdraw = function () {
    const from = $scope.accounts[$scope.account].address
    const to = 'KT1V7VoyjbvqSmnRtv9pHkRuBCPT7UubCrCX'
    const amount = 0.0001
    const parameters = ''
    const type = $scope.type
    if ((($scope.accountDetails.raw_balance / 1000000) - amount) < 2) {
      return SweetAlert.swal('Uh-oh!', 'Not enough funds to pay for network fees (min. 2 TZL)')
    }
    return angularEztz.send(from, to, amount, config.bankFee, parameters, type, config.bankGasLimit, config.bankStorageLimit)
  }
  $scope.wrap_tzl = async function () {
    const from = $scope.accounts[$scope.account].address
    let amount = parseFloat(await SweetAlert.askAmountTZLToSwap())
    const userDestination = '0x' + (await SweetAlert.getEthAddress('Ethereum address'))
    if (!/^(0x){1}[0-9a-fA-F]{40}$/i.test(userDestination)) {
      SweetAlert.swal('Uh-oh!', 'A valid ethereum address must be used.')
      return
    }
    try {
      await angularEztz.send(from, config.tzl_escrow_address, amount, 4000, `(Left \"${userDestination}\")`, $scope.type, '25000', '300')
    } catch (e) {
      SweetAlert.swal('Uh-oh!', 'Something went wrong')
    }

  }
  $scope.unwrap_tzl = async function () {

    // metamask is required
    if (!window.ethereum) {
      await SweetAlert.swal('Uh-oh!', 'Metamask is required. Please install it on your browser.')
      return
    }

    // librebox permission to use metamask
    try {
      await window.ethereum.enable()
    } catch (e) {
      await SweetAlert.swal('Uh-oh!', 'Librebox must be approved.')
    }

    const web3 = new Web3(window.ethereum)

    const zeroLeftPad = (str, size) => str.padStart(size, '0').slice(-size)

    let amount = parseFloat(await SweetAlert.askAmountWTZLToSwap())

    const fromUser = (await web3.eth.getAccounts())[0]

    const destinationEscrow = zeroLeftPad(config.eth_escrow_address.replace('0x', '').toLowerCase(), 64)

    let toUser = $scope.accounts[$scope.account].address
    toUser = window.web3.toHex(toUser).replace('0x', '')

    amount = window.web3.toWei(window.web3.toBigNumber(amount))
    amount = zeroLeftPad(window.web3.toHex(amount).replace('0x', ''), 64)

    const data = `0xa9059cbb${destinationEscrow}${amount}${toUser}`

    const tokenAddress = config.tzlTokenAddress

    web3.eth.sendTransaction({ from: fromUser, to: tokenAddress, value: 0, data }, async (err, res) => {
      if (!err)
        await SweetAlert.swal('Deposit bootstrapped', 'It will be completed in 48h.')
    })
  }
  $scope.clear = function () {
    $scope.amount = 0
    $scope.fee = config.txFee
    $scope.toaddress = ''
    $scope.parameters = ''
  }
  $scope.switchToKYCTezosNetwork = function() {
    Storage.setSetting({
      defaultChain: config.KYCTEZOS,
      ...config.kycTezos
    })
    $scope.loadAccount(0)
    $location.path('/main')
  }
  $scope.linkEthAddress = function() {
    const type = $scope.type
    return angularEztz.signEthAddress(type, $scope.ethereumAddress)
      .then(({ ethAddress, ethAddressSignature, tzlPk, tzlPkh }) => {
        return tzLibreApi.linkEthAddress(ethAddress, ethAddressSignature, tzlPkh, tzlPk)
      })
      .then((r) => {
        if (r.data && r.data.eth_addr && r.data.ok) {
          const ethAddress = r.data.eth_addr
          $scope.isVerified = true
          $scope.canISign = false
          $scope.ethereumAddress = ethAddress
          return SweetAlert.swal('Awesome!', 'Ethereum address linked.')
        }
        throw Error
      })
      .catch((e) => {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      })
  }
  $scope.mintOTC = function() {
    return (async () => {
      try {
        if (!$scope.isVerified) {
          await angularEztz.signEthAddress($scope.type, $scope.ethereumAddress, 'Link Ethereum Address', 'To mint OTC you have to sign your ethereum address.')
            .then(async ({ ethAddress, ethAddressSignature, tzlPkh, tzlPk }) => {
              return tzLibreApi.linkEthAddress(ethAddress, ethAddressSignature, tzlPkh, tzlPk)
            })
        }
        const from = $scope.accounts[$scope.account].address
        const amount = await SweetAlert.askAmountOTCBuy()
        return angularEztz.send(from, config.OTCAddress, amount, config.txFee)
      } catch (e) {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      }
    })()
  }
  $scope.activateTZL = function() {
    return (async () => {
      try {
        // @TODO 5.1 (title)
        // @TODO 5.2 (description)
        await angularEztz.signEthAddress($scope.type, $scope.ethereumAddress, 'Title1', 'Description1')
          .then(async ({ ethAddress, ethAddressSignature, tzlPkh, tzlPk }) => {
            await tzLibreApi.activateOnTzl(tzlPkh, tzlPk, ethAddress, ethAddressSignature)
            $scope.bookedForTzlActivation = true
            await $scope.refresh()
          })
      } catch (e) {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      }
    })()
  }
  $scope.bookForXtzActivation = function() {
    return (async () => {
      try {
        // @TODO 6.1 (title)
        // @TODO 6.2 (description)
        await angularEztz.signEthAddress($scope.type, $scope.ethereumAddress, 'Title2', 'Description2')
          .then(async ({ ethAddress, ethAddressSignature, tzlPkh, tzlPk }) => {
            // @TODO
            await tzLibreApi.bookForTzlActivation(tzlPkh, tzlPk, ethAddress, ethAddressSignature)
            $scope.bookedForXtzActivation = true
          })
      } catch (e) {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      }
    })()
  }
  $scope.refresh()
}]
