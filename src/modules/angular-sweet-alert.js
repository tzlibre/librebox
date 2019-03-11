import angular from 'angular'
import swal from 'sweetalert'

angular.module('tzlibre.ngSweetAlert', [])
  .factory('SweetAlert', ['$rootScope', $rootScope => {
    const self = {
      swal: (...params) => new Promise(async (resolve, reject) => {
        try {
          $rootScope.$evalAsync(async () => {
            resolve(await swal(...params)
              .then(result => {
                if (result === null) {
                  reject(Error('Cancel'))
                } else {
                  return result
                }
              }))
          })
        } catch (e) {
          reject(e)
        }
      }),
      getPassword: (text = '') => self.swal({
        title: 'Enter password to confirm',
        text,
        content: {
          element: 'input',
          attributes: { placeholder: 'Type your password', type: 'password' }
        },
        buttons: [ true, 'Confirm' ]
      }).then(password => {
        if (password === null) {
          throw Error('Cancel')
        }
        return password
      }),
      askAmountKt1Account: async () => {
        const amount = await self.swal({
          title: 'Create KT1 account',
          text: 'Define the amount to move in your KT1 account.',
          content: {
            element: 'input',
            attributes: { placeholder: 'Type the amount', type: 'number' }
          },
          buttons: [ true, true ]
        })
        if (!amount) throw Error('Amount not valid')
        return parseFloat(amount)
      },
      getEthAddress: () => self.swal({
        title: 'Ethereum address to link',
        text: '',
        content: {
          element: 'input',
          attributes: { placeholder: 'Type your eth address', type: 'text' }
        },
        buttons: [ true, 'Confirm' ]
      }).then(ethAddress => {
        const remove0x = addr => addr.replace('0x', '')
        return remove0x(ethAddress)
      })
    }
    return self
  }])

export default 'tzlibre.ngSweetAlert'
