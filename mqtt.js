"use strict";

const MQTT_CONFIG = {

    host: "wss://c2ba5bec181b4ffab0e46ac233be0a3b.s1.eu.hivemq.cloud:8884/mqtt",

    username: "espuser",
    password: "Esp32Cloud2026!",

    topic_data: "esp32/panel/data",
    topic_state: "esp32/panel/state",
    topic_heartbeat: "esp32/panel/heartbeat",
    topic_daynight: "esp32/config/daynight/state",
    topic_notif: "esp32/panel/alarm"

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

function setLed(id, state){

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

    try {

        const data = JSON.parse(payload.toString());

        if (typeof onMQTTData === "function")
            onMQTTData(topic, data);

        if (typeof onMQTTAlarm === "function")
            onMQTTAlarm(topic, data);


    } catch (e) {

        console.error("JSON error", e);

    }

}