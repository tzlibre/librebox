module.exports = ['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/new', {
      template: require('../views/new.html'),
      controller: 'NewController'
    })
    .when('/create', {
      template: require('../views/create.html'),
      controller: 'CreateController'
    })
    .when('/restore', {
      template: require('../views/restore.html'),
      controller: 'RestoreController'
    })
    .when('/link', {
      template: require('../views/link.html'),
      controller: 'LinkController'
    })
    .when('/validate', {
      template: require('../views/validate.html'),
      controller: 'ValidateController'
    })
    .when('/encrypt', {
      template: require('../views/encrypt.html'),
      controller: 'EncryptController'
    })
    .when('/main', {
      template: require('../views/main.html'),
      controller: 'MainController'
    })
    .when('/unlock', {
      template: require('../views/unlock.html'),
      controller: 'UnlockController'
    })
    .when('/setting', {
      template: require('../views/setting.html'),
      controller: 'SettingController'
    })
    .otherwise({
      redirectTo: '/new'
    })
}]
