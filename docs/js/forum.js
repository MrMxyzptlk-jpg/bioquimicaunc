import { CURRENT_USER } from './config.js';
import { createPost, getPosts, updatePost, removePost } from './posts.js';
import { createComment, getComments, updateComment, removeComment } from './comments.js';

// DOM ELEMENTS
const form = document.getElementById('postForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('postContent');
const postsContainer = document.getElementById('forum-posts');

// STATE
let currentCategory = null;

// --------------------
// Load posts
// --------------------
export async function loadPosts(category) {
    currentCategory = category;

    postsContainer.innerHTML = '<p class="alert">Cargando...</p>';  // Clear current list to show user something is happening

    const posts = await getPosts(category);
    renderPosts(posts);
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
            <div class="post-actions">
                <button onclick="updatePost(${post.id})" class="edit-btn"> Editar </button>
                <button onclick="removePost(${post.id})" class="comment-btn"> Eliminar </button>
            </div>
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

    await createPost({
        user: CURRENT_USER,
        title: titleInput.value,
        content: contentInput.value,
        category: currentCategory
    });

    form.reset();
    loadPosts(currentCategory);
});

// --------------------
// Delete
// --------------------
window.removePost = async function(id) {
    if (!confirm("¿Borrar post?")) return;

    try {
        await removePost(id);
        loadPosts(currentCategory);
    } catch (e) {
        alert("Error eliminando el post");
        console.error(e);
    }
};

document.querySelectorAll('.subject-btn').forEach(btn =>{
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        loadPosts(category);
    });
});