import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Database, Download, AlertCircle } from 'lucide-react';
import { downloadDatabaseBackupZip, parseErrorMessage } from '../lib/databaseBackupDownload';

const DatabaseBackupWizard = ({ open, onOpenChange }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');

    const reset = () => {
        setLoading(false);
        setError(null);
        setPassword('');
    };

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
            setTimeout(reset, 300);
        }
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        if (!password) {
            setError('Administrator password is required.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await downloadDatabaseBackupZip(password);
            handleClose();
        } catch (err) {
            console.error('Database backup error:', err);
            setError(await parseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2rem] border-border bg-card shadow-2xl p-0 font-calibri">
                <DialogHeader className="p-10 pb-4 text-center">
                    <div className="mx-auto p-4 bg-primary/10 rounded-2xl border border-primary/10 w-fit mb-4">
                        <Database className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground font-calibri-bold">
                        Download Database Backup
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground font-calibri text-base mt-2">
                        Enter your administrator password to download a ZIP file containing a PostgreSQL SQL dump.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleDownload} className="px-10 pb-10 space-y-6">
                    <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50 text-sm text-muted-foreground leading-relaxed">
                        The archive includes the SQL dump and a README with restore notes. Store this file securely; it contains all business data.
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            Administrator Password
                        </Label>
                        <input
                            type="password"
                            placeholder="••••••••••••"
                            className="flex h-14 w-full rounded-2xl border border-border bg-background px-5 py-2 text-base font-bold text-foreground focus:ring-8 focus:ring-primary/5 transition-all outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/10 rounded-2xl flex gap-3 items-center">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <p className="text-sm font-bold text-rose-700 font-calibri">{error}</p>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-2xl h-12 font-black text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !password}
                            className="rounded-2xl h-12 bg-primary hover:bg-primary/95 font-black text-xs uppercase tracking-widest flex-1 gap-2"
                        >
                            {loading ? (
                                'Preparing backup…'
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download ZIP Backup
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DatabaseBackupWizard;
