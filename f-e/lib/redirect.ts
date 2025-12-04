export function redirectTo(url: string) {
    // Single place to handle redirects so tests can mock this function.
    // In production this simply delegates to window.location.assign
    if (typeof window !== 'undefined' && window.location && typeof window.location.assign === 'function') {
        window.location.assign(url);
    } else {
        // Fallback for environments without window (shouldn't normally be used in client code)
        // eslint-disable-next-line no-console
        console.warn('redirectTo called in non-window environment:', url);
    }
}

export default redirectTo;
