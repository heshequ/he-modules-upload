const _ = require('lodash')
const Koa = require('koa')
const body = require('koa-better-body')
const router = require('koa-router')()
const path = require('path')
const fs = require('fs')
const app = new Koa()
require('he-date-format')

/**
 * 定义生成图片的根目录
 */
const tempPath = './temp'
const uploadPath = './upload'

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
    return false
  }

  // 缺失子参数
  let args = ['project', 'type', 'max', 'ext']
  for (let arg of args) {
    if (fields[arg] === undefined && _.trim(fields[arg]) === '') {
      return false
    }
  }

  // 无上传文件
  if (fields.files === undefined || f.files.length === 0) {
    return false
  }
}

/**
 * 验证上传条目
 * @param Array exts 允许上传的扩展类型数组
 * @param Number max 允许上传的文件大小
 * @param Object file 单个上传文件对象
 * @return Boolean 上传文件验证成功返回true，失败返回false
 */
const validFile = function (exts, max, file) {
  for (let ext of exts) {
    if (file.type === _.trim(ext) && file.size <= max) {
      return true
    }
  }
  return false
}

/**
 * 获取文件名
 */
const getFilename = function (ext) {
  let timestamp = _.now()
  let date = new Date(timestamp)
  let dir = uploadPath + '/' + date.format('yyyyMMdd')
  let file = timestamp + '.' + ext
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
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
  if (!validArgs(fields)) {
    ctx.body = ''
  }

  // 获取验证条目时的变量
  let exts = _.split(fields.ext, ',')
  let max = fields.max

  // 验证条目, 并将条目添加到items数组
  for (let file of fields.files) {
    let item = {
      valid: false,
      temp: ''
    }
    if (validFile(ext, max, file)) {
      item.valid = true
      item.temp = file.path
    }
    items.push(item)
  }

  // 将文件从临时目录转移到上传目录
  for (let item of items) {
    if (!item.valid) {
      continue
    }

    // 获取上传文件的保存名，并保存文件
    let ext = path.extname(file.path)
    let filename = uploadPath + '/' + fields.project + '/' + fields.type + '/' + getFilename(ext)
    fs.rename(item.temp, filename, function(err) {
      throw err
    })
  }
})

/**
 * 监听
 */
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(3000)

