import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Printer, MessageCircle } from 'lucide-react';
import Pagination from '@/components/Pagination';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/dates';
import {
    normalizePhoneForWhatsApp,
    pickCustomerWhatsAppPhone,
    openWhatsAppWeb,
} from '@/lib/whatsappWeb';

/// Mirror the salutation logic used by Invoices/Quotations so the WhatsApp
/// greeting is consistent across documents the customer might receive.
function customerDisplayNameForWhatsApp(customer) {
    if (!customer) return 'there';
    if (String(customer?.type || '').toUpperCase() === 'CORPORATE' && customer.companyName?.trim()) {
        return customer.companyName.trim();
    }
    return customer?.name?.trim() || customer?.email?.split('@')[0] || 'there';
}

/// Compose the message body for the customer. Keeps the share URL on its own
/// line so WhatsApp auto-detects it as a clickable link (mirrors invoice/quotation messages).
function buildAgreementWhatsAppMessage(agreement, shareUrl) {
    const name = customerDisplayNameForWhatsApp(agreement?.customer);
    const agreementNo = agreement?.agreementNo || '';
    const contractNo = agreement?.contract?.contractNo || '-';
    const plate = agreement?.vehicle?.licensePlate || '';
    const model = [
        agreement?.vehicle?.vehicleModel?.brand?.name,
        agreement?.vehicle?.vehicleModel?.name,
    ].filter(Boolean).join(' ');
    const vehicleLine = [plate, model].filter(Boolean).join(' — ');
    return [
        `Hello ${name},`,
        '',
        `Your rental agreement *${agreementNo}* is ready (contract ${contractNo}).`,
        vehicleLine ? `Vehicle: ${vehicleLine}` : null,
        '',
        `View / sign: ${shareUrl}`,
        '',
        'Thank you.',
    ].filter((line) => line !== null).join('\n');
}

const Agreements = () => {
    const [agreements, setAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
    /// Track per-row "WhatsApp / share-link is loading" so we don't double-fire
    /// while the API call is in flight (and so the button can show a busy state).
    const [busyId, setBusyId] = useState(null);

    const loadAgreements = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/agreements?page=${page}&limit=20`);
            setAgreements(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            if (data.pagination) setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to load agreements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgreements();
    }, [page]);

    const filtered = useMemo(() => {
        const text = q.trim().toLowerCase();
        if (!text) return agreements;
        return agreements.filter((a) => {
            const hay = [
                a.agreementNo,
                a.contract?.contractNo,
                a.customer?.name,
                a.customer?.email,
                a.vehicle?.licensePlate,
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(text);
        });
    }, [agreements, q]);

    /// Open the customer-facing agreement HTML in a new tab — same URL we'd
    /// drop into the WhatsApp message, so what the user sees here is exactly
    /// what the customer will see.
    /// `mode === 'download'` appends `?download=1` (or `&download=1` if the
    /// share URL already has a query string), which the backend uses to
    /// inject a `window.print()` script so the print/save-as-PDF dialog
    /// opens automatically. Both URL shapes are supported because the
    /// backend may return either the new short `/api/a/<token>` form or
    /// (during fallback) the legacy `/api/agreements/share/<id>?token=…` form.
    const previewAgreement = async (agreementId, mode = 'view') => {
        if (!agreementId) return;
        try {
            setBusyId(agreementId);
            const { data } = await api.get(`/agreements/${agreementId}/share-link`);
            if (!data?.shareUrl) {
                alert('Could not load the preview link (empty response). Check that the API is running.');
                return;
            }
            const baseUrl = data.shareUrl;
            const separator = baseUrl.includes('?') ? '&' : '?';
            const url = mode === 'download'
                ? `${baseUrl}${separator}download=1`
                : baseUrl;
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Failed to open agreement:', error);
            alert(error.response?.data?.message || 'Failed to open agreement');
        } finally {
            setBusyId(null);
        }
    };

    /// Open WhatsApp Web with a prefilled message + share link for the
    /// customer on this agreement. Phone resolution mirrors invoices /
    /// quotations: prefer the customer record's mobile, fall back to phone.
    const sendAgreementWhatsApp = async (agreement) => {
        if (!agreement?.id) return;
        const rawPhone = pickCustomerWhatsAppPhone(agreement.customer);
        const phone = normalizePhoneForWhatsApp(rawPhone);
        if (!phone) {
            alert(
                'No mobile number on file for this customer. Add phone or mobile on the customer record, then try again.'
            );
            return;
        }
        try {
            setBusyId(agreement.id);
            const { data } = await api.get(`/agreements/${agreement.id}/share-link`);
            const shareUrl = data?.shareUrl;
            if (!shareUrl) {
                alert('Could not create agreement link. Try again.');
                return;
            }
            const message = buildAgreementWhatsAppMessage(agreement, shareUrl);
            openWhatsAppWeb(phone, message);
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || 'Failed to open WhatsApp');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">AGREEMENTS</h1>
                    <p className="text-muted-foreground">
                        Generated rental agreements for contracts. Click any row to preview the customer-facing copy.
                    </p>
                </div>
                <Button variant="outline" onClick={loadAgreements}>
                    Refresh
                </Button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search agreement, contract, customer, plate..."
                    className="pl-9"
                />
            </div>

            <div className="bg-card rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agreement No</TableHead>
                            <TableHead>Contract No</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6}>Loading agreements...</TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={6}>No agreements found.</TableCell></TableRow>
                        ) : (
                            filtered.map((a) => (
                                <TableRow
                                    key={a.id}
                                    onClick={() => previewAgreement(a.id, 'view')}
                                    className="cursor-pointer hover:bg-secondary/50"
                                    title="Click to preview the customer-facing agreement (same as the WhatsApp share link)"
                                >
                                    <TableCell className="font-bold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        {a.agreementNo}
                                    </TableCell>
                                    <TableCell>{a.contract?.contractNo || '-'}</TableCell>
                                    <TableCell>{a.customer?.name || a.customer?.email || '-'}</TableCell>
                                    <TableCell>
                                        {a.vehicle?.licensePlate || '-'}{' '}
                                        <span className="text-xs text-muted-foreground">
                                            {a.vehicle?.vehicleModel?.brand?.name} {a.vehicle?.vehicleModel?.name}
                                        </span>
                                    </TableCell>
                                    <TableCell>{formatDateTime(a.createdAt, '-')}</TableCell>
                                    <TableCell className="text-right">
                                        {/* Each action stops row-click propagation so it doesn't
                                            also fire the row's preview handler. */}
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                sendAgreementWhatsApp(a);
                                            }}
                                            disabled={busyId === a.id}
                                            title="Send agreement to customer via WhatsApp Web"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Web
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                previewAgreement(a.id, 'download');
                                            }}
                                            disabled={busyId === a.id}
                                            title="Open the agreement and trigger the print dialog"
                                        >
                                            <Printer className="w-4 h-4 mr-2" /> Print
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                previewAgreement(a.id, 'download');
                                            }}
                                            disabled={busyId === a.id}
                                            title="Open agreement and trigger print/save dialog for PDF"
                                        >
                                            Download PDF
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <Pagination
                    pagination={pagination}
                    onPageChange={(p) => setPage(p)}
                />
            </div>
        </div>
    );
};

export default Agreements;
