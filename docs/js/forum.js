// CONFIGURATION
const API_URL = 'http://localhost:3000/posts';
const CURRENT_USER = "Estudiante_UNC"; // Hardcoded user to satisfy DB constraint

// DOM ELEMENTS
const postsContainer = document.getElementById('forum-posts');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('postContent');
const form = document.getElementById('postForm');

// STATE
let currentCategory = null;

// --------------------
// Load posts
// --------------------
async function loadPosts(category) {
    currentCategory = category;

    // Clear current list to show user something is happening
    postsContainer.innerHTML = '<p class="alert">Cargando...</p>';

    try {
        const res = await fetch(`${API_URL}?category=${category}`);
        const posts = await res.json();

        renderPosts(posts);

        // Update the form placeholder to show user where they are posting
        titleInput.placeholder = `Título (Publicando en ${category})`;
    } catch(error) {
        console.error(error);
        postsContainer.innerHTML = '<p class="alert"> Error cargando posts. </p>';
    }
}

// --------------------
// Render posts HTML
// --------------------
function renderPosts(posts) {
    postsContainer.innerHTML = '';

    if (posts.length === 0) {
        postsContainer.innerHTML = `<p class="alert"> No hay publicaciones en ${currentCategory}. ¡Sé el primero! </p>`;
        return;
    }

    // Map the array of objects to HTML strings
    const html = posts.map(post => `
        <div class="post">
            <h2> ${post.title} </h2>
            <small> Por: ${post.user} | Fecha: ${new Date(post.createdAt).toLocaleDateString()}</small>
            <p> ${post.content} </p>
            <button onclick="remove(${post.id}" calss="delte-btn"> Eliminar </button>
        </div>
        <hr>
    `).join('');

    postsContainer.innerHTML = html;
}

// --------------------
// Create post
// --------------------
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop page reload

    if (!currentCategory) {
        alert("¡Por favor selecciona una materia (categoría) primero!");
        return;
    }

    const title = titleInput.value;
    const content = contentInput.value;

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title,
            content: content,
            user: CURRENT_USER,
            category: currentCategory
        })
    });

    titleInput.value = '';
    contentInput.value = '';
    loadPosts(currentCategory);
});

// --------------------
// Delete
// --------------------
async function remove(id) {
    if(!confirm("¿Borrar post?")) return;

    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadPosts(currentCategory);
}
