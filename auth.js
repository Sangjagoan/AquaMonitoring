function checkSession() {

    const session = JSON.parse(localStorage.getItem("session"));

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    if (Date.now() > session.expires) {
        localStorage.removeItem("session");
        alert("Session habis, login lagi ⚠️");
        window.location.href = "login.html";
        return;
    }

    console.log("Session OK:", session.email);
}

document.addEventListener("DOMContentLoaded", checkSession);

function getSession() {
    return JSON.parse(localStorage.getItem("session") || "null");
}