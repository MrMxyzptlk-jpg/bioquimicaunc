export function renderCheckboxGroup<T extends Record<string, string>>(
    name: string,
    enumObj: T,
    selected: string[] = [],
) {
    return Object.entries(enumObj)
        .map(([key, label]) => {
            // Ensure we compare Values to Values
            const checked = selected.includes(label) ? 'checked' : '';

            return `
                <label class="checkbox-item">
                    <input
                        type="checkbox"
                        name="${name}[]"
                        value="${label}"
                        ${checked}
                    >
                    ${label}
                </label>
            `;
        })
        .join('');
}