"use strict";

window.activeDevice = localStorage.getItem("activeDevice") || null;

window.devices
window.activeDevice
// 🌙 Day / Night Mode Control
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener("change", () => {

        const disabled = radio.value !== "AUTO" && radio.checked;

        document.getElementById("nightStart").disabled = disabled;
        document.getElementById("nightEnd").disabled = disabled;
    });
});

function publishDevice(suffix, payload) {

    if (!window.activeDevice) {
        console.warn("No active device");
        return;
    }

    const topic = `esp32/${window.activeDevice}/${suffix}`;

    // 🔥 AUTO HANDLE stringify
    const finalPayload = typeof payload === "string"
        ? payload
        : JSON.stringify(payload);

    console.log("MQTT SEND:", topic, finalPayload);

    mqttClient.publish(topic, finalPayload);
}

function saveDayNightConfigMQTT() {

    if (!mqttClient || !mqttClient.connected) {
        alert("MQTT belum terhubung");
        return;
    }

    const selected = document.querySelector('input[name="mode"]:checked').value;

    let mode = 0;
    if (selected === "DAY") mode = 1;
    if (selected === "NIGHT") mode = 2;

    const payload = {
        mode: mode,
        nightStart: parseInt(document.getElementById("nightStart").value),
        nightEnd: parseInt(document.getElementById("nightEnd").value)
    };

    // 🔥 FIX: kirim object langsung
    publishDevice("config/daynight/set", payload);

    updateDayNightUI();
    console.log("Config sent:", payload);
}

function updateDayNightUI(data) {

    if (!data) return;

    if (data.mode === 0)
        document.querySelector("input[value='AUTO']").checked = true;
    if (data.mode === 1)
        document.querySelector("input[value='DAY']").checked = true;
    if (data.mode === 2)
        document.querySelector("input[value='NIGHT']").checked = true;

    const startEl = document.getElementById("nightStart");
    const endEl = document.getElementById("nightEnd");

    if (startEl && typeof data.nightStart !== "undefined")
        startEl.value = data.nightStart;
    if (endEl && typeof data.nightEnd !== "undefined")
        endEl.value = data.nightEnd;

}

function updateSystemStateUI(data) {
    const stateEl = document.getElementById("plcState");
    const modeEl = document.getElementById("systemMode");

    if (stateEl)
        stateEl.textContent = data.plcState;

    if (modeEl)
        modeEl.textContent = data.systemMode;
}

function setLed(id, state, colorTrue = "green", colorFalse = "red") {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.remove("green", "red", "yellow", "blink");

    if (state)
        el.classList.add(colorTrue);
    else
        el.classList.add(colorFalse);
}

function toggleValve(valve, state) {

    const payload = {
        valve: valve,
        state: state ? "on" : "off"
    };

    publishDevice("panel/stopkran/set", payload);

}

function updateValve(valve, state) {

    const id = valve === "utara"
        ? "valveUtara"
        : "valveSelatan";

    const el = document.getElementById(id);

    if (el) {
        el.checked = state;
    }

}

function savePumpSetting() {

    const payload = JSON.stringify({

        stop: parseFloat(levelStop.value),
        one: parseFloat(levelOne.value),
        day: parseFloat(levelDay.value),
        night: parseFloat(levelNight.value),
    })

    publishDevice("panel/pump/set", payload);

}

function saveCalibrasi() {

    const payload = JSON.stringify({
        kp: parseFloat(kedalam.value),
        js: parseFloat(jarakSensorDariPermukaanAtas.value)

    })

    publishDevice("panel/calis/set", payload);

}

function savePressureSetting() {

    const payload = JSON.stringify({

        target: parseFloat(p_target.value),
        high: parseFloat(p_high.value),
        low: parseFloat(p_low.value),

        deadband: parseFloat(pressureDeadband.value),
        overShoot: parseFloat(over_shoot.value),
        overLoad: parseFloat(over_Load.value),
        pulseMin: parseInt(p_pulseMin.value),
        pulseMax: parseInt(p_pulseMax.value),
        lockTime: parseInt(pressureLock.value),

        settle: parseInt(p_settle.value)

    });

    publishDevice("panel/pressure/set", payload);

}

function saveAlarmSettings() {

    const payload = JSON.stringify({
        lowUltra: parseFloat(low_u.value),
        losUltra: parseFloat(los_u.value),
        lowPress: parseFloat(low_p.value),
        overPress: parseFloat(over_p.value),
        lowVolt: parseFloat(low_v.value),
        low_Volt: parseFloat(low__v.value),
        overVolt: parseFloat(over_v.value),
        over_Volt: parseFloat(over__v.value),
        overCur: parseFloat(over_c.value),
        over_Cur: parseFloat(over__c.value)
    });

    publishDevice("panel/alarm/sensor/set", payload);

}

