module.exports = function (str) {
  let arr1 = []
  let n, l
  for (n = 0, l = str.length; n < l; n++) {
    let hex = Number(str.charCodeAt(n)).toString(16)
    arr1.push(hex)
  }
  return arr1.join('')
}
