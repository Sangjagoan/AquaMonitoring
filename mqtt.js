"use strict";
const MQTT_CONFIG = {

    host: "wss://c2ba5bec181b4ffab0e46ac233be0a3b.s1.eu.hivemq.cloud:8884/mqtt",

    username: "espuser",
    password: "Esp32Cloud2026!",

    topic_wifi_state: "esp32/config/wifi/state",
    topic_wifi_set: "esp32/config/wifi/set",
    topic_Led_indikator: "esp32/indikator/state",
    topic_Wifi_progress: "esp32/config/wifi/progress",
    topic_ESP_RESTART: "esp32/config/esp/restart",

    topic_Wifi_status: "esp32/+/wifi/status",
    topic_Pressure_state: "esp32/+/pressure/state",
    topic_pump_state: "esp32/+/pump/state",
    topic_valve_state: "esp32/+/valve/state",
    topic_wifi_list: "esp32/+/wifi/list",
    topic_heartbeat: "esp32/+/heartbeat",
    topic_daynight: "esp32/+/daynight/state",
    topic_notif: "esp32/+/alarm",
    topic_UPTIME: "esp32/+/uptime",
    topic_data: "esp32/+/data",
    topic_state: "esp32/+/state"
};

let mqttClient = null;

function mqttStart() {
    console.log("Starting MQTT...");

    mqttClient = mqtt.connect(MQTT_CONFIG.host, {

        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
        clean: true
    });

    mqttClient.on("connect", () => {
        console.log("MQTT Connected ✅");
        setLed("ledMqtt", true);

        mqttClient.subscribe(MQTT_CONFIG.topic_data);
        mqttClient.subscribe(MQTT_CONFIG.topic_state);
        mqttClient.subscribe(MQTT_CONFIG.topic_heartbeat);
        mqttClient.subscribe(MQTT_CONFIG.topic_daynight);
        mqttClient.subscribe(MQTT_CONFIG.topic_notif);
        mqttClient.subscribe(MQTT_CONFIG.topic_pump_state);
        mqttClient.subscribe(MQTT_CONFIG.topic_valve_state);
        mqttClient.subscribe(MQTT_CONFIG.topic_wifi_list);
        mqttClient.subscribe(MQTT_CONFIG.topic_wifi_state);
        mqttClient.subscribe(MQTT_CONFIG.topic_wifi_set);
        mqttClient.subscribe(MQTT_CONFIG.topic_Pressure_state);
        mqttClient.subscribe(MQTT_CONFIG.topic_Led_indikator);
        mqttClient.subscribe(MQTT_CONFIG.topic_Wifi_status);
        mqttClient.subscribe(MQTT_CONFIG.topic_Wifi_progress);
        mqttClient.subscribe(MQTT_CONFIG.topic_ESP_RESTART);
        mqttClient.subscribe(MQTT_CONFIG.topic_UPTIME);

        mqttClient.subscribe();
    });

    mqttClient.on("close", () => {

        console.log("MQTT Disconnected");

        setLed("ledMqtt", false);
    });

    mqttClient.on("message", mqttOnMessage);

    mqttClient.on("error", err => {
        console.error("MQTT error ❌:", err);
    });
}

function setLed(id, state) {

    const led = document.getElementById(id);

    if (!led) return;

    if (state) {
        led.classList.add("online");
        led.classList.remove("offline");
    } else {
        led.classList.add("offline");
        led.classList.remove("online");
    }
}

function mqttOnMessage(topic, payload) {

    const message = payload.toString();

    // kirim ke handler WiFi dulu
    if (typeof onMQTTWifi === "function")
        onMQTTWifi(topic, message);

    // hanya parse JSON jika memang JSON
    if (message.startsWith("{") || message.startsWith("[")) {

        try {

            const data = JSON.parse(message);

            if (typeof onMQTTData === "function")
                onMQTTData(topic, data);

            if (typeof onMQTTAlarm === "function")
                onMQTTAlarm(topic, data);

        } catch (e) {

            console.error("JSON parse error:", e);

        }

    }

}