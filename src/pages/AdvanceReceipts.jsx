import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { formatDate, formatDateTime } from '@/lib/dates';
import { Receipt, MessageCircle, Printer, FileText, Undo2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { printHtmlDocument } from '@/lib/printHtmlDocument';
import Pagination from '../components/Pagination';
import useDebounce from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    normalizePhoneForWhatsApp,
    pickCustomerWhatsAppPhone,
    openWhatsAppWeb,
} from '@/lib/whatsappWeb';

function customerDisplayNameForWhatsApp(customer) {
    if (!customer) return 'there';
    if (String(customer.type || '').toUpperCase() === 'CORPORATE' && customer.companyName?.trim()) {
        return customer.companyName.trim();
    }
    return customer.name?.trim() || customer.email?.split('@')[0] || 'there';
}

function buildAdvanceReceiptWhatsAppMessage(receipt, shareUrl) {
    const name = customerDisplayNameForWhatsApp(receipt.contract?.customer);
    const no = receipt.receiptNo || '';
    const contract = receipt.contract?.contractNo || '-';
    const amount = Number(receipt.amount ?? 0);
    return [
        `Hello ${name},`,
        '',
        `Your advance payment receipt *${no}* is ready (contract ${contract}).`,
        `Amount received (LKR): *${amount.toLocaleString()}*`,
        '',
        `View or print: ${shareUrl}`,
        '',
        'Thank you.',
    ].join('\n');
}

function receiptStatusLabel(r) {
    if (r.reversedAt) {
        return r.advanceReversal?.rarNo ? `Reversed (${r.advanceReversal.rarNo})` : 'Reversed';
    }
    if (r.ledgerPostedAt) return 'Posted (P&L)';
    return 'Legacy';
}

