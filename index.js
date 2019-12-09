const axios = require('axios')
const io = require('socket.io-client')
const log = console.log
const roomSet = new Set()
const tickMap = new Map()
const socket = io('http://127.0.0.1:7001/', {
  query: {
    room: 'heart',
    userId: 'heart',
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
  log('已连接')

})

socket.on('online', msg => {
  log('#online,', msg);
  Object.keys(msg.clientsDetail).forEach(id => {
    let item = msg.clientsDetail[id]
    roomSet.add(item.room)
  })
  roomSet.delete('heart')
  roomSet.forEach(room => {
    socket.emit('exchange', {
      target: room,
      payload: {
        msg: 'hreat 连接',
      },
    });
    getVersion(room)
  })
  console.log('rooms: ', roomSet)
});

function getVersion(room) {
  const tick = setInterval(async () => {
    try {
      let { data: version } = await axios.get(`http://${room}/version.txt`)
      log(`请求：http://${room}/version.txt`, new Date())
      version = version.trim()
      socket.emit('exchange', {
        target: room,
        payload: {
          msg: '版本号：',
          version: version
        },
      });
    } catch (err) {
      log('请求异常', err.toString())
    }
  }, 5000)
  tickMap.set(room, tick)
}

socket.on('update room', msg => {
  const {room, clients, action} = msg
  if (action === 'join') {
    if (!roomSet.has(room)) {
      roomSet.add(room)
      getVersion(room)

    }
  } else if (clients.length ===0) {
    roomSet.delete(room)
    clearInterval(tickMap.get(room))
    tickMap.delete(room)
  }
})

socket.on('disconnect', msg => {
  // tick && clearInterval(tick)
  log('#disconnect', msg);
});

socket.on('disconnecting', () => {
  log('#disconnecting');
});

socket.on('error', () => {
  log('#error');
});


