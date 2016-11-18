const fs = require('fs')

fs.rename('e:/bbb.txt', 'e:/Binary/bbb.txt', function(err) {
  if (err) {
    throw err
  }
})