const AdvanceReceipts = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [iframeDoc, setIframeDoc] = useState('');
    const [savedReceiptHtml, setSavedReceiptHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [whatsappSending, setWhatsappSending] = useState(false);
    const [reversalReason, setReversalReason] = useState('');
    const [reversalWorking, setReversalWorking] = useState(false);
    const [docMode, setDocMode] = useState('receipt'); // receipt | rarPreview | rarIssued

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/advance-receipts?page=${page}&limit=20&search=${debouncedSearch}`);
            setRows(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            if (data.pagination) setPagination(data.pagination);
        } catch (e) {
            console.error(e);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        load();
    }, [load]);

    const openDetail = async (receipt) => {
        setSelected(receipt);
        setDetailOpen(true);
        setIframeDoc('');
        setSavedReceiptHtml('');
        setDocMode('receipt');
        setReversalReason('');
        setPreviewLoading(true);
        try {
            const res = await api.get(`/advance-receipts/${receipt.id}/html`, { responseType: 'text' });
            const html = typeof res.data === 'string' ? res.data : '';
            setSavedReceiptHtml(html);
            setIframeDoc(html);
        } catch (e) {
            console.error(e);
            setIframeDoc('<p>Failed to load receipt preview.</p>');
        } finally {
            setPreviewLoading(false);
        }
    };

    const backToReceipt = () => {
        setIframeDoc(savedReceiptHtml);
        setDocMode('receipt');
    };

    const loadReversalPreview = async () => {
        if (!selected?.id) return;
        setPreviewLoading(true);
        try {
            const res = await api.get(`/advance-receipts/${selected.id}/reversal-preview/html`, {
                responseType: 'text',
            });
            setIframeDoc(typeof res.data === 'string' ? res.data : '');
            setDocMode('rarPreview');
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || e.message || 'Could not load reversal preview.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const confirmReversal = async () => {
        if (!selected?.id) return;
        setReversalWorking(true);
        try {
            const { data } = await api.post(`/advance-receipts/${selected.id}/reverse`, {
                reason: reversalReason.trim() || undefined,
            });
            const reversalId = data?.reversal?.id;
            if (reversalId) {
                const res = await api.get(`/advance-receipts/reversal/${reversalId}/html`, {
                    responseType: 'text',
                });
                setIframeDoc(typeof res.data === 'string' ? res.data : '');
                setDocMode('rarIssued');
            }
            if (data?.receipt) setSelected(data.receipt);
            await load();
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || e.message || 'Reversal failed.');
        } finally {
            setReversalWorking(false);
        }
    };

    const printReceipt = async () => {
        if (!selected?.id) return;
        try {
            await printHtmlDocument(async () => {
                const res = await api.get(`/advance-receipts/${selected.id}/html`, {
                    responseType: 'text',
                    headers: { Accept: 'text/html' },
                });
                return typeof res.data === 'string' ? res.data : iframeDoc || '';
            });
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || e.message || 'Could not print receipt.');
        }
    };

    const sendWhatsApp = async () => {
        if (!selected?.id) return;
        const rawPhone = pickCustomerWhatsAppPhone(selected.contract?.customer);
        const phone = normalizePhoneForWhatsApp(rawPhone);
        if (!phone) {
            alert(
                'No mobile number on file for this customer. Add phone or mobile on the customer record, then try again.'
            );
            return;
        }
        try {
            setWhatsappSending(true);
            const { data } = await api.get(`/advance-receipts/${selected.id}/share-link`);
            const shareUrl = data?.shareUrl;
            if (!shareUrl) {
                alert('Could not create share link.');
                return;
            }
            const message = buildAdvanceReceiptWhatsAppMessage(selected, shareUrl);
            openWhatsAppWeb(phone, message);
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || 'Failed to open WhatsApp');
        } finally {
            setWhatsappSending(false);
        }
    };

    const canReverse =
        selected?.ledgerPostedAt &&
        !selected?.reversedAt &&
        Array.isArray(selected?.linkedPayments) &&
        selected.linkedPayments.length > 0 &&
        selected.linkedPayments[0]?.id;

    const handleDetailOpenChange = (open) => {
        setDetailOpen(open);
        if (!open) {
            setSelected(null);
            setIframeDoc('');
            setSavedReceiptHtml('');
            setDocMode('receipt');
            setReversalReason('');
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                            <Receipt className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Advance receipts</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Creating a receipt posts the advance to the Proforma Invoice and P&amp;L. Use reversal
                                (RAR) to undo posting.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-end gap-2 w-full md:w-auto">
                    <div className="space-y-1.5 flex-1 md:w-80">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Search Receipts</Label>
                        <Input 
                            placeholder="Receipt #, Customer..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="h-10 bg-white/50 dark:bg-slate-800/50 border-border/50 rounded-xl text-xs font-bold"
                        />
                    </div>
                    <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={() => load()}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-card/40 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Receipt no</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Contract no</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Customer</TableHead>
                            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest">Amount (LKR)</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Payment date</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Issued</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    No advance receipts yet. Open a contract with an advance and use{' '}
                                    <strong>Create Advance Receipt</strong> (upcoming) or <strong>Issue advance receipt</strong>.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => (
                                <TableRow
                                    key={r.id}
                                    className="cursor-pointer hover:bg-primary/[0.04]"
                                    onClick={() => openDetail(r)}
                                >
                                    <TableCell className="font-mono font-bold">{r.receiptNo}</TableCell>
                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                        {r.contract?.contractNo || '—'}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {r.contract?.customer?.name || r.contract?.customer?.email || '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono tabular-nums font-black">
                                        {Number(r.amount || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(r.paymentDate)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDateTime(r.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-xs font-bold">
                                        <span
                                            className={
                                                r.reversedAt
                                                    ? 'text-blue-700'
                                                    : r.ledgerPostedAt
                                                      ? 'text-emerald-700'
                                                      : 'text-muted-foreground'
                                            }
                                        >
                                            {receiptStatusLabel(r)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <div className="p-4 border-t border-border">
                    <Pagination
                        pagination={pagination}
                        onPageChange={(p) => setPage(p)}
                    />
                </div>
            </div>

            <Dialog open={detailOpen} onOpenChange={handleDetailOpenChange}>
                <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            {selected?.receiptNo || 'Receipt'}
                        </DialogTitle>
                        <DialogDescription>
                            {selected?.contract?.contractNo
                                ? `Contract ${selected.contract.contractNo} · ${receiptStatusLabel(selected)}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {docMode === 'rarPreview' && (
                        <div className="space-y-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                            <p className="text-xs font-bold text-blue-800">
                                Preview only — confirming issues an RAR and removes this payment from P&amp;L.
                            </p>
                            <Textarea
                                placeholder="Optional reason for reversal (shown on RAR)"
                                value={reversalReason}
                                onChange={(e) => setReversalReason(e.target.value)}
                                className="min-h-[72px] text-sm"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-muted/20">
                        {previewLoading ? (
                            <div className="p-12 text-center text-muted-foreground">Loading preview…</div>
                        ) : iframeDoc ? (
                            <iframe
                                title="Document preview"
                                className="w-full h-[70vh] bg-white border-0"
                                srcDoc={iframeDoc}
                            />
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">No preview</div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 flex-wrap sm:justify-end">
                        {docMode !== 'receipt' && (
                            <Button type="button" variant="outline" onClick={backToReceipt}>
                                Back to receipt
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => handleDetailOpenChange(false)}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700"
                            onClick={sendWhatsApp}
                            disabled={!selected || whatsappSending || previewLoading}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp Web
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={printReceipt}
                            disabled={!iframeDoc || previewLoading}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print / PDF
                        </Button>
                        {canReverse && docMode === 'receipt' && (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-primary/40 font-bold"
                                onClick={loadReversalPreview}
                                disabled={previewLoading}
                            >
                                <Undo2 className="w-4 h-4 mr-2" />
                                Preview reversal credit note
                            </Button>
                        )}
                        {docMode === 'rarPreview' && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmReversal}
                                disabled={reversalWorking || previewLoading}
                            >
                                Confirm reversal (issue RAR)
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdvanceReceipts;
