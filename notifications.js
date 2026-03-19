let notifications = [];
let alarmEnabled = true;

function initNotifications() {

    const btn = document.getElementById("notifBtn");
    const dropdown = document.getElementById("notifDropdown");

    if (!btn || !dropdown) return;

    btn.addEventListener("click", () => {
        dropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {

        if (!btn.contains(e.target) &&
            !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }

    });

}

function addNotification(msg, type = "info", value) {

    if (!alarmEnabled) return;

    const time = new Date().toLocaleTimeString();

    const notif = {
        msg,
        type,
        value,
        time
    };

    notifications.unshift(notif);

    if (notifications.length > 20)
        notifications.pop();

    renderNotifications();
}

function renderNotifications() {

    const list = document.getElementById("notifList");
    const count = document.getElementById("notifCount");

    if (!list) return;

    list.innerHTML = "";

    notifications.forEach(n => {

        const unitMap = {
            "_Current OverLoad": "A",
            "Pressure High": "bar"
        };

        const unit = unitMap[n.msg] || "";

        const hasValue = n.value !== undefined && n.value !== null;

        const text = hasValue
            ? `${n.msg} (${n.value}${unit ? " " + unit : ""})`
            : n.msg;

        const li = document.createElement("li");

        li.innerHTML = `
        <b>${n.type.toUpperCase()}</b><br>
        ${text}<br>
        <small>${n.time}</small>
        `;

        list.appendChild(li);
    });

    count.textContent = notifications.length;

}

function onMQTTAlarm(topic, data) {

    const parts = topic.split("/");
    if (parts.length < 3) return;

    const deviceId = parts[1];
    const type = parts[2];

    // skip kalau bukan device valid
    if (!deviceId.startsWith("ESP32_")) return;

    if (type === "alarm") {

        console.log("ALARM RX:", topic, data);
        console.log("ALARM DATA:", data);
        // 🔥 pastikan device ada
        if (!window.devices[deviceId]) {
            window.devices[deviceId] = {};
        }

        // 🔥 simpan alarm ke device
        window.devices[deviceId].alarm = data;

        // 🔥 simpan waktu (biar bisa expire kalau mau)
        window.devices[deviceId].alarmTime = Date.now();

        // 🔥 notif popup
        addNotification(data.msg, data.type, data.value);
        // 🔥 refresh UI
        renderDevices();
    }
}

window.addEventListener("load", () => {
    initNotifications();

});
