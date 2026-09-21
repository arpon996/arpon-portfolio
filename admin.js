import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

onAuthStateChanged(auth, (user) => {
    const loginDiv = document.getElementById('loginDiv');
    const appDiv = document.getElementById('app');
    const modal = document.getElementById('modal');

    if (modal) modal.hidden = true;

    if (user) {
        if (loginDiv) loginDiv.hidden = true;
        if (appDiv) appDiv.hidden = false;
        list();
    } else {
        if (loginDiv) loginDiv.hidden = false;
        if (appDiv) appDiv.hidden = true;
    }
});

window.login = function(e) {
    if(e) e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => alert("Login Successful! 🎉"))
        .catch((error) => alert("Login Failed: " + error.message));
};

window.logout = function() {
    signOut(auth).then(() => {
        alert("Logged out successfully");
        window.location.reload();
    });
};

window.tab = function(x) {
    const projectsTab = document.getElementById('projects');
    const postsTab = document.getElementById('posts');
    if (projectsTab) projectsTab.hidden = (x !== "projects");
    if (postsTab) postsTab.hidden = (x !== "posts");
};

async function list() {
    const plist = document.getElementById('plist');
    const olist = document.getElementById('olist');
    
    if (plist) plist.innerHTML = "Loading projects...";
    if (olist) olist.innerHTML = "Loading posts...";

    try {
        const pSnapshot = await getDocs(collection(db, "projects"));
        let projects = [];
        pSnapshot.forEach((doc) => projects.push({ _docId: doc.id, ...doc.data() }));
        projects.sort((a, b) => (b.id || 0) - (a.id || 0));

        let pHTML = "";
        projects.forEach((p) => {
            pHTML += `<div class="item">
                <div><b>${esc(p.title)}</b><p>${esc(p.category)}</p></div>
                <div>
                    <button class="edit-proj" data-docid="${p._docId}">Edit</button>
                    <button class="del-proj" data-docid="${p._docId}">Delete</button>
                </div>
            </div>`;
        });
        if (plist) plist.innerHTML = pHTML || "No projects found.";

        const oSnapshot = await getDocs(collection(db, "posts"));
        let posts = [];
        oSnapshot.forEach((doc) => posts.push({ _docId: doc.id, ...doc.data() }));
        posts.sort((a, b) => (b.id || 0) - (a.id || 0));

        let oHTML = "";
        posts.forEach((p) => {
            oHTML += `<div class="item">
                <div><b>${esc(p.title)}</b><p>${esc(p.date)}</p></div>
                <div>
                    <button class="edit-post" data-docid="${p._docId}">Edit</button>
                    <button class="del-post" data-docid="${p._docId}">Delete</button>
                </div>
            </div>`;
        });
        if (olist) olist.innerHTML = oHTML || "No posts found.";

        attachListEvents();

    } catch (error) {
        console.error("Error loading data: ", error);
        if (plist) plist.innerHTML = "Error loading projects.";
        if (olist) olist.innerHTML = "Error loading posts.";
    }
}

function attachListEvents() {
    document.querySelectorAll('.edit-proj').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.docid;
            const snap = await getDocs(collection(db, "projects"));
            snap.forEach(d => {
                if (d.id === id) {
                    const p = d.data();
                    projectForm(id, p.title||'', p.category||'', p.description||'', p.tags||'', p.video||'');
                }
            });
        };
    });

    document.querySelectorAll('.del-proj').forEach(btn => {
        btn.onclick = () => delProject(btn.dataset.docid);
    });

    document.querySelectorAll('.edit-post').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.docid;
            const snap = await getDocs(collection(db, "posts"));
            snap.forEach(d => {
                if (d.id === id) {
                    const p = d.data();
                    postForm(id, p.title||'', p.date||'', p.excerpt||'', p.link||'');
                }
            });
        };
    });

    document.querySelectorAll('.del-post').forEach(btn => {
        btn.onclick = () => delPost(btn.dataset.docid);
    });
}

window.projectForm = function(id = "", title = "", category = "PROJECT", description = "", tags = "", video = "") {
    const modal = document.getElementById('modal');
    const form = document.getElementById('form');
    if (modal) modal.hidden = false;
    
    let tagsStr = Array.isArray(tags) ? tags.join(", ") : tags;

    if (form) form.innerHTML = `<h2>${id ? "Edit" : "Add"} Project</h2>
        <div class=field><label>TITLE</label><input id=t value="${esc(title)}"></div>
        <div class=field><label>CATEGORY</label><input id=c value="${esc(category)}"></div>
        <div class=field><label>DESCRIPTION</label><textarea id=d>${esc(description)}</textarea></div>
        <div class=field><label>TAGS (comma separated)</label><input id=g value="${esc(tagsStr)}">
        <div class=taghelp>Example: Arduino, ESP32, IoT</div></div>
        <div class=field><label>PROJECT VIDEO URL</label><input id=v value="${esc(video)}"></div>
        <button class=submit id=saveProjBtn>SAVE PROJECT</button>`;

    document.getElementById('saveProjBtn').onclick = () => saveProject(id);
};

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
        if (id && id !== "undefined" && id !== "") {
            await updateDoc(doc(db, "projects", id), o);
            alert("Project Updated!");
        } else {
            await addDoc(collection(db, "projects"), o);
            alert("Project Added!");
        }
        window.closeModal();
        list();
    } catch (e) {
        alert("Error saving project: " + e.message);
        console.error(e);
    }
};

window.delProject = async function(id) {
    if (confirm("Delete this project?")) {
        try {
            await deleteDoc(doc(db, "projects", id));
            list();
        } catch (e) {
            alert("Error deleting project: " + e.message);
        }
    }
};

window.postForm = function(id = "", title = "", date = new Date().toLocaleDateString("en-GB").toUpperCase(), excerpt = "", link = "") {
    const modal = document.getElementById('modal');
    const form = document.getElementById('form');
    if (modal) modal.hidden = false;
    if (form) form.innerHTML = `<h2>${id ? "Edit" : "Add"} Post</h2>
        <div class=field><label>TITLE</label><input id=pt value="${esc(title)}"></div>
        <div class=field><label>DATE</label><input id=pd value="${esc(date)}"></div>
        <div class=field><label>CONTENT</label><textarea id=pe>${esc(excerpt)}</textarea></div>
        <div class=field><label>READ MORE URL</label><input id=pl value="${esc(link)}"></div>
        <button class=submit id=savePostBtn>PUBLISH</button>`;

    document.getElementById('savePostBtn').onclick = () => savePost(id);
};

window.savePost = async function(id) {
    const o = {
        id: Date.now(),
        title: document.getElementById('pt').value,
        date: document.getElementById('pd').value,
        excerpt: document.getElementById('pe').value,
        link: document.getElementById('pl').value
    };

    try {
        if (id && id !== "undefined" && id !== "") {
            await updateDoc(doc(db, "posts", id), o);
            alert("Post Updated!");
        } else {
            await addDoc(collection(db, "posts"), o);
            alert("Post Added!");
        }
        window.closeModal();
        list();
    } catch (e) {
        alert("Error saving post: " + e.message);
        console.error(e);
    }
};

window.delPost = async function(id) {
    if (confirm("Delete this post?")) {
        try {
            await deleteDoc(doc(db, "posts", id));
            list();
        } catch (e) {
            alert("Error deleting post: " + e.message);
        }
    }
};

window.closeModal = function() {
    const modal = document.getElementById('modal');
    if (modal) modal.hidden = true;
};
