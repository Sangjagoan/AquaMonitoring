
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

function onMQTTData(topic, data) {

    if (topic === "esp32/config/daynight/state") {
        updateSystemStateUI(data);
        updateDayNightUI(data);

        console.log("state:", data);
    }
}

window.addEventListener("load", () => {
    mqttStart();
})