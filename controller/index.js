const axios = require('axios')
const { apiUrl } = require('../config')

class Controller {
  /** 存储各系统在线人员日志, 时间到秒 */
  saveRoomOnline(room, clients, timestamp) {
    axios.post(apiUrl + '/api/roomOnlineLog/save', { room, clients, timestamp }).then(res => {
      console.log(`在线人员发送：${room} - ${clients.length} - ${timestamp} - ${JSON.stringify(res.data)}`)
    }).catch(err => {
      console.error(err)
    })
  }
  /** 存储各域下系统版本更新（以最新使用为主，未被使用的记录，版本最新时间以用户第一次使用时间为准）日志 */
  saveRoomVersion(room, version) {
    axios.post(apiUrl + '/api/roomVersionLog/save', { room, version }).then(res => {
      console.log(`版本发送：${room} - ${version} - ${JSON.stringify(res.data)}`)
    }).catch(err => {
      console.error(err)
    })
  }
}

module.exports = Controller