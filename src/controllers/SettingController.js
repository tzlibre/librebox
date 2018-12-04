export default ['$scope', '$location', 'Storage', 'SweetAlert', function ($scope, $location, Storage, SweetAlert) {
  if (Storage.isWalletEmpty()) {
    $location.path('/new')
  }
  $scope.setting = Storage.loadSetting()
  $scope.privateKey = ''
  $scope.password = ''
  $scope.save = function () {
    Storage.setSetting($scope.setting)
    window.eztz.node.setProvider($scope.setting.rpc)
    $location.path('/main')
  }
  $scope.show = function () {
    if (!$scope.password) return SweetAlert.swal('Uh-oh!', 'Please enter your password')
    if ($scope.password === Storage.password) {
      $scope.privateKey = Storage.keys.sk
    } else {
      SweetAlert.swal('Uh-oh!', 'Incorrect password')
    }
  }
}]
