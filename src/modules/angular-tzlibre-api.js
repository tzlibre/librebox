import angular from 'angular'
import config from '../config/config'
import popup from '../helpers/popup'

const TZLIBRE_API = 'tzLibreApi'

angular.module(TZLIBRE_API, [])
  .factory(TZLIBRE_API, ['$http', $http => {
    const self = {
      getInfoAccount: (tz1Address) => {
        popup.showLoader()
        return $http
          .get(`${config.tzlibreBaseApi}/split?tzl_pkh=${tz1Address}`)
          .then(r => {
            popup.hideLoader()
            return r.data
          })
      },
      isVerified: (tz1Address) => self.getInfoAccount(tz1Address).then(r => {
        if (r && r.eth_addr !== '0x0000000000000000000000000000000000000000') {
          return {
            verified: r.valid_proof,
            ethereumAddress: r.eth_addr,
            tz1Address: r.tzl_pkh,
            bookedForXtzActivation: r.booked_for_xtz_activation,
            bookedForTzlActivation: r.booked_for_tzl_activation
          }
        }
        return {
          verified: false
        }
      }),
      linkEthAddress: (ethAddress, ethAddressSignature, tzlPkh, tzlPk) => {
        const request = {
          eth_addr: ethAddress.replace('0x', ''),
          eth_addr_signature: ethAddressSignature,
          tzl_pkh: tzlPkh,
          tzl_pk: tzlPk
        }
        return $http.post(`${config.tzlibreBaseApi}/split/sign`, request)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            return r
          })
      },
      canActivateOnTzl: (tzlPkh) => {
        return $http.get(`${config.tzlibreBaseApi}/can-activate-on-tzl?tzl_pkh=${tzlPkh}`)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            return r.data.can_activate
          })
          .catch(() => false)
      },
      canClaim: tzlPkh => {
        return $http.get(`${config.tzlibreBaseApi}/can-claim?tzl_pkh=${tzlPkh}`)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            return !!r.data.can_claim
          })
          .catch(() => false)
      },
      getTzlBalanceByEthAddress: ethAddress => {
        return $http.get(`https://api.ethplorer.io/getAddressInfo/${ethAddress}?apiKey=freekey`)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            const token = r.data.tokens.filter(t => t.tokenInfo.address.toLowerCase() === config.tzlTokenAddress.toLowerCase())[0]
            if (!token) {
              return 0
            }
            return Math.round(parseFloat(token.balance) / Math.pow(10, 16)) / 100
          })
          .catch(() => {
            return 0
          })
      },
      activateOnTzl: (tzlPkh, tzlPk, ethAddress, ethAddressSignature) => {
        const request = { tzl_pkh: tzlPkh, tzl_pk: tzlPk, eth_addr: ethAddress, eth_addr_signature: ethAddressSignature }
        return $http.post(`${config.tzlibreBaseApi}/activate-on-tzl`, request)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            return r
          })
          .catch(() => {
            return true
          })
      },
      bookForTzlActivation: (tzPkh, tzPk, ethAddress, ethAddressSignature) => {
        const request = { tz_pkh: tzPkh, tz_pk: tzPk, eth_addr: ethAddress, eth_addr_signature: ethAddressSignature }
        return $http.post(`${config.tzlibreBaseApi}/activate-on-xtz`, request)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            return r
          })
          .catch(() => {
            return true
          })
      },
      claim: (tzlPkh, tzlPk, ethAddress, ethAddressSignature) => {
        const request = { tzl_pkh: tzlPkh, tzl_pk: tzlPk, eth_addr: ethAddress, eth_addr_signature: ethAddressSignature }
        return $http.post(`${config.tzlibreBaseApi}/claim`, request)
          .then(r => {
            if (r && r.data && r.data.ok === false) {
              throw Error()
            }
            return r
          })
          .catch(() => {
            return true
          })
      },
    }
    return self
  }])

export default TZLIBRE_API
