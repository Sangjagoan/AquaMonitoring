
function renderDevices() {

    const container = document.getElementById("devices");
    if (!container) return;

    let html = "";

    Object.keys(window.devices).forEach(id => {

        const d = window.devices[id] || {};

        const name = (window.deviceNames && window.deviceNames[id]) || id;

        html += `
            <div class="card" onclick="switchDevice('${id}')">
                
                <h3 id="name-${id}">
                    ${name}
                </h3>

                <small>${id}</small>

                <p>Pressure: ${d.kg ?? '-'}</p>
                <p>Level: ${d.lvl ?? '-'}</p>

            </div>
        `;
    });

    container.innerHTML = html;
}

function switchDevice(deviceId) {

    window.activeDevice = deviceId;
    localStorage.setItem("activeDevice", deviceId);

    console.log("Switch ke:", deviceId);

    // 🔥 sync dropdown
    const select = document.getElementById("deviceSelect");
    if (select) select.value = deviceId;

    // 🔥 refresh setting UI
    if (typeof refreshDeviceUI === "function") {
        refreshDeviceUI();
    }
}
