module.exports = {
  socketUrl: process.env.SOCKET_URL || 'http://127.0.0.1:7001/sys',
  apiUrl: process.env.API_URL || 'http://127.0.0.1:7001',
}

console.log('配置信息：', module.exports)