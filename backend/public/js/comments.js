import { apiFetch } from './api.js';

export async function createComment (postId, data) {
    return apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function getComments(postId) {
    return apiFetch(`/posts/${postId}/comments`);
}

export async function updateComment(data) {
    return apiFetch(`/comments`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export async function removeComment(id) {
    return apiFetch(`/comments/${id}`, {
        method: 'DELETE'
    });
}