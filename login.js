"use strict";

// =======================
// HASH PASSWORD
// =======================
async function hashPassword(password) {
    const enc = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// =======================
// REGISTER USER
// =======================
async function registerUser(email, password) {

    let users = JSON.parse(localStorage.getItem("users") || "[]");

    if (users.find(u => u.email === email)) {
        alert("User sudah ada ❌");
        return;
    }

    const hashed = await hashPassword(password);

    users.push({
        email,
        password: hashed,
        role: "user",   // 🔥 role default
        devices: []
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Register berhasil 🔥");
}

// =======================
// LOGIN USER
// =======================
async function loginUser(email, password) {

    let users = JSON.parse(localStorage.getItem("users") || "[]");

    const hashed = await hashPassword(password);

    const user = users.find(u =>
        u.email === email && u.password === hashed
    );

    if (!user) {
        alert("Email / password salah ❌");
        return;
    }

    // 🔥 SESSION + ROLE
    const session = {
        email: user.email,
        role: user.role,
        devices: user.devices || [],
        expires: Date.now() + (60 * 60 * 1000)
    };

    localStorage.setItem("session", JSON.stringify(session));

    window.location.href = "index.html";
}

// =======================
// EVENT FORM
// =======================
document.addEventListener("DOMContentLoaded", () => {

    // LOGIN
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = loginForm.querySelector("input[type=email]").value;
            const password = document.getElementById("loginPassword").value;

            await loginUser(email, password);
        });
    }

    // REGISTER
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = registerForm.querySelector("input[type=email]").value;
            const password = document.getElementById("registerPassword").value;

            await registerUser(email, password);
        });
    }

});