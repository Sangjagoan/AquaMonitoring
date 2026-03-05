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

function addNotification(msg, type = "info") {

    if (!alarmEnabled) return;

    const time = new Date().toLocaleTimeString();

    const notif = {
        msg,
        type,
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

        const li = document.createElement("li");

        li.innerHTML = `
            <b>${n.type.toUpperCase()}</b><br>
            ${n.msg}<br>
            <small>${n.time}</small>
            `;

        list.appendChild(li);

    });

    count.textContent = notifications.length;

}

function onMQTTAlarm(topic, data) {
    if (topic === "esp32/panel/alarm") {

console.log("ALARM RX:", topic, data);
        addNotification(data.msg, data.type);

    }

}

window.addEventListener("load", () => {
    initNotifications();

});
