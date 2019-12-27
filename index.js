const axios = require('axios')
const io = require('socket.io-client')
const controller = new (require('./controller'))()
const domainTurn = require('./domainTurn')
const log = console.log
const roomMap = new Map() // 房间列表
const tickMap = new Map() // 循环标记
const { socketUrl } = require('./config')
// const socketUrl = process.env.SOCKET_URL || 'http://csj-center-egg.shop.csj361.com/'

const socket = io(socketUrl, {
  query: {
    room: 'heart',
    userId: 'heart',
    username: 'heart'
  },
})
/**
 * 中心：
 * 接收 
 *   - 1. 获取所有人
 *   - 2. 获取所有房间
 *   - 3. 向每个房间推送房间内需要的版本信息
 */
socket.on('connect', () => {
  log('socket 已连接')
})

// 所有在线客户端
socket.on('user all online', msg => {
  const { clients, meta } = msg
  const roomClients = {}
  clients.forEach(client => {
    const { room, clientId, version } = client
    if (!roomMap.has(room)) {
      roomMap.set(room, new Map())
    }
    let clientVersion = roomMap.get(room)
    clientVersion.set(clientId, version)
    roomClients[room] = (roomClients[room] || [])
    roomClients[room].push(client)
  })
  roomMap.forEach((val, room) => {
    getVersion(room)
    controller.saveRoomVersion(room, roomClients[room][0].version)
    controller.saveRoomOnline(room, roomClients[room], meta.timestamp)
  })
  log('#allOnline: ', roomMap)
})

// 监听每个房间人员变动
socket.on('user room online', msg => {
  const { clients, room, client, action, meta } = msg
  controller.saveRoomOnline(room, clients, meta.timestamp)
  if (clients.length === 0) {
    roomMap.delete(room)
    clearInterval(tickMap.get(room))
    tickMap.delete(room)
  } else {
    if (action === 'join') { // 加入
      controller.saveRoomVersion(room, client.version)
      if (!roomMap.has(room)) {
        roomMap.set(room, new Map())
        getVersion(room)
      }
      let clientVersion = roomMap.get(room)
      clientVersion.set(client.clientId, client.version)
    } else { // 离开
      let clientVersion = roomMap.get(room)
      clientVersion.delete(client.clientId)
    }
  }
  log('#roomUpdate: ', roomMap)
})

function getVersion(room) {
  if (tickMap.get(room)) { // 如果定时器已存在，则不添加
    return
  }
  let domain = room
  if (domainTurn.has(domain)) {
    log(`${domain} 转 ${domainTurn.get(domain)}`)
    domain = domainTurn.get(domain)
  }
  const tick = setInterval(async () => {
    try {
      log(`请求：http://${domain}/version.txt`, new Date())
      let { data: version } = await axios.get(`http://${domain}/version.txt`)
      if (!version) return log(`请求异常 version 不存在: ${version}`)
      version = version.trim()
      let clientVersionMap = roomMap.get(room)
      if (!clientVersionMap) return
      let update = false
      clientVersionMap.forEach((v, clientId) => {
        if (v !== version) {
          update = true
          clientVersionMap.set(clientId, version)
          socket.emit('exchange', {
            target: clientId,
            action: 'version update',
            payload: {
              msg: '新版本号',
              version: version
            },
          });
        }
      })
      if (update) log('#versionUpdate: ', roomMap)
    } catch (err) {
      log(`请求异常（room:${room}）`, err.toString())
    }
  }, 5000)
  tickMap.set(room, tick)
}

socket.on('disconnect', msg => {
  tickMap.forEach((val) => {
    clearInterval(val)
  })
  roomMap.clear()
  tickMap.clear()
  log('#disconnect', msg);
});

socket.on('disconnecting', () => {
  log('#disconnecting');
});

socket.on('error', () => {
  log('#error');
});


