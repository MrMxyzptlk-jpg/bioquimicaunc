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
// Set Up Comments
// --------------------
async function setupComments(postDiv, postId) {
    const toggleBtn = postDiv.querySelector('.comment-toggle');
    const commentsDiv = postDiv.querySelector('.comments');
    const form = postDiv.querySelector('.comment-form');
    const textarea = form.querySelector('textarea');

    let loaded = false;

    toggleBtn.addEventListener('click', async () => {
        if (!loaded) {
            const comments = await getComments(postId);
            renderComments(commentsDiv, comments);
            loaded = true;
        }

        commentsDiv.classList.toggle('hidden');
        form.classList.toggle('hidden');

        toggleBtn.textContent =
            commentsDiv.classList.contains('hidden')
                ? 'Mostrar comentarios'
                : 'Ocultar comentarios';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!textarea.value.trim()) return;

        const comment = await createComment(postId, {
            user: CURRENT_USER,
            content:textarea.value
        });

    appendComment(commentsDiv, comment);
    textarea.value = '';
    });
}

function setupCommentActions(commentDiv, comment) {
    const editBtn = commentDiv.querySelector('.comment-edit');
    const deleteBtn = commentDiv.querySelector('.comment-delete');
    const contentSpan = commentDiv.querySelector('.comment-content');

    //Edit
    if (editBtn) {
        editBtn.addEventListener('click', async () => {
            const newContent = prompt('Editar comentario:', comment.content);
            if (!newContent || newContent === comment.content) return;

            const update = await updateContent(comment.id, { content: newContent });
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar comentario?')) return;

            await removeComment(comment.id);

            contentSpan.textContent = '[deleted]';
            editBtn?.remove();
            deleteBtn?.remove();
        });
    }
}

// --------------------
// Render posts/comments HTML
// --------------------
function renderPosts(posts) {
    postsContainer.innerHTML = '';

    if (posts.length === 0) {
        postsContainer.innerHTML = `<p class="alert"> No hay publicaciones en ${currentCategory}. ¡Sé el primero! </p>`;
        return;
    }

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';

        postDiv.innerHTML = `
            <h2>${post.title}</h2>
            <small>
                Por: ${post.user} |
                Fecha ${new Date(post.createdAt).toLocaleDateString()}
            </small>
            <p> ${post.content} </p>

            <div class="post-actions">
                <button onclick="commentPost(${post.id})"> Editar </button>
                <button onclick="removePost(${post.id})"> Eliminar </button>
                <button class="comment-toggle"> Mostrar comentarios </button>
            </div>

            <div class="comments hidden"></div>

            <button id="comment-btn"> Comentar </button>
            <form class="comment-form hidden">
                <textarea rows="2" placeholder="Escribe un comentario..."></textarea>
                <button type="submit"> Enviar </button>
            </form>
        `;

        setupComments(postDiv, post.id);
        postsContainer.appendChild(postDiv);
    });
}

async function renderComments(container, comments) {
    container.innerHTML = '';

    if (comments.length === 0) {
        container.innerHTML = '<p class="muted"> No hay comentarios. </p>';
        return;
    }

    comments.forEach(comment => appendComment(container, comment));
}

function appendComment(container, comment) {
    const div = document.createElement('div');
    div.className = 'comment';

    const isOwner = comment.user === CURRENT_USER;

    div.innerHTML = `
        <span class="comment-user">${comment.user}</span>:
        <span class="comment-content">
            ${comment.deleted ? '[deleted]' : comment.content}
        </span>

        ${isOwner && !comment.deleted ? `
            <button class="comment-edit"> Editar </button>
            <button class="comment-delete"> Eliminar </button>`
        : ''}
    `;


    setupCommentActions(div, comment);
    container.appendChild(div);
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