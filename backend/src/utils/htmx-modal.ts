export function renderHtmxModal(message: string, imageSrc?: string) {
    return `
        <div id="flash-errors" hx-swap-oob="true">
            <div class="modal-overlay"
                 style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                        background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
                        display: flex; justify-content: center; align-items: center;
                        z-index: 9999;">

                <div class="modal-content"
                     style="background: #fefefc; padding: 25px; border-radius: 12px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                            max-width: 350px; text-align: center; position: relative;
                            animation: popIn 0.3s ease;">

                    <button onclick="document.getElementById('flash-errors').innerHTML = ''"
                            style="position: absolute; top: 10px; right: 15px;
                                   background: none; border: none; font-size: 1.5rem;
                                   cursor: pointer; color: #666;">
                        &times;
                    </button>

                    ${
                        imageSrc
                            ? `<img src="${imageSrc}" alt="ALERTA" style="max-width: 300px; width: auto">`
                            : ''
                    }

                    <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                        ${message}
                    </p>

                    <button onclick="document.getElementById('flash-errors').innerHTML = ''"
                            style="background: #333; color: white; border: none;
                                   padding: 10px 20px; border-radius: 6px;
                                   cursor: pointer; font-weight: bold;">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    `;
}
