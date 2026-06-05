import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCw, Save, Hash, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const SequenceCard = ({ seq, syncingKey, onEdit }) => (
    <div className="p-6 rounded-[2rem] bg-secondary/20 border border-border/50 flex items-center justify-between hover:bg-secondary/30 transition-all group">
        <div className="min-w-0 pr-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 group-hover:text-primary transition-colors">
                {seq.label}
                {seq.period && (
                    <span className="ml-2 text-primary/70">{seq.period}</span>
                )}
                {seq.isCurrentMonth && (
                    <span className="ml-2 text-emerald-600/80">· current month</span>
                )}
            </p>
            <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums font-calibri-bold">{seq.value}</p>
            {seq.format && (
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 font-calibri">{seq.format}</p>
            )}
            {seq.suggestedValue != null && seq.suggestedValue !== seq.value && (
                <p className="text-[10px] font-bold text-amber-700/80 mt-1 font-calibri">
                    Highest in DB: {seq.suggestedValue}
                </p>
            )}
        </div>
        <div className="flex gap-2 shrink-0">
            {seq.suggestedValue != null && (
                <Button
                    onClick={() => onEdit(seq, { forSync: true })}
                    disabled={syncingKey === seq.key}
                    title="Sync counter from existing records"
                    className="h-12 w-12 rounded-xl bg-card border border-border shadow-sm hover:bg-amber-500 hover:text-white transition-all p-0"
                >
                    <RotateCcw className={`w-5 h-5 ${syncingKey === seq.key ? 'animate-spin' : ''}`} />
                </Button>
            )}
            <Button
                onClick={() => onEdit(seq)}
                className="h-12 w-12 rounded-xl bg-card border border-border shadow-sm hover:bg-primary hover:text-white transition-all p-0"
            >
                <Save className="w-5 h-5" />
            </Button>
        </div>
    </div>
);

const SequenceManager = () => {
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSeq, setEditingSeq] = useState(null);
    const [newValue, setNewValue] = useState('');
    const [password, setPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [syncingKey, setSyncingKey] = useState(null);

    const { coreSequences, monthlySequences } = useMemo(() => ({
        coreSequences: sequences.filter((s) => s.category === 'core'),
        monthlySequences: sequences.filter((s) => s.category === 'monthly'),
    }), [sequences]);

    useEffect(() => {
        fetchSequences();
    }, []);

    const fetchSequences = async () => {
        try {
            setLoading(true);
            setFetchError(null);
            const response = await api.get('/system/sequences');
            setSequences(response.data || []);
        } catch (err) {
            console.error('Failed to fetch sequences:', err);
            setFetchError(err.response?.data?.message || 'Failed to load sequences');
            setSequences([]);
        } finally {
            setLoading(false);
        }
    };

    const displayLabel = (seq) => seq.label || seq.key;

    const handleEdit = (seq, { forSync = false } = {}) => {
        setEditingSeq(seq);
        setNewValue(forSync ? (seq.suggestedValue ?? seq.value) : seq.value);
        setPassword('');
        setError(forSync ? 'Enter your password and click Sync from records, or set a value manually.' : null);
    };

    const handleUpdate = async () => {
        if (!password) {
            setError('Account password is required to change sequences.');
            return;
        }
        setUpdating(true);
        setError(null);
        try {
            await api.put('/system/sequences', {
                key: editingSeq.key,
                value: newValue,
                password
            });
            setEditingSeq(null);
            fetchSequences();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update sequence');
        } finally {
            setUpdating(false);
        }
    };

    const handleSync = async (seq) => {
        if (!password) {
            setEditingSeq(seq);
            setNewValue(seq.suggestedValue ?? seq.value);
            setError('Enter your password, then click Sync from records.');
            return;
        }
        setSyncingKey(seq.key);
        setError(null);
        try {
            await api.post('/system/sequences/sync', {
                key: seq.key,
                password,
            });
            setEditingSeq(null);
            setPassword('');
            fetchSequences();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sync sequence');
            setEditingSeq(seq);
            setNewValue(seq.suggestedValue ?? seq.value);
        } finally {
            setSyncingKey(null);
        }
    };

    return (
        <Card className="bg-card border-border shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/10">
                            <Hash className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black uppercase tracking-tighter text-foreground font-calibri-bold">Sequence Engine</CardTitle>
                            <CardDescription className="font-medium text-muted-foreground font-calibri">Manual override for document numbering sequences</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchSequences} disabled={loading} className="rounded-xl">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-10 pt-4 space-y-8">
                {fetchError && !loading && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/10 rounded-2xl flex gap-3 items-center">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <p className="text-sm font-bold text-rose-700 font-calibri">{fetchError}</p>
                    </div>
                )}
                {loading ? (
                    <div className="py-20 text-center space-y-4">
                        <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary/20" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Querying registry...</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Core sequences</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {coreSequences.map((seq) => (
                                    <SequenceCard
                                        key={seq.key}
                                        seq={seq}
                                        syncingKey={syncingKey}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>
                        </div>

                        {monthlySequences.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Monthly sequences</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {monthlySequences.map((seq) => (
                                        <SequenceCard
                                            key={seq.key}
                                            seq={seq}
                                            syncingKey={syncingKey}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground/70 font-calibri leading-relaxed">
                            Registry value is the last number used. The next document will be that value + 1.
                            Monthly sequences reset per calendar month (contract, quotation, advance receipt, RAR).
                        </p>
                    </>
                )}

                <Dialog open={!!editingSeq} onOpenChange={() => !updating && setEditingSeq(null)}>
                    <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-border bg-card shadow-2xl p-8 font-calibri">
                        <DialogHeader>
                            <div className="p-4 w-fit bg-primary/10 rounded-2xl border border-primary/10 mb-4">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter font-calibri-bold">Modify Sequence</DialogTitle>
                            <DialogDescription className="text-sm font-bold opacity-70">
                                {editingSeq && displayLabel(editingSeq)}
                                {editingSeq?.period && ` (${editingSeq.period})`}
                                {' — '}registry value is the last number used. The next document will be that value + 1.
                                {editingSeq?.suggestedValue != null && (
                                    <> Highest existing number in database: <strong>{editingSeq.suggestedValue}</strong>.</>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Current Registry Value</Label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full h-14 bg-secondary/30 border border-border rounded-2xl px-6 text-xl font-black text-foreground focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Administrator Password</Label>
                                <input
                                    type="password"
                                    className="w-full h-14 bg-secondary/30 border border-border rounded-2xl px-6 text-base font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/10 rounded-xl flex gap-3 items-center">
                                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                    <p className="text-xs font-bold text-rose-700 font-calibri">{error}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex flex-col gap-3 sm:flex-col">
                            {editingSeq?.suggestedValue != null && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSync(editingSeq)}
                                    disabled={updating || syncingKey === editingSeq.key || !password}
                                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-amber-500/30 text-amber-800 hover:bg-amber-500/10"
                                >
                                    {syncingKey === editingSeq.key ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Sync from records ({editingSeq.suggestedValue})
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                onClick={handleUpdate}
                                disabled={updating || syncingKey}
                                className="w-full h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all flex justify-center items-center gap-2"
                            >
                                {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Registry Update'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default SequenceManager;
