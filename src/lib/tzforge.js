const equal = require('deep-equal')
const b58cencode = window.eztz.utility.b58cencode
const hex2buf = window.eztz.utility.hex2buf
const prefixBranch = window.eztz.prefix.b
const prefixEDPK = window.eztz.prefix.edpk
const prefixKT = window.eztz.prefix.KT
const prefixTZ1 = window.eztz.prefix.tz1
const prefixTZ2 = window.eztz.prefix.tz2
const prefixTZ3 = window.eztz.prefix.tz3
const config = require('../config/config').default

const decodeContents = content => {
  const tag = Number(hex2buf(content.slice(0, 2)))
  switch (tag) {
    case 4: {
      return decodeActivateAccount(content.slice(2))
    } case 7: {
      return decodeReveal(content.slice(2))
    } case 8: {
      return decodeTransaction(content.slice(2))
    } case 9: {
      return decodeOrigination(content.slice(2))
    } case 10: {
      return decodeDelegation(content.slice(2))
    } default: {
      throw new Error('Unknown tag')
    }
  }
}

const decodeActivateAccount = content => { // Tag 4
  const data = { kind: 'activate' }
  data.pkh = b58cencode(hex2buf(content.slice(0, 40)), prefixTZ1)
  data.secret = content.slice(40, 80)
  return data
}

const decodeReveal = content => { // Tag 7
  let index = 0
  const op = decodeCommon({ kind: 'reveal' }, content)
  if (op.rest.slice(index, index += 2) !== '00') {
    throw new Error('TagErrorR1')
  }
  op.data.public_key = b58cencode(hex2buf(op.rest.slice(index, index += 64)), prefixEDPK)
  if (op.rest.length === index) {
    return [op.data]
  } else {
    return [op.data].concat(decodeContents(op.rest.slice(index)))
  }
}

const decodeTransaction = content => { // Tag 8
  let index = 0
  const op = decodeCommon({ kind: 'transaction' }, content)
  const amount = zarithDecode(op.rest.slice(index))
  op.data.amount = amount.value.toString()
  op.data.destination = decodeContractId(op.rest.slice(index += amount.count * 2, index += 44))
  if (op.rest.slice(index, index += 2) === 'ff') { // parameters?
    throw new Error('UnsupportedTagT1')
  }
  if (op.rest.length === index) {
    return [op.data]
  } else {
    return [op.data].concat(decodeContents(op.rest.slice(index)))
  }
}

const decodeOrigination = content => { // Tag 9
  let index = 0
  const op = decodeCommon({ kind: 'origination' }, content)
  op.data.managerPubkey = decodePkh(op.rest.slice(index, index += 42))  // mainnet
  const balance = zarithDecode(op.rest.slice(index))
  op.data.balance = balance.value.toString()
  op.data.spendable = (op.rest.slice(index += balance.count * 2, index += 2) === 'ff')
  op.data.delegatable = (op.rest.slice(index, index += 2) === 'ff')
  if (op.rest.slice(index, index += 2) === 'ff' && op.rest.slice(index, -1) === '00f7ba87df4ae859bf238c4103c45a11a2b7ac473c0') { // delegate?
    op.data.delegate = config.tzLibreAddress
  }
  return [op.data]
}

const decodeDelegation = content => { // Tag 10
  let index = 0
  const op = decodeCommon({ kind: 'delegation' }, content)
  if (op.rest.slice(index, index += 2) === 'ff') {
    op.data.delegate = decodePkh(op.rest.slice(index, index += 42))
  } else if (op.rest.slice(index - 2, index) !== '00') {
    throw new Error('TagErrorD1')
  }
  if (op.rest.length === index) {
    return [op.data]
  } else {
    return [op.data].concat(decodeContents(op.rest.slice(index)))
  }
}

const decodeCommon = (data, content) => {
  let index = 0
  data.source = decodeContractId(content.slice(index, index += 44))
  const fee = zarithDecode(content.slice(index))
  data.fee = fee.value.toString()
  const counter = zarithDecode(content.slice(index += fee.count * 2))
  data.counter = counter.value.toString()
  const gasLimit = zarithDecode(content.slice(index += counter.count * 2))
  data.gas_limit = gasLimit.value.toString()
  const storageLimit = zarithDecode(content.slice(index += gasLimit.count * 2))
  data.storage_limit = storageLimit.value.toString()
  const rest = content.slice(index += storageLimit.count * 2)
  return {
    data: data,
    rest: rest
  }
}

const decodePkh = bytes => {
  if (bytes.slice(0, 2) === '00') {
    return b58cencode(hex2buf(bytes.slice(2, 42)), prefixTZ1)
  } else if (bytes.slice(0, 2) === '01') {
    return b58cencode(hex2buf(bytes.slice(2, 42)), prefixTZ2)
  } else if (bytes.slice(0, 2) === '02') {
    return b58cencode(hex2buf(bytes.slice(2, 42)), prefixTZ3)
  } else {
    throw new Error('TagErrorPkh')
  }
}

const zarithDecode = hex => {
  let count = 0
  let value = 0
  while (1) {
    const byte = Number('0x' + hex.slice(0 + count * 2, 2 + count * 2))
    value += ((byte & 127) * (128 ** count))
    count++
    if ((byte & 128) !== 128) {
      break
    }
  }
  return {
    value: value,
    count: count
  }
}

const decodeContractId = hex => {
  if (hex.slice(0, 2) === '00') {
    return decodePkh(hex.slice(2, 44))
  } else if (hex.slice(0, 2) === '01') {
    return b58cencode(hex2buf(hex.slice(2, 42)), prefixKT)
  } else {
    throw new Error('TagError')
  }
}

const decodeOpBytes = opbytes => {
  const branch = b58cencode(hex2buf(opbytes.slice(0, 64)), prefixBranch)
  const contents = decodeContents(opbytes.slice(64))
  return {
    branch: branch,
    contents: contents
  }
}

const checkForge = (parameters, forgedTx) => {
  const fop2 = { ...decodeOpBytes(forgedTx), protocol: 'PsddFKi32cMJ2qPjf43Qv5GDWLDPZb3T3bF6fLKiF5HtvHNU7aP' }
  return equal(parameters, fop2)
}

module.exports = { checkForge }
