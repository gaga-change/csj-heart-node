const axios = require('axios')
const API_URL = process.env.API_URL || 'http://127.0.0.1:7001'
const mongoose = require('mongoose')
const MONGODB_LINK = process.env.MONGODB_LINK || 'mongodb://localhost/test'
// const MONGODB_LINK = process.env.MONGODB_LINK || 'mongodb://shark:123456@192.168.1.28:30017/sharktest'
mongoose.connect(MONGODB_LINK, { useUnifiedTopology: true, useNewUrlParser: true })

const RoomOnlineLog = mongoose.model('RoomOnlineLog', new mongoose.Schema({
  room: String,
  clients: [Object],
  clientsNum: Number,
  date: Date,
}), 'center_room_online_log')

class Controller {
  /** 存储各系统在线人员日志, 时间到秒 */
  async saveRoomOnline(room, clients, timestamp) {
    try {
      let date = new Date(timestamp)
      date.setMilliseconds(0)
      await RoomOnlineLog.updateOne({ room, date }, {
        room,
        clients,
        clientsNum: clients.length,
        date
      }, { upsert: true })
    } catch (err) {
      console.error(err)
    }
  }
  /** 存储各域下系统版本更新（以最新使用为主，未被使用的记录，版本最新时间以用户第一次使用时间为准）日志 */
  saveRoomVersion(room, version) {
    axios.post(API_URL + '/api/roomVersionLog/save', {room, version}).then(res => {
      console.log(`版本发送：${room} - ${version} - ${JSON.stringify(res.data)}`, )
    }).catch(err => {
      console.error(err)
    })
  }
}

module.exports = Controller