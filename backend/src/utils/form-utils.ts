export function renderCheckboxGroup<T extends Record<string, string>>(
    name: string,
    enumObj: T,
    selected: string[] = [],
) {
    return Object.entries(enumObj)
        .map(([key, label]) => {
            const checked = selected.includes(key) ? 'checked' : '';
            return `
                <label class="checkbox-item">
                    <input type="checkbox"
                           name="${name}"
                           value="${key}"
                           ${checked}>
                    ${label}
                </label>
            `;
        })
        .join('');
}
