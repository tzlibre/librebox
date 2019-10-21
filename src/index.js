import 'bootstrap'
import angular from 'angular'
import Storage from './services/storage'
import Routes from './routes'
import NewController from './controllers/NewController'
import CreateController from './controllers/CreateController'
import ValidateController from './controllers/ValidateController'
import MainController from './controllers/MainController'
import MainTzLibreController from './controllers/MainTzLibreController'
import SettingController from './controllers/SettingController'
import UnlockController from './controllers/UnlockController'
import EncryptController from './controllers/EncryptController'
import LinkController from './controllers/LinkController'
import RestoreController from './controllers/RestoreController'
import angularRoute from 'angular-route'
import angularBlockies from './modules/angular-blockies'
import angularTooltip from './modules/angular-tooltip'
import angularQrCode from 'angular-qrcode'
import angularSweetAlert from './modules/angular-sweet-alert'
import angularTzLibreApi from './modules/angular-tzlibre-api'
import angularEztz from './modules/angular-eztz'
console.log('LibreBox v. 1.0.1 - http://github.com/tzlibre/librebox')

const app = angular.module('librebox', [
  angularRoute,
  angularBlockies,
  angularTooltip,
  angularQrCode,
  angularSweetAlert,
  angularTzLibreApi,
  angularEztz
])

app
  .config(Routes)
  .service('Storage', Storage)
  .controller('NewController', NewController)
  .controller('CreateController', CreateController)
  .controller('ValidateController', ValidateController)
  .controller('MainController', MainController)
  .controller('MainTzLibreController', MainTzLibreController)
  .controller('SettingController', SettingController)
  .controller('UnlockController', UnlockController)
  .controller('EncryptController', EncryptController)
  .controller('LinkController', LinkController)
  .controller('RestoreController', RestoreController)
