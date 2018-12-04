export default ['$scope', '$location', 'Storage', '$sce', 'SweetAlert', function ($scope, $location, Storage, $sce, SweetAlert) {
  const ss = Storage.loadStore()
  if (Storage.isLogged()) {
    $location.path('/main')
  } else if (!Storage.isWalletEmpty()) {
    $location.path('/unlock')
  }
  $scope.cancel = function () {
    Storage.clearStore()
    $location.path('/new')
  }
  $scope.passphrase = ''
  $scope.mnemonic = ''
  $scope.validate = function () {
    const keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase)
    if (keys.pkh !== ss.pkh) {
      SweetAlert.swal('Uh-oh!', 'Sorry, those details do not match - please try again, or go back and create a new account again')
    } else {
      $location.path('/encrypt')
    }
  }
}]
