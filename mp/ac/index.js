const app = getApp()
import {
  $wuxNotification
} from '../../miniprogram_npm/wux-weapp/index'
var request = require('../../utils/http.js')



var mqtt = require('../../utils/mqtt.min.js')
var client = null;
Page({
  data: {
    tempdata:"",
    OnOff: "",
    Fen: "",
    Mode: "",
    Temp: "",
    Swing: "",
    Xfan: "",
    Light: "",
    Sleep: "",
    Turbo: "",
    AllSwing: "",
    lang: 'zh_CN',
    value: [1, 1],
    offon:true
  },
  onLoad: function (options) {
    this.loadData()
    this.connectMqtt()
  },
  loadData(){
    var that = this
    request({}, '/getacdata/', 'get', function (res) {
      console.log(res.data)
      let OnOff = res.data.slice(0, 1)
      let Fen = res.data.slice(1, 2)
      let Mode = res.data.slice(2, 3)
      let Temp = res.data.slice(3, 5)
      let Swing = res.data.slice(5, 6)
      let Xfan = res.data.slice(6, 7)
      let Light = res.data.slice(7, 8)
      let Sleep = res.data.slice(8, 9)
      let Turbo = res.data.slice(9, 10)
      let H = res.data.slice(10, 12);
      let M = res.data.slice(12, 14);
      let offon = res.data.slice(14, 15) == "0"?false:true
      let AllSwing = ""
      if (Swing == "0" && Xfan == "0") {
        AllSwing = "关"
      } else {
        AllSwing = "开"
      }
      that.setData({
        tempdata:res.data,
        OnOff: OnOff,
        Fen: Fen,
        Mode: Mode,
        Temp: Temp,
        Swing: Swing,
        Xfan: Xfan,
        Light: Light,
        Sleep: Sleep,
        Turbo: Turbo,
        AllSwing: AllSwing,
        value:[H,M],
        offon:offon
      })
    })
  },
  onUnload: function (options) {
    client.end()
  },
  connectMqtt: function () {
    const options = {
      connectTimeout: 4000, // 超时时间
      clientId: 'mp' + Math.ceil(Math.random() * 100),
      port: 8084, //重点注意这个,坑了我很久
      username: 'xxx',
      password: 'xxx',
    }

    client = mqtt.connect('wxs://t.xxx.fun/mqtt', options)
    client.on('reconnect', (error) => {
      console.log('正在重连:', error)
    })

    client.on('error', (error) => {
      console.log('连接失败:', error)
    })

    let that = this;
    client.on('connect', (e) => {
      console.log('成功连接服务器')
      //订阅一个主题
      client.subscribe('/xxx/r/espir', {
        qos: 0
      }, function (err) {
        if (!err) {
          // client.publish('message.queue', 'Hello MQTT')
          console.log("订阅成功")
        }
      })
    })
    client.on('message', function (topic, message) {
      console.log('received msg:' + message.toString());
      this.loadData()
    }.bind(this))

  },
  click(e){
    var that = this
    let id = e.currentTarget.id
    let value = that.data.tempdata
    
    if(id == 1 && that.data.OnOff == 0){
      client.publish('/xxx/r/espir', "1"+value.slice(1, 15))
    }else if(id == 1 && that.data.OnOff == 1){
      client.publish('/xxx/r/espir', "0"+value.slice(1, 15))
    }
    if(id == 2){
      if(Number(that.data.Temp) < 30){
        let temptmp = Number(that.data.Temp) +1 ;
        client.publish('/xxx/r/espir', value.slice(0, 3)+temptmp+value.slice(5, 15))
      }
    }
    if(id == 3){
      if(Number(that.data.Temp) > 16){
        let temptmp = Number(that.data.Temp) -1 ;
        client.publish('/xxx/r/espir', value.slice(0, 3)+temptmp+value.slice(5, 15))
      }
    }
    if(id == 4){
      let tempfen = Number(that.data.Fen);
      if(tempfen < 3){
        tempfen ++;
      }else{
        tempfen = 1
      }
      client.publish('/xxx/r/espir', value.slice(0, 1)+tempfen+value.slice(2, 15))
    }
    if(id == 5 && that.data.Swing == 0){
      client.publish('/xxx/r/espir', value.slice(0, 5)+"1"+value.slice(6, 15))
    }else if(id == 5 && that.data.Swing == 1){
      client.publish('/xxx/r/espir', value.slice(0, 5)+"0"+value.slice(6, 15))
    }

    if(id == 6 && that.data.Xfan == 0){
      client.publish('/xxx/r/espir', value.slice(0, 6)+"1"+value.slice(7, 15))
    }else if(id == 6 && that.data.Xfan == 1){
      client.publish('/xxx/r/espir', value.slice(0, 6)+"0"+value.slice(7, 15))
    }
    
  },
  onChange(e) {
    var that = this
    let value = that.data.tempdata
    let offon = e.detail.value == true?1:0
    console.log(offon)
    this.setData({
      offon: e.detail.value
    })
    client.publish('/xxx/r/espir', value.slice(0, 14)+offon)
  },
  onValueChange(e) {
    var that = this
    let value = that.data.tempdata
    client.publish('/xxx/r/espir', value.slice(0, 10)+this.PrefixZero(e.detail.selectedIndex[0],2)+this.PrefixZero(e.detail.selectedIndex[1],2)+value.slice(14, 15))
  },
  PrefixZero(num, n) {
    return (Array(n).join(0) + num).slice(-n);
  }
})
