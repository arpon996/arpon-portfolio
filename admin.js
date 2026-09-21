import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXcjMpB32RPB7YfDS7wq3Ew5pqSlQn50Q",
    authDomain: "arpon-portfolio.firebaseapp.com",
    projectId: "arpon-portfolio",
    storageBucket: "arpon-portfolio.firebasestorage.app",
    messagingSenderId: "708250635151",
    appId: "1:708250635151:web:eed45fa7355c5ea84fd9fa",
    measurementId: "G-4P5301PRR9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginDiv').hidden = true;
        document.getElementById('app').hidden = false;
        list();
    } else {
        document.getElementById('loginDiv').hidden = false;
        document.getElementById('app').hidden = true;
    }
});

// Login
window.login = function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            alert("Login Successful!");
        })
        .catch((error) => {
            alert("Login Failed: " + error.message);
        });
};

// Logout
window.logout = function() {
    signOut(auth).then(() => {
        alert("Logged out successfully");
    });
};

// Tab Switching
window.tab = function(x) {
    document.getElementById('projects').hidden = x !== "projects";
    document.getElementById('posts').hidden = x !== "posts";
};

// List Projects and Posts from Firestore
async function list() {
    const plist = document.getElementById('plist');
    const olist = document.getElementById('olist');
    plist.innerHTML = "Loading projects...";
    olist.innerHTML = "Loading posts...";

    // Load Projects
    const pQuery = query(collection(db, "projects"), orderBy("id", "desc"));
    const pSnapshot = await getDocs(pQuery);
    let pHTML = "";
    pSnapshot.forEach((doc) => {
        const p = doc.data();
        pHTML += `<div class=item><div><b>${esc(p.title)}</b><p>${esc(p.category)}</p></div><div><button onclick="projectForm('${doc.id}', '${esc(p.title)}', '${esc(p.category)}', '${esc(p.description)}', '${esc(p.tags)}', '${esc(p.video)}')">Edit</button><button onclick="delProject('${doc.id}')">Delete</button></div></div>`;
    });
    plist.innerHTML = pHTML || "No projects found.";

    // Load Posts
    const oQuery = query(collection(db, "posts"), orderBy("id", "desc"));
    const oSnapshot = await getDocs(oQuery);
    let oHTML = "";
    oSnapshot.forEach((doc) => {
        const p = doc.data();
        oHTML += `<div class=item><div><b>${esc(p.title)}</b><p>${esc(p.date)}</p></div><div><button onclick="postForm('${doc.id}', '${esc(p.title)}', '${esc(p.date)}', '${esc(p.excerpt)}', '${esc(p.link)}')">Edit</button><button onclick="delPost('${doc.id}')">Delete</button></div></div>`;
    });
    olist.innerHTML = oHTML || "No posts found.";
}

// Project Form
window.projectForm = function(id = "", title = "", category = "PROJECT", description = "", tags = "", video = "") {
    const modal = document.getElementById('modal');
    const form = document.getElementById('form');
    modal.hidden = false;
    form.innerHTML = `<h2>${id ? "Edit" : "Add"} Project</h2>
        <div class=field><label>TITLE</label><input id=t value="${title}"></div>
        <div class=field><label>CATEGORY</label><input id=c value="${category}"></div>
        <div class=field><label>DESCRIPTION</label><textarea id=d>${description}</textarea></div>
        <div class=field><label>TAGS (comma separated)</label><input id=g value="${tags}">
        <div class=taghelp>Example: Arduino, ESP32, IoT</div></div>
        <div class=field><label>PROJECT VIDEO URL</label><input id=v value="${video}"></div>
        <button class=submit onclick="saveProject('${id}')">SAVE PROJECT</button>`;
};

// Save or Update Project
window.saveProject = async function(id) {
    const o = {
        id: Date.now(),
        title: document.getElementById('t').value,
        category: document.getElementById('c').value,
        description: document.getElementById('d').value,
        tags: document.getElementById('g').value,
        video: document.getElementById('v').value
    };

    try {
        if (id) {
            await updateDoc(doc(db, "projects", id), o);
            alert("Project Updated!");
        } else {
            await addDoc(collection(db, "projects"), o);
            alert("Project Added!");
        }
        closeModal();
        list();
    } catch (e) {
        alert("Error saving project: " + e.message);
    }
};

// Delete Project
window.delProject = async function(id) {
    if (confirm("Delete this project?")) {
        await deleteDoc(doc(db, "projects", id));
        list();
    }
};

// Post Form
window.postForm = function(id = "", title = "", date = new Date().toLocaleDateString("en-GB").toUpperCase(), excerpt = "", link = "") {
    const modal = document.getElementById('modal');
    const form = document.getElementById('form');
    modal.hidden = false;
    form.innerHTML = `<h2>${id ? "Edit" : "Add"} Post</h2>
        <div class=field><label>TITLE</label><input id=pt value="${title}"></div>
        <div class=field><label>DATE</label><input id=pd value="${date}"></div>
        <div class=field><label>CONTENT</label><textarea id=pe>${excerpt}</textarea></div>
        <div class=field><label>READ MORE URL</label><input id=pl value="${link}"></div>
        <button class=submit onclick="savePost('${id}')">PUBLISH</button>`;
};

// Save or Update Post
window.savePost = async function(id) {
    const o = {
        id: Date.now(),
        title: document.getElementById('pt').value,
        date: document.getElementById('pd').value,
        excerpt: document.getElementById('pe').value,
        link: document.getElementById('pl').value
    };

    try {
        if (id) {
            await updateDoc(doc(db, "posts", id), o);
            alert("Post Updated!");
        } else {
            await addDoc(collection(db, "posts"), o);
            alert("Post Added!");
        }
        closeModal();
        list();
    } catch (e) {
        alert("Error saving post: " + e.message);
    }
};

// Delete Post
window.delPost = async function(id) {
    if (confirm("Delete this post?")) {
        await deleteDoc(doc(db, "posts", id));
        list();
    }
};

window.closeModal = function() {
    document.getElementById('modal').hidden = true;
};

function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}
