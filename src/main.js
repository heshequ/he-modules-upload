const _ = require('lodash')
const Koa = require('koa')
const body = require('koa-better-body')
const router = require('koa-router')()
const path = require('path')
const fs = require('fs')
const sheet = require('he-sheet')
const app = new Koa()
require('he-date-format')

/**
 * 定义生成图片的根目录
 */
const tempPath = path.join(process.cwd(), 'data/temp')
const uploadPath = path.join(process.cwd(), 'data/upload')

/**
 * 添加body中间件
 */
app.use(body({
  uploadDir: tempPath,
  keepExtensions: true
}))

/**
 * 验证参数
 * @param Object fields ctx.request.fields对象
 * @return Boolean 参数验证成功返回true，失败返回false
 */
const validArgs = function (fields) {
  // 无参数
  if (fields === undefined) {
    return 10001
  }

  // 缺失子参数
  let args = ['project', 'type', 'max', 'ext']
  for (let arg of args) {
    if (fields[arg] === undefined && _.trim(fields[arg]) === '') {
      return 10002
    }
  }

  // 无上传文件
  if (fields.files === undefined || fields.files.length === 0) {
    return 50003
  }

  // 返回成功
  return 0
}

/**
 * 验证上传条目
 * @param Array exts 允许上传的扩展类型数组
 * @param Number max 允许上传的文件大小
 * @param Object file 单个上传文件对象
 * @return Boolean 上传文件验证成功返回true，失败返回false
 */
const validFile = function (exts, max, file) {
  let type = false
  for (let ext of exts) {
    if (file.type === _.trim(ext)) {
      type = true
      break
    }
  }
  if (!type) {
    return 50002
  }
  if (file.size > max) {
    return 50001
  }
  return 0
}

/**
 * 获取文件名
 */
const getFilename = function (ext, fields) {
  let timestamp = _.now()
  let date = new Date(timestamp)
  let dir = uploadPath + '/' + fields.project + '/' + fields.type + '/' + date.format('yyyyMMdd')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  let file = timestamp + ext
  return dir + '/' + file
}

/**
 * 上传路由
 */
router.post('/', ctx => {
  // 取参数别名，上传文件信息数组
  let fields = ctx.request.fields
  let items = []
  let datas = []

  // 验证参数是否合格，分解上传文件数组验证参数
  if (validArgs(fields) !== 0) {
    ctx.body = sheet[validArgs(fields)]
    return
  }

  // 获取验证条目时的变量
  // image/png, image/jpg, image/jpeg, image/gif
  let exts = _.split(fields.ext, ',')
  let max = fields.max

  // 验证条目, 并将条目添加到items数组
  for (let file of fields.files) {
    let errcode = validFile(exts, max, file)
    let item = {
      valid: false,
      temp: '',
      errcode: errcode
    }
    if (errcode === 0) {
      item.valid = true
      item.temp = file.path
    }
    items.push(item)
  }

  // 将文件从临时目录转移到上传目录
  for (let item of items) {
    let data = {
      success: false,
      message: '',
      path: ''
    }
    if (!item.valid) {
      data.message = sheet[item.errcode].error
      datas.push(data)
      continue
    }
    

    // 获取上传文件的保存名，并保存文件
    let ext = path.extname(item.temp)
    let filename = getFilename(ext, fields)
    fs.rename(item.temp, filename, function(err) {
      if (err) {
        throw err
      }
    })
    data.success = true
    data.path = filename
    datas.push(data)
  }
  
  //定义返回值result
  let result = sheet[0]
  result.data = datas

  // 返回成功
  ctx.body = result
})

/**
 * 监听
 */
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3100)

