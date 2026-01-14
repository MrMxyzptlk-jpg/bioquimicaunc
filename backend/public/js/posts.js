import { apiFetch } from './api.js';

export async function createPost(data) {
    return apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function getPosts(category) {
    return apiFetch(`/posts?category=${category}`);
}

export async function updatePost(id, data) {
    return apiFetch(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export async function removePost(id) {
    return apiFetch(`/posts/${id}`, {
        method: 'DELETE'
    });
}