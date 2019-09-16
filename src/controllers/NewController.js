export default ['$scope', '$location', 'Storage', function ($scope, $location, Storage) {
  $scope.setting = Storage.loadSetting()
  window.eztz.node.setProvider($scope.setting.rpc)

  const checkStore = function () {
    if (Storage.isLogged()) {
      $location.path('/main')
    } else if (!Storage.isWalletEmpty()) {
      $location.path('/unlock')
    }
  }
  if ($scope.setting.disclaimer) {
    checkStore()
  }
  $scope.acceptDisclaimer = function () {
    $scope.setting.disclaimer = true
    Storage.setSetting($scope.setting)
    checkStore()
  }
  $scope.restore = function () {
    $location.path('/restore')
  }
  $scope.link = function () {
    $location.path('/link')
  }
  $scope.create = function () {
    $location.path('/create')
  }
}]
