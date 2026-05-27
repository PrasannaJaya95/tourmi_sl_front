/**
 * Print HTML via a hidden iframe (no pop-up window — works with browser pop-up blockers).
 */
export async function printHtmlDocument(fetchHtml) {
    const html = await fetchHtml();
    if (!html || !String(html).trim()) {
        throw new Error('Could not load document for printing.');
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Print document');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    if (!win?.document) {
        iframe.remove();
        throw new Error('Could not open print preview.');
    }

    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    return new Promise((resolve, reject) => {
        let done = false;

        const cleanup = () => {
            setTimeout(() => {
                if (iframe.parentNode) iframe.remove();
            }, 1500);
        };

        const triggerPrint = () => {
            if (done) return;
            done = true;
            try {
                win.focus();
                win.print();
                cleanup();
                resolve(true);
            } catch (err) {
                cleanup();
                reject(err);
            }
        };

        iframe.onload = () => setTimeout(triggerPrint, 300);
        setTimeout(triggerPrint, 1200);
    });
}
