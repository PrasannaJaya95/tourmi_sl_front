import api from './api';

async function parseErrorMessage(err) {
    const data = err.response?.data;
    if (data instanceof Blob) {
        try {
            const text = await data.text();
            const parsed = JSON.parse(text);
            return parsed.message || 'Failed to create database backup';
        } catch {
            return 'Failed to create database backup';
        }
    }
    return data?.message || err.message || 'Failed to create database backup';
}

export async function downloadDatabaseBackupZip(password) {
    const res = await api.post(
        '/system/backup-database',
        { password },
        { responseType: 'blob', timeout: 300000 }
    );

    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] || `rentix-backup-${new Date().toISOString().slice(0, 10)}.zip`;

    const blob = new Blob([res.data], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    return filename;
}

export { parseErrorMessage };
