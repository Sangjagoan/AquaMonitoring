const devices = {};
let activeDevice = null;
// 🌙 Day / Night Mode Control
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener("change", () => {

        const disabled = radio.value !== "AUTO" && radio.checked;

        document.getElementById("nightStart").disabled = disabled;
        document.getElementById("nightEnd").disabled = disabled;
    });
});

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

    mqttClient.publish(
        "esp32/config/daynight/set",
        JSON.stringify(payload),
        { qos: 1, retain: false }
    );

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

    const payload = JSON.stringify({
        valve: valve,
        state: state ? "on" : "off"
    });

    mqttClient.publish(
        "esp32/panel/stopkran/set",
        payload
    );
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
        kp: parseFloat(kedalam.value),
        js: parseFloat(jarakSensorDariPermukaanAtas.value)

    })

    mqttClient.publish(
        "esp32/panel/pump/set",
        payload
    )

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

    mqttClient.publish(
        "esp32/panel/pressure/set",
        payload
    );

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

    mqttClient.publish(
        "esp32/panel/system/set",
        payload
    );

}

function updateDeviceSelector() {

    const select = document.getElementById("deviceSelect");
    if (!select) return;

    select.innerHTML = "";

    for (const id in devices) {
        select.innerHTML += `<option value="${id}">${id}</option>`;
    }

    select.value = activeDevice;
}

function renderDevices() {

    const container = document.getElementById("devices");
    if (!container) return;

    container.innerHTML = "";

    for (const id in devices) {

        const d = devices[id];

        container.innerHTML += `
            <div class="card">
                <h4>${id}</h4>
                <p>Health: ${d.hlt ? "OK" : "ERROR"}</p>
                <p>Run: ${d.run}</p>
                <p>WiFi: ${d.wifi}</p>
            </div>
        `;
    }
}

function onMQTTData(topic, data) {
    const parts = topic.split("/");
    if (parts.length < 3) return;

    const deviceId = parts[1];
    const type = parts[2];
    const sub = parts[3];

    // filter device valid
    if (!deviceId.startsWith("ESP32_")) return;

    if (type === "daynight" && sub === "state") {

        if (deviceId !== activeDevice) return;

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

    if (type === "heartbeat") {

        if (!devices[deviceId]) {
            devices[deviceId] = {};
        }

        // 🔥 merge data
        devices[deviceId] = {
            ...devices[deviceId],
            ...data
        };

        if (!activeDevice) {
            activeDevice = deviceId;
        }

        updateDeviceSelector();
        renderDevices();

        // 🚨 FILTER UI
        if (deviceId !== activeDevice) return;

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

    if (type === "pump" && sub === "state") {

        if (deviceId !== activeDevice) return;

        const pump = data || {};

        levelStop.value = pump.stop ?? "";
        levelOne.value = pump.one ?? "";
        levelDay.value = pump.day ?? "";
        levelNight.value = pump.night ?? "";
        kedalam.value = pump.kp ?? "";
        jarakSensorDariPermukaanAtas.value = pump.js ?? "";
        
        console.table(data);
    }

    if (type === "valve" && sub === "state") {

        const stop = data
        updateValve("utara", stop.utara)
        updateValve("selatan", stop.selatan)

        console.table(data);

    }

    if (type === "pressure" && sub === "state") {

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
}

document.addEventListener("change", (e) => {
    if (e.target.id === "deviceSelect") {
        activeDevice = e.target.value;
        console.log("Selected Device:", activeDevice);
    }
});

window.addEventListener("load", () => {
    mqttStart();
})