function passwordField({
    id,
    name = 'password',
    placeholder = 'Contraseña',
    required = true
} = {}) {
    return `
        <div class="password-wrapper">
            <input
                id="${id}"
                name="${name}"
                type="password"
                placeholder="${placeholder}"
                autocomplete="current-password"
                ${required ? 'required' : ''}
            />

            <button
                type="button"
                class="toggle-password"
                onclick="togglePassword('${id}', this)"
                aria-label="Mostrar u ocultar contraseña"
            >
                <span class="icon-eye">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5
                               c4.478 0 8.268 2.943 9.542 7
                               -1.274 4.057-5.064 7-9.542 7
                               -4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                </span>

                <span class="icon-eye-slash hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M3 3l18 18"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M13.875 18.825A10.05 10.05 0 0112 19
                               c-4.478 0-8.268-2.943-9.543-7"/>
                    </svg>
                </span>
            </button>
        </div>
    `;
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const eye = button.querySelector('.icon-eye');
    const eyeSlash = button.querySelector('.icon-eye-slash');

    const isPassword = input.type === 'password';

    input.type = isPassword ? 'text' : 'password';

    eye.classList.toggle('hidden', isPassword);
    eyeSlash.classList.toggle('hidden', !isPassword);
}
