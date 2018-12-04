import popup from '../helpers/popup'
import sjcl from 'sjcl'

export default ['$scope', '$location', 'Storage', 'SweetAlert', function ($scope, $location, Storage, SweetAlert) {
  const ss = Storage.loadStore()
  if (!Storage.isWalletEmpty() && Storage.isLogged()) {
    $location.path('/main')
  } else if (!Storage.isWalletEmpty()) {
    $location.path('/unlock')
  }
  $scope.cancel = function () {
    Storage.clearStore()
    $location.path('/new')
  }
  $scope.password = ''
  $scope.password2 = ''
  $scope.encrypt = function () {
    if (!$scope.password || !$scope.password2) return SweetAlert.swal('Uh-oh!', 'Please enter your password')
    if ($scope.password.length < 8) return SweetAlert.swal('Uh-oh!', 'Your password is too short')
    if ($scope.password !== $scope.password2) return SweetAlert.swal('Uh-oh!', 'Passwords do not match')

    // Validate
    const spaces = $scope.password.match(/\s+/g)
    const numbers = $scope.password.match(/\d+/g)
    const uppers = $scope.password.match(/[A-Z]/)
    const lowers = $scope.password.match(/[a-z]/)
    const special = $scope.password.match(/[!@#$%&*]/)

    if (spaces !== null) return SweetAlert.swal('Uh-oh!', "Your password can't include any spaces")
    if (uppers === null || lowers === null) return SweetAlert.swal('Uh-oh!', 'Please include at least one uppercase and lowercase letter in your password')
    if (special === null && numbers === null) return SweetAlert.swal('Uh-oh!', 'Please include at least one special character (number or symbol) in your password')

    popup.showLoader()
    setTimeout(function () {
      $scope.$apply(function () {
        const identity = {
          // eslint-disable-next-line no-undef
          ensk: sjcl.encrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, Storage.keys.pkh, 30000, 512, 'sha512').toString(), Storage.keys.sk),
          pkh: ss.pkh,
          accounts: ss.accounts,
          account: ss.account
        }
        Storage.setStore(identity)
        Storage.password = $scope.password
        Storage.logged = true
        $location.path('/main')
      })
    }, 100)
  }
}]
