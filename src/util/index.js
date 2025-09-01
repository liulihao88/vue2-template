/**
 * 图片上传前的后缀校验
 * @param {*} file
 * @param {*} done
 * @param {*} loading
 */
export function handleBeforeUploadImage(file, done, loading, options = {}) {
  console.log('file', file)
  const imageSuffix = ['jpg', 'jpeg', 'png', 'svg']
  const temparr = file.name.split('.')
  const fileSuffix = temparr[temparr.length - 1]
  const flag = imageSuffix.includes(fileSuffix)
  const { sizeLimit = 2 } = options
  // 图片大小限制为2M
  const sizeFlag = file.size <= 1024 * 1024 * sizeLimit
  if (flag && sizeFlag) {
    done()
  } else {
    Message.warning(`请上传jpg/png格式图片文件,且小于${sizeLimit}M`)
    loading()
  }
}
