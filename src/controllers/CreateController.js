export default ['$scope', '$location', 'Storage', '$sce', function ($scope, $location, Storage, $sce) {
  $scope.passphrase = ''
  $scope.mnemonic = ''
  $scope.cancel = function () {
    $location.path('/new')
  }
  $scope.newMnemonic = function () {
    $scope.mnemonic = window.eztz.crypto.generateMnemonic()
  }
  $scope.showSeed = function (m) {
    const mm = m.split(' ')
    return $sce.trustAsHtml('<span>' + mm.join('</span> <span>') + '</span>')
  }
  $scope.newMnemonic()
  $scope.create = function () {
    let keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase)
    keys = { sk: keys.sk, pk: keys.pk, pkh: keys.pkh }
    const identity = {
      pkh: keys.pkh,
      accounts: [{ title: 'Main', address: keys.pkh, public_key: keys.pk }],
      account: 0
    }
    $scope.privateKey = keys.sk
    Storage.setStore(identity, keys)
    $location.path('/validate')
  }
}]
