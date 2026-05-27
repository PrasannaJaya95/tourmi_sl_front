import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Database, Download, AlertCircle, ShieldCheck } from 'lucide-react';
import { downloadDatabaseBackupZip, parseErrorMessage } from '../lib/databaseBackupDownload';
import { isAdminOrSuperAdmin } from '../lib/roles';

const SystemBackup = () => {
    const { user } = useAuth();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    if (user && !isAdminOrSuperAdmin(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleDownload = async (e) => {
        e.preventDefault();
        if (!password) {
            setError('Administrator password is required.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const filename = await downloadDatabaseBackupZip(password);
            setSuccess(`Backup downloaded: ${filename}`);
            setPassword('');
        } catch (err) {
            console.error('Database backup error:', err);
            setError(await parseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-20 max-w-3xl">
            <div>
                <h2 className="text-5xl font-black text-foreground tracking-tighter mb-2 text-primary uppercase font-calibri-bold">
                    System Backup
                </h2>
                <p className="text-muted-foreground font-medium text-lg opacity-70 font-calibri">
                    Download a ZIP archive of your PostgreSQL database. Admin or super admin password required.
                </p>
            </div>

            <Card className="bg-card border-border shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden border-primary/20">
                <CardHeader className="p-10 pb-4">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/10">
                            <Database className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black uppercase tracking-tighter text-foreground font-calibri-bold">
                                Database Backup
                            </CardTitle>
                            <CardDescription className="font-medium text-muted-foreground font-calibri">
                                SQL dump packaged as a ZIP file
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 pt-4 space-y-8">
                    <div className="p-8 rounded-[2rem] bg-secondary/20 border border-border/50 space-y-3">
                        <p className="text-sm font-bold text-muted-foreground leading-relaxed font-calibri flex items-start gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            Enter the password of any admin or super admin account. The file contains all business data — store it securely.
                        </p>
                        <p className="text-xs text-muted-foreground/80 font-calibri">
                            Includes the SQL dump and a README with restore notes.
                        </p>
                    </div>

                    <form onSubmit={handleDownload} className="space-y-6">
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

                        {success && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/10 rounded-2xl">
                                <p className="text-sm font-bold text-emerald-800 font-calibri">{success}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full h-16 bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 font-calibri-bold"
                        >
                            {loading ? (
                                'Preparing backup…'
                            ) : (
                                <>
                                    <Download className="h-5 w-5" />
                                    Download ZIP Backup
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemBackup;
