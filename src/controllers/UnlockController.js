import popup from '../helpers/popup'
import config from '../config/config'

function UnlockController ($scope, $location, Storage, SweetAlert) {
  const defaultChain = Storage.loadSetting().defaultChain
  const pathRedirectMain = defaultChain === config.KYCTEZOS ? '/main' : '/main_tzlibre'
  if (Storage.isWalletEmpty()) {
    $location.path('/new')
  } else if (Storage.isLogged()) {
    $location.path(pathRedirectMain)
  }
  $scope.clear = function () {
    SweetAlert.swal({
      title: 'Are you sure?',
      text: "You are about to clear your LibreBox - note, unless you've backed up your seed words or private key you'll no longer have access to your accounts",
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      closeOnConfirm: true
    }).then(isConfirm => {
      $scope.$evalAsync(() => {
        if (isConfirm) {
          Storage.clearStore()
          $location.path('/new')
        }
      })
    })
  }
  $scope.unlock = function () {
    if (!$scope.password) return SweetAlert.swal('Uh-oh!', 'Please enter your password')
    if ($scope.password.length < 8) return SweetAlert.swal('Uh-oh!', 'Your password is too short')
    popup.showLoader()
    Storage.login($scope.password)
      .then(() => {
        $scope.$apply(function () {
          $location.path(pathRedirectMain)
        })
      })
      .catch((e) => {
        popup.hideLoader()
        SweetAlert.swal('Uh-oh!', 'Incorrect password')
      })
  }
}

UnlockController.$inject = [ '$scope', '$location', 'Storage', 'SweetAlert' ]

export default UnlockController
