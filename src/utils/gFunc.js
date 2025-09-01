import { cloneDeep } from 'lodash-es'
export function sleep(delay = 0, fn) {
  return new Promise((resolve) =>
    setTimeout(() => {
      fn?.()
      resolve()
    }, delay),
  )
}

/**
 * 判断传入参数的类型
 * @param {*} type
 * getType(new RegExp()) regexp
 * getType(new Date()) date
 * getType([]) array
 * getType({}) object
 * getType(null) null
 * getType(123) number
 */
export function getType(type) {
  if (typeof type === 'object') {
    const objType = Object.prototype.toString.call(type).slice(8, -1).toLowerCase()
    return objType
  } else {
    return typeof type
  }
}

/**
 * 克隆数据并根据需要复制数组
 * @param {any} data - 要克隆的数据
 * @param {number} [times=1] - 如果是数组，要复制的次数
 * @returns {any} - 克隆后的数据或复制后的数组
 * clone(123) => 123
 * clone([1,2, {name: 'andy'}], 2) => [1, 2, {name: 'andy'}, 1, 2, {name: 'andy'}]
 */
export function clone(data, times = 1) {
  // Check if the data is not an array
  if (getType(data) !== 'array') {
    // If not an array, return a deep clone of the data
    return cloneDeep(data)
  }
  const clonedData = cloneDeep(data)
  const result = []
  for (let i = 0; i < times; i++) {
    result.push(...clonedData)
  }
  return result
}
