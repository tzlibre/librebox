import popup from '../helpers/popup'

export default ['$scope', '$location', 'Storage', 'SweetAlert', function ($scope, $location, Storage, SweetAlert) {
  $scope.type = 'ico' // seed/private_key/ico

  $scope.seed = ''
  $scope.passphrase = ''
  $scope.private_key = ''
  $scope.email = ''
  $scope.ico_password = ''
  $scope.activation_code = ''
  $scope.cancel = function () {
    $location.path('/new')
  }
  $scope.restore = function () {
    let keys
    if (['seed', 'ico'].indexOf($scope.type) >= 0 && !$scope.seed) return SweetAlert.swal('Uh-oh!', 'Please enter your seed words')
    if (['seed', 'ico'].indexOf($scope.type) >= 0 && !window.eztz.library.bip39.validateMnemonic($scope.seed)) return SweetAlert.swal('Uh-oh!', "Your seed words are not valid - please check to ensure you are not missing a word/letter, and you haven't included an extra space/line break")

    if ($scope.type === 'ico' && !$scope.ico_password) return SweetAlert.swal('Uh-oh!', 'Please enter your passphrase')
    if ($scope.type === 'ico' && !$scope.email) return SweetAlert.swal('Uh-oh!', 'Please enter your email from the ICO PDF')
    if ($scope.type === 'ico' && !$scope.address) return SweetAlert.swal('Uh-oh!', 'Please enter your address/Public Key Hash from the ICO PDF')
    if ($scope.type === 'private' && !$scope.private_key) return SweetAlert.swal('Uh-oh!', 'Please enter your private key')
    $scope.text = 'Restoring...'
    if ($scope.type === 'seed') {
      keys = window.eztz.crypto.generateKeys($scope.seed, $scope.passphrase)
    } else if ($scope.type === 'ico') {
      keys = window.eztz.crypto.generateKeys($scope.seed, $scope.email + $scope.ico_password)
      if ($scope.address !== keys.pkh) return SweetAlert.swal('Uh-oh!', "Your fundraiser details don't seem to match - please try again and ensure you are entering your details in correctly.")
    } else if ($scope.type === 'private') {
      keys = window.eztz.crypto.extractKeys($scope.private_key)
    }

    keys = { sk: keys.sk, pk: keys.pk, pkh: keys.pkh }
    const identity = {
      pkh: keys.pkh,
      accounts: [{ title: 'Main', address: keys.pkh, public_key: keys.pk }],
      account: 0
    }
    if ($scope.type === 'ico' && $scope.activation_code) {
      popup.showLoader()
      window.eztz.rpc.activate(keys.pkh, $scope.activation_code).then(function () {
        $scope.$apply(function () {
          popup.hideLoader()
          Storage.setStore(identity, keys)
          SweetAlert.swal('Awesome!', 'Activation was successful - please keep in mind that it may take a few minutes for your balance to show', 'success')
          Storage.ico = true
          Storage.restored = true
          $location.path('/encrypt')
        })
      }).catch(function (e) {
        $scope.$apply(function () {
          popup.hideLoader()
          return SweetAlert.swal('Uh-oh!', 'Activation was unsuccessful - please ensure the code is right, or leave it blank if you have already activated it')
        })
      })
    } else {
      Storage.setStore(identity, keys)
      Storage.restored = true
      $location.path('/encrypt')
    }
  }
}]
