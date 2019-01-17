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
        if (r) {
          return {
            verified: r.valid_proof,
            ethereumAddress: r.eth_addr,
            tz1Address: r.tzl_pkh
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
      }
    }
    return self
  }])

export default TZLIBRE_API
