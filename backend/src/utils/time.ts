export function timeAgo(date: Date | string) {
    const now = new Date();
    const past = new Date(date);
    const miliSec = now.getTime() - past.getTime();

    const minutes = Math.floor(miliSec / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(weeks / 4);
    const years = Math.floor(months / 12);

    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    if (minutes < 1) return 'justo ahora';
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    if (hours < 24) return rtf.format(-hours, 'hour');
    if (days < 7) return rtf.format(-days, 'day');
    if (weeks < 4) return rtf.format(-weeks, 'week');
    if (months < 12) return rtf.format(-months, 'month');

    return rtf.format(-years, 'year');

}