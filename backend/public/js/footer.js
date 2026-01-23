function loadFooter() {
    if (!window.htmx) {
        console.warn("HTMX not loaded - CSRF protection inactive");
        return;
    }

    const footerHTML = `
        <div id="flash-errors"></div>
        <div id="global-loader" class=" htmx-indicator">
            <div class="crow-loader"></div>
        </div>
        <footer class="site-footer">
            <p class="footer-quote">
                La educación no es algo que se imparte, sino que se comparte
            </p>
        </footer>
    `;

    document.body.insertAdjacentHTML('beforeend', footerHTML);

    let globalCsrfToken = null;

    fetch('/csrf', { credentials: 'same-origin' }) // Important for cookies!
        .then(res => res.text())
        .then(token => { globalCsrfToken = token; })
        .catch(err => console.error("Failed to load CSRF token:", err));

    // Attach token to HTMX requests
    document.body.addEventListener('htmx:configRequest', (event) => {
        if (globalCsrfToken) {
            event.detail.headers['X-CSRF-Token'] = globalCsrfToken;
        }
    });
}

