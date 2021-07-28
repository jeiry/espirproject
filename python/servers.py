#!/usr/bin/python
# -*-coding:utf-8 -*-
import json
import os
import time
import threading
from flask_mqtt import Mqtt
from flask_socketio import SocketIO
from flask_cors import CORS
os.environ["LANG"] = "en_US.UTF-8"
import srtread
from flask import Flask, request,render_template

app = Flask(__name__, template_folder='templates')
app.config['MQTT_BROKER_URL'] = 't.yoyolife.fun'
app.config['MQTT_BROKER_PORT'] = 1883
app.config['MQTT_KEEPALIVE'] = 60
app.config['MQTT_USERNAME'] = 'admin'
app.config['MQTT_PASSWORD'] = 'zxASqw12'
CORS(app)
mqtt = Mqtt(app)
socketio = SocketIO(app)


@socketio.on('publish')
def handle_publish(json_str):
    data = json.loads(json_str)
    mqtt_ws.publish(data['topic'], data['message'])


@mqtt.on_connect()
def handle_connect(client, userdata, flags, rc):
    mqtt.subscribe('/home/#')

@mqtt.on_message()
def handle_mqtt_message(client, userdata, message):
    try:
        if  message.topic == "/home/r/espir":
            print(message.topic, message.payload.decode())
            f = open('/home/py/home/glac.data', 'w')
            f.write(message.payload.decode())
            f.close()

    except Exception as e:
        print(e)
        
 @app.route('/getacdata/', methods=['GET'])
def getacgldata():
    f = open('/home/py/home/glac.data', 'r')
    string = f.read()
    f.close()
    return json.dumps({'error': 0,'data':string})
def aclooping():
    while True:
        with open('/home/py/home/glac.data','r') as f:
            string = f.read()
        offon = string[-1:]
        h = int(string[-5:-3])
        m = int(string[-3:-1])
        if offon == '1':
            ch = int(time.strftime("%H"))
            cm = int(time.strftime("%M"))
            # print("%d_%d_%d_%d" % (h, m, ch, cm))
            if ch == h and cm == m:
                print('----')
                mqtt.publish('/home/r/espir', '0%s'%string[1:])
                time.sleep(60)
        time.sleep(5)
        
if __name__ == '__main__':
    t = threading.Thread(target=aclooping)  # 创建线程
    t.setDaemon(True)
    t.start()
    socketio.run(app, host='127.0.0.1', port=2345, use_reloader=True, debug=True)
