let notifications = [];
let alarmEnabled = true;
let lastSoundTime = 0;

const soundMap = {
    error: new Audio("/sound/error.mp3"),
    warning: new Audio("/sound/warning.mp3"),
    clear: new Audio("/sound/clear.mp3")
};

function playNotifSound(type) {
    const now = Date.now();

    if (now - lastSoundTime < 1000) return; // 🔥 minimal 1 detik

    const s = soundMap[type];
    if (!s) return;

    s.currentTime = 0;
    s.play().catch(() => { });

    lastSoundTime = now;
}

function initNotifications() {

    const btn = document.getElementById("notifBtn");
    const dropdown = document.getElementById("notifDropdown");

    if (!btn || !dropdown) return;

    btn.addEventListener("click", () => {
        dropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });
}

function addNotification(msg, type = "info", value, deviceId) {

    if (!alarmEnabled) return;

    const time = new Date().toLocaleTimeString();

    // 🔥 anti duplicate
    const last = notifications[0];
    if (last &&
        last.msg === msg &&
        last.type === type &&
        last.deviceId === deviceId) {
        return;
    }

    const notif = {
        msg,
        type,
        value,
        time,
        deviceId,
        createdAt: Date.now() // 🔥 expiry
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

    const now = Date.now();

    // 🔥 auto expire (15 detik)
    notifications = notifications.filter(n => (now - n.createdAt) < 15000);

    list.innerHTML = "";

    notifications.filter(n => n.deviceId === window.activeDevice) // 🔥 penting
        .forEach(n => {

            const unitMap = {
                "_Current OverLoad": "A",
                "Pressure OVERLOAD": "bar",
                "Voltage Overload": "V"
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

    const activeNotifs = notifications.filter(n =>
        n.deviceId === window.activeDevice &&
        n.type !== "clear" // 🔥 jangan hitung normal
    );

    // 🔥 pulse logic
    if (activeNotifs.length > 0) {
        count.classList.add("pulse");
    } else {
        count.classList.remove("pulse");
    }

    count.textContent = activeNotifs.length;
}

function onMQTTAlarm(topic, data) {

    const parts = topic.split("/");
    if (parts.length < 3) return;

    const deviceId = parts[1];
    const type = parts[2];

    if (!deviceId.startsWith("ESP32_")) return;

    if (data.type === "clear" && window.devices[deviceId]?.alarmTime) {
        const age = Date.now() - window.devices[deviceId].alarmTime;
        if (age < 3000) return; // tahan 3 detik
    }

    if (data.type === "clear") {

        delete window.devices[deviceId].alarm;

        // 🔥 hapus semua notif device ini
        notifications = notifications.filter(n => n.deviceId !== deviceId);

        // 🔥 tambahkan state normal
        addNotification(data.msg, data.type, data.value, deviceId);
        playNotifSound(data.type);

        renderDevices();
        renderNotifications();
        return;
    }
    if (type === "alarm") {

        console.log("ALARM DATA:", data);

        if (!window.devices[deviceId]) {
            window.devices[deviceId] = {};
        }

        window.devices[deviceId].alarm = data;
        window.devices[deviceId].alarmTime = Date.now();

        // 🔥 hapus notif lama device ini
        notifications = notifications.filter(n => n.deviceId !== deviceId);

        // 🔥 WAJIB: tambahkan notif baru
        addNotification(data.msg, data.type, data.value, deviceId);
        playNotifSound(data.type);

        renderDevices();
    }

}

window.addEventListener("load", () => {
    initNotifications();
});