import popup from '../helpers/popup'
import config from '../config/config'

export default ['$scope', '$location', 'Storage', 'SweetAlert', function ($scope, $location, Storage, SweetAlert) {
  if (Storage.isWalletEmpty()) {
    $location.path('/new')
  }
  const defaultChain = Storage.loadSetting().defaultChain
  const pathRedirectMain = defaultChain === config.KYCTEZOS ? '/main' : '/main_tzlibre'
  $scope.setting = Storage.loadSetting()
  $scope.privateKey = ''
  $scope.password = ''
  $scope.save = function () {
    Storage.setSetting($scope.setting)
    window.eztz.node.setProvider($scope.setting.rpc)
    $location.path(pathRedirectMain)
  }
  $scope.show = async function () {
    if (!$scope.password) return SweetAlert.swal('Uh-oh!', 'Please enter your password')
    Storage.decryptPrivateKeys($scope.password)
      .then(({ sk }) => {
        $scope.$evalAsync(() => {
          $scope.privateKey = sk
          popup.hideLoader()
        })
      })
      .catch(e => {
        popup.hideLoader()
        SweetAlert.swal('Uh-oh!', 'Incorrect password')
      })
  }
}]
