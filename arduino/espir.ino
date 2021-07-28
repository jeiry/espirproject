#include <ESP8266WiFi.h>
#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <ir_Gree.h>

const char* ssid = "xxx";
const char* password = "xxx";
#include <PubSubClient.h>
const char* mqtt_server = "t.yoyolife.fun";
const char* mqtt_username = "xxx";
const char* mqtt_password = "xxx";
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE  (50)
char msg[MSG_BUFFER_SIZE];


const uint16_t kIrLed = 4;  // ESP8266 GPIO pin to use. Recommended: 4 (D2).
IRGreeAC ac(kIrLed);  // Set the GPIO to be used for sending messages.

void setup_wifi() {

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}


void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String str;
  for (int i = 0; i < length; i++) {
    str += String((char)payload[i]);
    Serial.print((char)payload[i]);
  }
  Serial.println();
  Serial.print(str);
  Serial.println();
//  1112600000
  if(str.length() == 15){
    bool OnOff = str.substring(0, 1) == "1";
    int Fen = str.substring(1, 2).toInt();
    int Mode = str.substring(2, 3).toInt();
    int Temp = str.substring(3, 5).toInt();
    bool Swing = str.substring(5, 6) == "1";
    bool Xfan = str.substring(6, 7) == "1";
    bool Light = str.substring(7, 8) == "1";
    bool Sleep = str.substring(8, 9) == "1";
    bool Turbo = str.substring(9, 10) == "1";
    if(OnOff == true){
      ac.on();
    }else{
      ac.off();
    }
    ac.setFan(Fen);
  // kGreeAuto, kGreeDry, kGreeCool, kGreeFan, kGreeHeat
    ac.setMode(Mode);
    ac.setTemp(Temp);  // 16-30C
    ac.setSwingVertical(Swing, kGreeSwingAuto);
    ac.setXFan(Xfan);
    ac.setLight(Light);
    ac.setSleep(Sleep);
    ac.setTurbo(Turbo);
    ac.send();
  }
}


void reconnect() {
  // Loop until we were reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP826601Clientir";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      // Once connected, publish an announcement...

      // ... and resubscribe
      client.subscribe("/home/r/espir");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void printState() {
  // Display the settings.
  Serial.println("GREE A/C remote is in the following state:");
  Serial.printf("  %s\n", ac.toString().c_str());
  // Display the encoded IR sequence.
  unsigned char* ir_code = ac.getRaw();
  Serial.print("IR Code: 0x");
  for (uint8_t i = 0; i < kGreeStateLength; i++)
    Serial.printf("%02X", ir_code[i]);
  Serial.println();
}

void setup() {
  ac.begin();
  Serial.begin(115200);

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
//  delay(200);

  // Set up what we want to send. See ir_Gree.cpp for all the options.
  // Most things default to off.
  Serial.println("Default state of the remote.");
  printState();
  Serial.println("Setting desired state for A/C.");
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