function updateHealth(health, state) {

    const id = health === "hlt"
        ? "systemError"
        : "valveS";

    const el = document.getElementById(id);

    if (el) {
        el.checked = state;
    }
}

function toggleHealth(state) {

    if (!mqttClient || !mqttClient.connected) return;

    const payload = JSON.stringify({
        hlt: state
    });

    publishDevice("panel/system/set", payload);

}

function onMQTTData(topic, data) {
    const parts = topic.split("/");
    if (parts.length < 3) return;

    const deviceId = parts[1];
    const type = parts[2];
    const sub = parts[3];

    if (!deviceId.startsWith("ESP32_")) return;

    // ✅ INIT GLOBAL
    window.devices = window.devices || {};

    if (!window.devices[deviceId]) {
        window.devices[deviceId] = {};
    }

    Object.assign(window.devices[deviceId], data);

    // ✅ AUTO SET DEVICE PERTAMA
    if (!window.activeDevice) {
        window.activeDevice = deviceId;
        localStorage.setItem("device", deviceId);
    }

    if (typeof updateDeviceSelector === "function") {
        updateDeviceSelector();
    }

    if (typeof renderDevices === "function") {
        renderDevices();
    }

    // ✅ FILTER
    if (deviceId !== window.activeDevice) return;

    if (type === "daynight" && sub === "state" && deviceId === window.activeDevice) {

        updateSystemStateUI(data);
        updateDayNightUI(data);

        const errLed = document.getElementById("ledError");

        errLed.classList.remove("green", "red", "blink");

        if (data.plcState.includes("Error")) {
            errLed.classList.add("red", "blink");
        } else {
            errLed.classList.add("green");
        }
        console.table(devices);
    }

    if (type === "heartbeat" && deviceId === window.activeDevice) {

        const hb = data;

        const toggle = document.getElementById("systemError");
        if (toggle) toggle.checked = hb.hlt;

        updateHealth("systemError", hb.hlt);
        setLed("ledSystem", hb.hlt);
        setLed("ledRun", hb.run);
        setLed("ledWifi", hb.wifi);
        setLed("sibleAtas", hb.sa);
        setLed("sibleBawah", hb.sb);

        const otaLed = document.getElementById("ledOta");
        otaLed.classList.remove("green", "red", "yellow");

        if (hb.ota) otaLed.classList.add("yellow");
        else otaLed.classList.add("green");

        console.table(data);
    }

    if (type === "pump" && sub === "state" && deviceId === window.activeDevice) {

        const pump = data || {};

        levelStop.value = pump.stop ?? "";
        levelOne.value = pump.one ?? "";
        levelDay.value = pump.day ?? "";
        levelNight.value = pump.night ?? "";
        console.table(data);
    }

    if (type === "calis" && sub === "state" && deviceId === window.activeDevice) {

        const pump = data || {};

        kedalam.value = pump.kp ?? "";
        jarakSensorDariPermukaanAtas.value = pump.js ?? "";

        console.table(data);
    }

    if (type === "valve" && sub === "state" && deviceId === window.activeDevice) {

        const stop = data
        updateValve("utara", stop.utara)
        updateValve("selatan", stop.selatan)

        console.table(data);

    }

    if (type === "pressure" && sub === "state" && deviceId === window.activeDevice) {

        const p = data || {};

        p_target.value = p.target ?? "";
        p_high.value = p.high ?? "";
        p_low.value = p.low ?? "";

        pressureDeadband.value = p.deadband ?? "";
        pressureLock.value = p.lock ?? "";
        p_pulseMin.value = p.pulseMin ?? "";
        p_pulseMax.value = p.pulseMax ?? "";
        over_shoot.value = p.ovr ?? "";
        over_Load.value = p.ol ?? "";

        p_settle.value = p.settle ?? "";

        console.table(data);

    }

    if (type === "alarm" && sub === "sensor" && deviceId === window.activeDevice) {

        const p = data || {};
        low_u.value = p.lwu ?? "";
        los_u.value = p.lsu ?? "";
        low_p.value = p.lp ?? "";
        over_p.value = p.op ?? "";
        low_v.value = p.lv ?? "";
        low__v.value = p.l_v ?? "";
        over_v.value = p.ov ?? "";
        over__v.value = p.o_v ?? "";
        over_c.value = p.oc ?? "";
        over__c.value = p.o_c ?? "";
        console.table(data);

    }
}

window.addEventListener("load", () => {
    mqttStart();
})