import popup from '../helpers/popup'
import sjcl from 'sjcl'
import config from '../config/config'

export default function () {
  const localStorage = window.localStorage
  let r = {}
  r.logged = false
  r.keys = {}
  r.password = ''
  r.restored = false
  r.ico = false
  r.setStore = function (v, k, p) {
    const oldStorage = r.loadStore() || {}
    localStorage.setItem('tbstore', JSON.stringify(Object.assign({}, oldStorage, v)))
    if (typeof k !== 'undefined') r.keys = k
  }
  r.loadStore = function () {
    return JSON.parse(localStorage.getItem('tbstore'))
  }
  r.clearStore = function () {
    r.keys = {}
    const s = r.loadSetting()
    localStorage.clear()
    r.setSetting(s)
  }
  r.setSetting = function (v) {
    const oldStore = this.loadStore();
    localStorage.setItem('tbsetting', JSON.stringify({ ...oldStore, ...v }))
  }
  r.loadSetting = function () {
    let settings = JSON.parse(localStorage.getItem('tbsetting')) || {}
    settings.defaultChain = settings.defaultChain || config.defaultChain;
    settings.rpc = settings.rpc || config.kycTezos.rpc;
    settings.explorer = settings.explorer || config.kycTezos.explorer;
    settings.public_explorer = settings.public_explorer || config.kycTezos.public_explorer;
    settings.disclaimer = settings.disclaimer || false;
    return settings
  }
  r.decryptPrivateKeys = function (password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const ss = r.loadStore()
          let keys
          // eslint-disable-next-line
          const sk = sjcl.decrypt(window.eztz.library.pbkdf2.pbkdf2Sync(password, ss.pkh, 30000, 512, 'sha512').toString(), ss.ensk)
          if (sk.substr(0, 4) === 'edsk') {
            keys = window.eztz.crypto.extractKeys(sk)
          } else {
            keys = {
              pk: ss.accounts[0].public_key,
              pkh: ss.pkh,
              sk,
              link: true
            }
          }
          resolve(keys)
        } catch (error) {
          reject(error)
        }
      }, 100)
      popup.showLoader()
    })
  }
  r.login = async function (password) {
    return r.decryptPrivateKeys(password)
      .then(logged => {
        if (logged) {
          r.logged = true
          return true
        }
        throw Error('Password incorrect.')
      })
  }
  r.isLogged = function () {
    return r.logged
  }
  r.isWalletEmpty = function () {
    const ss = r.loadStore()
    return !ss || !ss.ensk
  }
  r.getKeysByPassword = function (SweetAlert, title, text, confirmButton, type) {
    return SweetAlert.getPassword(title, text, confirmButton)
      .then(password => r.decryptPrivateKeys(password))
  }
  r.getTz1Account = function () {
    const store = r.loadStore()
    if (store && !store.accounts && !store.accounts[0] && !store.accounts[0].address) {
      return store.accounts[0].address
    }
    return null
  }
  return r
}
