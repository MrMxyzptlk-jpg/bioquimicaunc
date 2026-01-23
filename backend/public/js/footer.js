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
            <p class="footer-copy"> &copy; 2026 <strong>Jerónimo A.P.</strong> </p>
        </footer>
    `;

    document.body.insertAdjacentHTML('beforeend', footerHTML);

    let csrfToken = null;

    document.body.addEventListener('htmx:configRequest', async (event) => {
        if (!csrfToken) {
            const res = await fetch('/csrf');
            csrfToken = await res.text();
        }

        event.detail.headers['X-CSRF-Token'] = csrfToken;
    });
}

