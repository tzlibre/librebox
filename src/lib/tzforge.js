const baseN = require('base-n')
const bs58 = require('bs58check')

const isKt1 = address => address.toLowerCase().slice(0, 3) === 'kt1'

const leftPad = msg => '00'.concat(msg).slice(-2)

const buf2hex = buffer => [...buffer].map(b => b.toString(16)).map(leftPad).join('')

const bs58Decode = (msg, skip = 3) => buf2hex(bs58.decode(msg).slice(skip))

const decimalToBinary = (() => {
  const characters = Array(128).fill(1).map((_, key) => leftPad(key.toString(16)))
  const base128 = baseN.create({ characters })
  return decimal => {
    const [ first, ...rest ] = base128.encode(parseInt(decimal)).match(/.{1,2}/g)
    return [ first, ...rest.map(v => (parseInt(v, 16) + 0x80).toString(16)) ].reverse().join('')
  }
})()

const forge = parameters => {
  const { hash, counter, source, destination, amount, fee, gas, storage } = parameters
  const isSourceKt1 = isKt1(source)
  const isDestinationKt = isKt1(destination)
  return [
    bs58Decode(hash, 2),
    '08',
    isSourceKt1 ? '01' : '0000',
    bs58Decode(source),
    isSourceKt1 ? '00' : '',
    decimalToBinary(fee || 0),
    decimalToBinary(counter),
    decimalToBinary(gas || 0),
    decimalToBinary(storage || 0),
    decimalToBinary(amount),
    isDestinationKt ? '01' : '0000',
    bs58Decode(destination),
    isDestinationKt ? '0000' : '00'
  ].join('')
}

const checkForge = (parameters, forgedTx) => {
  // Only transaction operations are supported
  if (parameters.kind !== 'transaction') {
    return true
  }
  const localForge = forge(parameters).toLowerCase()
  const bytesToCheck = localForge.length - 2
  forgedTx = forgedTx.toLowerCase()
  return forgedTx.slice(0, bytesToCheck) === localForge.slice(0, bytesToCheck)
}

module.exports = { forge, checkForge }
