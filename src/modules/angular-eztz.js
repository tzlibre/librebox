import angular from 'angular'
import popup from '../helpers/popup'
import config from '../config/config'
const { checkForge } = require('../lib/tzforge')
const ANGULAR_EZTZ = 'angularEztz'

angular.module(ANGULAR_EZTZ, [])
  .factory(ANGULAR_EZTZ, ['$rootScope', 'SweetAlert', 'Storage', 'tzLibreApi', ($rootScope, SweetAlert, Storage, tzLibreApi) => {
    const self = {
      send: async (from, to, amount, fee, parameters, type) => {
        if (!amount || !to) throw Error('Please enter amount and a destination')
        if (amount < 0) throw Error('Invalid amount entered - please enter a positive number')
        if (fee < 0) throw Error('Invalid amount entered - please enter a positive number')
        if (amount !== parseFloat(amount)) throw Error('Invalid amount entered - please enter a valid number')
        if (fee !== parseFloat(fee)) throw Error('Invalid amount entered - please enter a valid number')
        try {
          const messageAskPassword = `You are about to send ${amount} XTZ to ${to}  - this transaction is irreversible`
          const password = await SweetAlert.getPassword(messageAskPassword)
          const keys = await Storage.decryptPrivateKeys(password)
          const keysWithoutSk = Object.assign({}, keys, { sk: false })
          let transaction
          if (parameters) {
            transaction = await window.eztz.contract.send(to, from, keysWithoutSk, amount, parameters, fee, config.gasLimit, config.storageLimit)
          } else {
            transaction = await window.eztz.rpc.transfer(from, keysWithoutSk, to, amount, fee, false, config.gasLimit, config.storageLimit)
          }
          const contentTx = transaction.opOb.contents[0]
          const params = { hash: transaction.opOb.branch, ...contentTx, gas: contentTx.gas_limit, storage: contentTx.storage_limit }
          const checkTx = checkForge(params, transaction.opbytes)
          if (!checkTx) {
            SweetAlert.swal('Uh-oh!', 'Forge transaction error')
            popup.hideLoader()
            return
          }
          if (type === 'ledger') {
            const signedTxByLedger = await window.tezledger.sign(keys.sk, '03' + transaction.opbytes)
            transaction.opOb.signature = window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(signedTxByLedger.signature), window.eztz.prefix.edsig)
            await window.eztz.rpc.inject(transaction.opOb, transaction.opbytes + signedTxByLedger.signature)
          } else {
            const { sbytes, edsig } = window.eztz.crypto.sign(transaction.opbytes, keys.sk, window.eztz.watermark.generic)
            transaction.opOb.signature = edsig
            await window.eztz.rpc.inject(transaction.opOb, sbytes)
          }
          SweetAlert.swal('Awesome!', 'Transaction has been sent - this may take a few minutes to be included on the blockchain', 'success')
        } catch (e) {
          SweetAlert.swal('Uh-oh!', e.message || 'Operation Failed! Please check your inputs')
        }
        popup.hideLoader()
      },
      delegate: async (type, address, addressToDelegate) => {
        try {
          popup.showLoader()
          const messageAskPassword = 'You are about to delegate TzLibre'
          const password = await SweetAlert.getPassword(messageAskPassword)
          const keys = await Storage.decryptPrivateKeys(password)

          const keysWithourSkIfLedger = Object.assign({}, keys, { sk: type === 'ledger' ? false : keys.sk })
          const tx = await window.eztz.rpc.setDelegate(address, keysWithourSkIfLedger, addressToDelegate, 0)

          if (type === 'ledger') {
            const rr = await window.tezledger.sign(keys.sk, '03' + tx.opbytes)
            tx.opOb.signature = window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(rr.signature), window.eztz.prefix.edsig)
            await window.eztz.rpc.inject(tx.opOb, tx.opbytes + rr.signature)
          }

          SweetAlert.swal('Awesome!', 'Delegation operation was successful - this may take a few minutes to update', 'success')
          popup.hideLoader()
        } catch (e) {
          SweetAlert.swal('Uh-oh!', e.message || 'Operation Failed! Please check your inputs')
          popup.hideLoader()
        }
      },
      origin: async (type, addressToDelegate) => {
        try {
          const amount = await SweetAlert.askAmountKt1Account()
          const messageAskPassword = 'Creating KT1 account incurs an origination fee of ~0.257 XTZ. Do you want to continue?'
          const password = await SweetAlert.getPassword(messageAskPassword)
          const keys = await Storage.decryptPrivateKeys(password)
          const keysWithourSkIfLedger = Object.assign({}, keys, { sk: type === 'ledger' ? false : keys.sk })
          let tx = await window.eztz.rpc.account(keysWithourSkIfLedger, amount, true, true, addressToDelegate, 30000, 10100, 277)
          if (type === 'ledger') {
            const rr = await window.tezledger.sign(keys.sk, '03' + tx.opbytes)
            tx.opOb.signature = window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(rr.signature), window.eztz.prefix.edsig)
            tx = await window.eztz.rpc.inject(tx.opOb, tx.opbytes + rr.signature)
          }
          SweetAlert.swal('Awesome!', 'Your new account has been originated - this may take a few minutes to be included on the blockchain', 'success')
          return window.eztz.contract.hash(tx.hash, 0)
        } catch (e) {
          const msgError = e.message || 'Operation Failed! Please check your inputs'
          SweetAlert.swal('Uh-oh!', msgError)
          popup.hideLoader()
          throw msgError
        }
      },
      signEthAddress: async (type, ethAddress) => {
        if (!ethAddress) {
          ethAddress = await SweetAlert.getEthAddress()
        }
        const password = await SweetAlert.getPassword()
        const keys = await Storage.decryptPrivateKeys(password)
        try {
          let proof
          proof = await window.eztz.crypto.sign(ethAddress, keys.sk).sig
          proof = window.eztz.utility.buf2hex(proof)
          popup.hideLoader()
          let tzlPk = window.eztz.utility.b58cdecode(keys.pk, window.eztz.prefix.edpk)
          tzlPk = window.eztz.utility.buf2hex(tzlPk)
          return { ethAddress: '0x' + ethAddress, ethAddressSignature: proof, tzlPkh: keys.pkh, tzlPk }
        } catch (e) {
          const msgError = e.message || 'Operation Failed! Please check your inputs'
          SweetAlert.swal('Uh-oh!', msgError)
          popup.hideLoader()
          throw msgError
        }
      }
    }
    return self
  }])

export default ANGULAR_EZTZ
