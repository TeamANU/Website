// Disables ALL blue highlighting when interacting with elements (in case the CSS fails to do so).

document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection) {
        const range = selection.rangeCount ? selection.getRangeAt(0) : null;
        if (range) {
            const span = document.createElement('span');
            span.style.background = 'transparent';
            range.surroundContents(span);
            selection.removeAllRanges();
        }
    }
});

document.querySelectorAll('*').forEach(el => {
    el.addEventListener('focus', e => e.target.style.outline = 'none');
});

document.querySelectorAll('*').forEach(el => {
    el.style.webkitTapHighlightColor = 'transparent';
});