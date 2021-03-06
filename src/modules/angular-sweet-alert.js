import angular from 'angular'
import swal from 'sweetalert'
import popup from '../helpers/popup'

angular.module('tzlibre.ngSweetAlert', [])
  .factory('SweetAlert', ['$rootScope', $rootScope => {
    const self = {
      swal: (...params) => {
        if (params[1] === 'Cancel')
          return
        return new Promise(async (resolve, reject) => {
          try {
            $rootScope.$evalAsync(async () => {
              const r = await swal(...params)
                .then(result => {
                  if (result === null) {
                    reject(new Error('Cancel'))
                  } else {
                    return result
                  }
                })
              resolve(r)
            })
          } catch (e) {
            reject(e)
          }
        })
      },
      getPassword: (text = '', title = 'Enter password to confirm') => self.swal({
        title,
        text,
        content: {
          element: 'input',
          attributes: { placeholder: 'Type your password', type: 'password' }
        },
        buttons: [true, 'Confirm']
      }),
      askAmountTZLToSwap: async () => {
        const amount = await self.swal({
          title: 'Swap: native -> ERC-20',
          text: 'Enter the amount of native TZL coins to swap for ERC-20 TZL tokens',
          content: {
            element: 'input',
            attributes: { placeholder: 'Amount', type: 'number' }
          },
          buttons: [true, true]
        })
        if (!amount) throw Error('Amount not valid')
        return parseFloat(amount)
      },
      askAmountWTZLToSwap: async () => {
        const amount = await self.swal({
          title: 'Swap: ERC-20 -> native',
          text: 'Enter the amount of ERC-20 TZL tokens to swap for native TZL coins',
          content: {
            element: 'input',
            attributes: { placeholder: 'Amount', type: 'number' }
          },
          buttons: [true, true]
        })
        if (!amount) throw Error('Amount not valid')
        return parseFloat(amount)
      },
      askAmountOTCBuy: async () => {
        const amount = await self.swal({
          title: 'Mint OTC',
          text: 'Define the amount that you want to buy.',
          content: {
            element: 'input',
            attributes: { placeholder: 'Type the amount', type: 'number' }
          },
          buttons: [true, true]
        })
        if (!amount) throw Error('Amount not valid')
        return parseFloat(amount)
      },
      askAmountKt1Account: async () => {
        const amount = await self.swal({
          title: 'Create KT1 account',
          text: 'Define the amount to move in your KT1 account.',
          content: {
            element: 'input',
            attributes: { placeholder: 'Type the amount', type: 'number' }
          },
          buttons: [true, true]
        })
        if (!amount) throw Error('Amount not valid')
        return parseFloat(amount)
      },
      getEthAddress: (title, description) => self.swal({
        title: title || 'Ethereum address to link',
        text: description || '',
        content: {
          element: 'input',
          attributes: { placeholder: 'Enter your Ethereum address', type: 'text' }
        },
        buttons: [true, 'Confirm']
      }).then(ethAddress => {
        const remove0x = addr => addr.replace('0x', '')
        return remove0x(ethAddress)
      })
    }
    return self
  }])

export default 'tzlibre.ngSweetAlert'
