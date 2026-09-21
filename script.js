import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBXcjMpB32RPB7YfDS7wq3Ew5pqSlQn50Q",
    authDomain: "arpon-portfolio.firebaseapp.com",
    projectId: "arpon-portfolio",
    storageBucket: "arpon-portfolio.firebasestorage.app",
    messagingSenderId: "708250635151",
    appId: "1:708250635151:web:eed45fa7355c5ea84fd9fa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[m]));

async function render() {
    document.querySelector("#projectsGrid").innerHTML = "<p style='color:#888;'>Loading projects...</p>";
    document.querySelector("#postsGrid").innerHTML = "<p style='color:#888;'>Loading posts...</p>";

    try {
        // Load Projects from Firestore
        const pQuery = query(collection(db, "projects"), orderBy("id", "desc"));
        const pSnapshot = await getDocs(pQuery);
        let projectsHTML = "";
        
        pSnapshot.forEach((doc) => {
            const p = doc.data();
            let tagsArray = Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map(t => t.trim()) : []);
            
            projectsHTML += `<article class="project">
                <span class="meta">${esc(p.category || "PROJECT")}</span>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.description)}</p>
                <div class="tags">${tagsArray.map(esc).join(" • ")}</div>
                ${p.video ? `<a class="video" href="${esc(p.video)}" target="_blank">Watch project video ↗</a>` : ""}
            </article>`;
        });
        document.querySelector("#projectsGrid").innerHTML = projectsHTML || "<p>No projects found.</p>";

        // Load Posts from Firestore
        const oQuery = query(collection(db, "posts"), orderBy("id", "desc"));
        const oSnapshot = await getDocs(oQuery);
        let postsHTML = "";
        
        oSnapshot.forEach((doc) => {
            const p = doc.data();
            postsHTML += `<article class="post">
                <span class="meta">${esc(p.date || "UPDATE")}</span>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.excerpt || "")}</p>
                ${p.link ? `<a class="video" href="${esc(p.link)}" target="_blank">Read more ↗</a>` : ""}
            </article>`;
        });
        document.querySelector("#postsGrid").innerHTML = postsHTML || "<p>No posts found.</p>";

    } catch (error) {
        console.error("Error loading data:", error);
        document.querySelector("#projectsGrid").innerHTML = "<p>Error loading projects.</p>";
        document.querySelector("#postsGrid").innerHTML = "<p>Error loading posts.</p>";
    }

    document.querySelector("#year").textContent = new Date().getFullYear();
}

render();
