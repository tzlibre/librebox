import popup from '../helpers/popup'

export default ['$scope', '$location', 'Storage', 'SweetAlert', function ($scope, $location, Storage, SweetAlert) {
  $scope.type = 'ledger' // seed/private_key/ico

  $scope.address = ''
  $scope.data = "44'/1729'/0'/0'"
  $scope.cancel = function () {
    $location.path('/new')
  }
  $scope.link = function () {
    if ($scope.type === 'ledger' && !$scope.data) return SweetAlert.swal('Uh-oh!', 'Please enter your address path for your ledger')
    if ($scope.type === 'offline' && !$scope.address) return SweetAlert.swal('Uh-oh!', 'Please enter the tz address to observe')

    $scope.text = 'Linking...'
    const cancelled = false
    let pp
    if ($scope.type === 'ledger') {
      SweetAlert.swal({
        title: 'Ledger',
        text: 'Please verify the address on your Ledger Nano S Device',
        type: 'warning',
        showCancelButton: true,
        showConfirmButton: false
      }).then(c => {
        if (!c) {
          popup.hideLoader()
        }
      })
      popup.showLoader()
      pp = window.tezledger.getAddress($scope.data)
        .then(r => window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(r.publicKey.substr(2)), window.eztz.prefix.edpk))
    }
    pp.then(function (pk) {
      $scope.$apply(function () {
        const address = window.eztz.utility.b58cencode(window.eztz.library.sodium.crypto_generichash(20, window.eztz.utility.b58cdecode(pk, window.eztz.prefix.edpk)), window.eztz.prefix.tz1)
        SweetAlert.swal('Awesome!', 'We have retreived the following address from your ledger device: ' + address + '!', 'success')
        const identity = {
          pkh: address,
          accounts: [{ title: 'Main', address: address, public_key: pk }],
          account: 0,
          link: true
        }
        Storage.setStore(identity, {
          pk: pk,
          pkh: address,
          sk: $scope.data,
          link: true
        })
        Storage.restored = true
        popup.hideLoader()
        $location.path('/encrypt')
      })
    }).catch(function (e) {
      if (cancelled) return
      popup.hideLoader()
      SweetAlert.swal('Uh-oh!', 'There was an issue connecting to your Ledger Nano S. Please ensure your device is connected, and the Tezos Wallet app is selected.')
    })
    // Validate address
  }
}]
