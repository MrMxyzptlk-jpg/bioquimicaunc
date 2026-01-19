function loadHeader(pageTitle) {
    if (!window.htmx) console.warn("HTMX not loaded - auth header will not render");

    const headerHTML = `
        <header class="site-header menu-closed">

            <div class="menu-logo" id="menuToggle">
                <img src="/assets/logo.jpeg" alt="Bioquímica UNC">
            </div>
            <nav class="menu-panel">
                <a href="/index.html"> Inicio </a><br>
                <a href="/intro.html"> Introducción </a><br>
                <a href="/foro.html"> Foro </a><br>
                <a href="/anuncios.html"> Anunciate! </a><br>
                <a href="/recursos.html"> Recursos </a><br>
                <a href="/developing.html"> Derechos </a><br>
            </nav>
            <h1 class="header-quote"> ${pageTitle} </h1>

            <div
                id="auth-header"
                hx-get="/auth/header"
                hx-trigger="load"
                hx-swap="outerHTML"
            ></div>

        </header>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    const header = document.querySelector('.site-header');
    const menuToggle = document.getElementById('menuToggle');

    if (header && menuToggle) {
        menuToggle.addEventListener('click', () => {
            header.classList.toggle('menu-open');
        });
    }
}

