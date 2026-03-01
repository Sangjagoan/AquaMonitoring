
// 🌙 Day / Night Mode Control
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener("change", () => {

        const disabled = radio.value !== "AUTO" && radio.checked;

        document.getElementById("nightStart").disabled = disabled;
        document.getElementById("nightEnd").disabled = disabled;
    });
});

function updateDayNightUI(cfg) {
    // mode radio
    if (cfg.mode === 0)
        document.querySelector("input[value='AUTO']").checked = true;

    else if (cfg.mode === 1)
        document.querySelector("input[value='DAY']").checked = true;

    else if (cfg.mode === 2)
        document.querySelector("input[value='NIGHT']").checked = true;

    document.getElementById("nightStart").value = cfg.nightStart;
    document.getElementById("nightEnd").value = cfg.nightEnd;


}

function updateCurrentState(data)
{
    const el = document.getElementById("currentState");

    if(!el) return;

    el.innerText =
        data.state + " (" + data.mode + ")";
}

function saveDayNightConfigMQTT() {

    const selected = document.querySelector('input[name="mode"]:checked').value;

    let mode = 0;
    if (selected === "DAY") mode = 1;
    if (selected === "NIGHT") mode = 2;
    const nightStart =
        parseInt(document.getElementById("nightStart").value);

    const nightEnd =
        parseInt(document.getElementById("nightEnd").value);

    const payload =
    {
        mode: mode,
        nightStart: nightStart,
        nightEnd: nightEnd
    };

    mqttClient.publish(
        "esp32/config/daynight/set",
        JSON.stringify(payload)
    );

    console.log("Config sent via MQTT");

}

function onMQTTData(topic, data) {
    if (topic === "esp32/config/daynight") {
        console.log("DayNight config:", data);
        updateDayNightUI(data);

    }

    if (topic === "esp32/panel/state") {
        console.log("state:", data);
        updateCurrentState(data);
    }
}

window.addEventListener("load", () => {
    mqttStart();
})