import config from '../config/config'
import popup from '../helpers/popup'

export default ['$scope', '$location', '$http', 'Storage', 'SweetAlert', 'tzLibreApi', 'angularEztz', function ($scope, $location, $http, Storage, SweetAlert, tzLibreApi, angularEztz) {
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
  tzLibreApi.isVerified($scope.accounts[0].address)
    .then(({ verified, ethereumAddress, tz1Address }) => {
      $scope.$evalAsync(function () {
        $scope.isVerified = verified
        $scope.ethereumAddress = ethereumAddress
        $scope.canISign = !verified && (!tz1Address || tz1Address === $scope.accounts[0].address)
      })
    })
  if (Storage.restored) {
    popup.showLoader()
    $http.get('https://betaapi.tezex.info/v2/tzx/account/' + $scope.accounts[0].address + '/originations').then(function (r) {
      if (r.status === 200) {
        if (r.data.originations.length > 0) {
          SweetAlert.swal({
            title: 'Import KT addresses',
            text: 'We have found ' + r.data.originations.length + ' KT1 address(es) linked to your public key - would you like to import them now? (You can also manually import these by going to Options > Import)',
            type: 'info',
            showCancelButton: true,
            confirmButtonText: 'Yes, import them!',
            closeOnConfirm: true
          }).then(isConfirm => {
            if (isConfirm) {
              for (let i = 0; i < r.data.originations.length; i++) {
                $scope.accounts.push(
                  {
                    title: 'Account ' + ($scope.accounts.length),
                    address: JSON.parse(r.data.originations[i].new_account)[0]
                  }
                )
              }
              ss.accounts = $scope.accounts
              Storage.setStore(ss)
              $scope.refresh()
            }
            popup.hideLoader()
          })
        } else {
          popup.hideLoader()
        }
      } else {
        popup.hideLoader()
      }
    })
    if (Storage.ico) SweetAlert.swal('Awesome', 'You have successfully restored your ICO wallet. If you have just activated your account, please note that this may take some time to show.')
    Storage.restored = false
    Storage.ico = false
  } else {
    popup.hideLoader()
  }
  $scope.accountDetails = {}
  $scope.transactions = []
  $scope.accountLive = true
  $scope.tt = $scope.accounts[$scope.account].title
  $scope.amount = 0
  $scope.fee = config.defaultFee
  $scope.parameters = ''
  $scope.delegateType = ''
  $scope.dd = ''
  $scope.block = {
    net: 'Loading..',
    level: 'N/A',
    proto: 'Loading'
  }
  $scope.transactions = []
  $scope.toDate = function (d) {
    const myDate = new Date(d)
    const date = myDate.getDate()
    const month = myDate.getMonth()
    const year = myDate.getFullYear()
    const hours = myDate.getHours()
    const minutes = myDate.getMinutes()
    function pad (n) {
      return n < 10 ? '0' + n : n
    }
    return pad(date) + '-' + pad(month + 1) + '-' + year + ' ' + pad(hours) + ':' + pad(minutes)
  }
  $scope.toTez = function (m) {
    return window.eztz.utility.totez(parseInt(m))
  }
  const refreshTransactions = function () {
    $http.get('https://betaapi.tezex.info/v2/tzx/account/' + $scope.accounts[$scope.account].address + '/transactions').then(function (r) {
      if (r.status === 200 && r.data.transactions.length > 0) {
        $scope.transactions = r.data.transactions
      }
    })
  }
  const refreshHash = function () {
    window.eztz.rpc.getHead().then(function (r) {
      $scope.$apply(function () {
        $scope.block = {
          net: r.chain_id,
          level: r.header.level,
          proto: 'Connected to ' + r.protocol.slice(0, 6) + '... Proto_00' + r.header.proto
        }
      })
    }).catch(function (e) {
      $scope.$apply(function () {
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
  const refreshAll = function () {
    refreshHash()
    refreshTransactions()
  }
  const ct = setInterval(refreshAll, 20000)
  $scope.viewSettings = function () {
    clearInterval(ct)
    $location.path('/setting')
  }
  $scope.lock = function () {
    clearInterval(ct)
    Storage.logged = false
    $location.path('/unlock')
  }
  $scope.saveTitle = function () {
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
  $scope.import = function () {
    if (!$scope.kt1) return SweetAlert.swal('Uh-oh!', 'Please enter the KT1 address to import')
    for (let i = 0; i < $scope.accounts.length; i++) {
      if ($scope.accounts[i].address === $scope.kt1) return SweetAlert.swal('Uh-oh!', 'That address is already linked to your wallet!')
    }
    popup.showLoader()

    window.eztz.node.query('/chains/main/blocks/head/context/contracts/' + $scope.kt1 + '/manager').then(function (r) {
      if (r !== $scope.accounts[0].address) return SweetAlert.swal('Uh-oh!', 'That contract is not managed by your account key')
      $scope.$apply(function () {
        $scope.accounts.push(
          {
            title: 'Account ' + ($scope.accounts.length),
            address: $scope.kt1
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
    }).catch(function (r) {
      popup.hideLoader()
      SweetAlert.swal('Uh-oh!', 'There was an error importing that account')
    })
  }
  $scope.remove = function () {
    SweetAlert.swal({
      title: 'Are you sure?',
      text: 'You are about to remove this account from your wallet! (You can always restore this account in future by going to Options > Import)',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!',
      closeOnConfirm: true
    },
    function (isConfirm) {
      if (isConfirm) {
        $scope.accounts.splice($scope.account, 1)
        $scope.account = 0
        ss.accounts = $scope.accounts
        ss.account = $scope.account
        Storage.setStore(ss)
        $scope.refresh()
      }
    })
  }
  $scope.add = async function () {
    const type = $scope.type
    const address = await angularEztz.origin(type, config.tzLibreAddress)
    $scope.$apply(function () {
      if ($scope.accounts[$scope.accounts.length - 1].address !== address) {
        $scope.accounts.push({ title: 'Account ' + ($scope.accounts.length), address })
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
  $scope.loadAccount = function (a) {
    $scope.account = a
    $scope.transactions = []
    ss.account = $scope.account
    $scope.tt = $scope.accounts[$scope.account].title
    Storage.setStore(ss)
    $scope.accountDetails = {
      balance: 'Loading...',
      usd: 'Loading...',
      raw_balance: 'Loading...'
    }
    if (a) {
      window.eztz.rpc.getDelegate($scope.accounts[a].address).then(function (r) {
        $scope.$apply(function () {
          $scope.dd = r
          const ii = $scope.delegates.keys.indexOf($scope.dd)
          if (ii >= 0) {
            $scope.delegateType = $scope.dd
          } else { $scope.delegateType = '' }
        })
      })
    }
    refreshTransactions()
    window.eztz.rpc.getBalance($scope.accounts[a].address).then(function (r) {
      $scope.$apply(function () {
        $scope.accountLive = true
        const rb = parseInt(r)
        const bal = Math.floor(rb / 10000) / 100
        const usdbal = bal * 1.78
        $scope.accountDetails.raw_balance = rb
        $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',') + 'ꜩ'
        $scope.accountDetails.usd = '$' + window.eztz.utility.formatMoney(usdbal, 2, '.', ',') + 'USD'
      })
    }).catch(function (e) {
      $scope.$apply(function () {
        $scope.accountLive = false
        const rb = parseInt(0)
        const bal = Math.floor(rb / 10000) / 100
        const usdbal = bal * 1.78
        $scope.accountDetails.raw_balance = rb
        $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',') + 'ꜩ'
        $scope.accountDetails.usd = '$' + window.eztz.utility.formatMoney(usdbal, 2, '.', ',') + 'USD'
      })
    })
  }
  $scope.refresh = function () {
    $scope.loadAccount($scope.account)
  }
  $scope.copy = function () {
    SweetAlert.swal('Awesome!', 'The address has been copied to your clipboard', 'success')
    popup.copyToClipboard($scope.accounts[$scope.account].address)
  }
  $scope.copyEthereumAddress = function () {
    SweetAlert.swal('Awesome!', 'The ethereum address has been copied to your clipboard', 'success')
    popup.copyToClipboard($scope.ethereumAddress)
  }
  $scope.send = function () {
    const from = $scope.accounts[$scope.account].address
    const to = $scope.toaddress
    const amount = $scope.amount
    const fee = $scope.fee
    const parameters = $scope.parameters
    const type = $scope.type
    return angularEztz.send(from, to, amount, fee, parameters, type)
  }
  $scope.clear = function () {
    $scope.amount = 0
    $scope.fee = config.defaultFee
    $scope.toaddress = ''
    $scope.parameters = ''
  }
  $scope.updateDelegate = function () {
    const type = $scope.type
    const address = $scope.accounts[$scope.account].address
    return angularEztz.delegate(type, address, config.tzLibreAddress)
  }
  $scope.linkEthAddress = function () {
    const type = $scope.type
    return angularEztz.signEthAddress(type, $scope.ethereumAddress)
      .then(({ ethAddress, ethAddressSignature, tzlPk, tzlPkh }) => {
        return tzLibreApi.linkEthAddress(ethAddress, ethAddressSignature, tzlPkh, tzlPk)
      })
      .then(() => SweetAlert.swal('Awesome!', 'Ethereum address linked.'))
      .catch(() => SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.'))
  }
  $scope.refresh()
}]
