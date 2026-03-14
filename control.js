
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
        over: parseFloat(overshoot.value),
        overLoad: parseFloat(overLoad.value),
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

function toggleHealth(state){

    if (!mqttClient || !mqttClient.connected) return;

    const payload = JSON.stringify({
        hlt: state
    });

    mqttClient.publish(
        "esp32/panel/system/set",
        payload
    );

}

function onMQTTData(topic, data) {

    if (topic === "esp32/config/daynight/state") {
        updateSystemStateUI(data);
        updateDayNightUI(data);

        const errLed = document.getElementById("ledError");

        errLed.classList.remove("green", "red", "blink");

        if (data.plcState.includes("Error")) {
            errLed.classList.add("red");
            errLed.classList.add("blink");
        }
        else {
            errLed.classList.add("green");
        }

        console.log("state:", data);
    }

    if (topic === "esp32/panel/heartbeat") {
        const hb = data;

        const toggle = document.getElementById("systemError");

        if (toggle) {
            toggle.checked = hb.hlt;
        }

        updateHealth("systemError", hb.hlt);
        setLed("ledSystem", hb.hlt);
        setLed("ledRun", hb.run);
        setLed("ledWifi", hb.wifi);
        setLed("sibleAtas", hb.sa);
        setLed("sibleBawah", hb.sb);
        // OTA khusus
        const otaLed = document.getElementById("ledOta");
        otaLed.classList.remove("green", "red", "yellow");

        if (hb.ota)
            otaLed.classList.add("yellow");
        else
            otaLed.classList.add("green");
        console.log("heartbeat:", data);
    }

    if (topic === "esp32/panel/pump/state") {

        const pump = data || {}

        levelStop.value = pump.stop ?? ""
        levelOne.value = pump.one ?? ""
        levelDay.value = pump.day ?? ""
        levelNight.value = pump.night ?? ""
        kedalam.value = pump.kp ?? ""
        jarakSensorDariPermukaanAtas.value = pump.js ?? ""

        console.log("pump:", data);
    }

    if (topic === "esp32/panel/valve/state") {
        const stop = data
        updateValve("utara", stop.utara)
        updateValve("selatan", stop.selatan)

        console.log("valve:", data)

    }

    if (topic === "esp32/panel/pressure/state") {

        const p = data || {};

        p_target.value = p.target ?? "";
        p_high.value = p.high ?? "";
        p_low.value = p.low ?? "";

        pressureDeadband.value = p.deadband ?? "";
        pressureLock.value = p.lock ?? "";
        p_pulseMin.value = p.pulseMin ?? "";
        p_pulseMax.value = p.pulseMax ?? "";
        overshoot.value = p.ovr ?? "";
        overLoad.value = p.ol ?? "";

        p_settle.value = p.settle ?? "";

        console.log("pressure:", data);
    }
}

window.addEventListener("load", () => {
    mqttStart();
})