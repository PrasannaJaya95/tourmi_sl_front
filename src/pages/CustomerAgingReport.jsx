import { useState, useEffect, useMemo } from 'react';
import api, { resolveServerUrl } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatDate } from '@/lib/dates';
import { Download, FileText, Clock } from 'lucide-react';

function formatMoney(n) {
    const x = Number(n) || 0;
    return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomerAgingReport() {
    const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [customerId, setCustomerId] = useState('all');
    const [customers, setCustomers] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyLogo, setCompanyLogo] = useState(null);

    useEffect(() => {
        const loadCustomers = async () => {
            try {
                const { data } = await api.get('/clients?limit=1000');
                setCustomers(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            } catch (e) {
                console.error('Failed to load customers', e);
            }
        };
        loadCustomers();
    }, []);

    useEffect(() => {
        const fetchCompanyProfile = async () => {
            try {
                const [nameRes, addressRes, logoRes] = await Promise.all([
                    api.get('/settings/company_name'),
                    api.get('/settings/company_address'),
                    api.get('/settings/company_logo'),
                ]);
                setCompanyName(nameRes.data.value !== 'false' ? (nameRes.data.value || '') : '');
                setCompanyAddress(addressRes.data.value !== 'false' ? (addressRes.data.value || '') : '');
                const rawLogo = logoRes.data.value !== 'false' ? (logoRes.data.value || null) : null;
                setCompanyLogo(rawLogo ? resolveServerUrl(rawLogo) : null);
            } catch (e) {
                console.error('Failed to fetch company profile', e);
            }
        };
        fetchCompanyProfile();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ asOfDate });
            if (customerId && customerId !== 'all') params.set('customerId', customerId);
            const { data } = await api.get(`/reports/customer-aging?${params.toString()}`);
            setReportData(data);
        } catch (e) {
            console.error('Customer aging report failed', e);
            setReportData(null);
            setError(e?.response?.data?.message || e?.message || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const bucketLabels = useMemo(() => reportData?.buckets?.map((b) => b.label) || [], [reportData]);

    const downloadCsv = () => {
        if (!reportData?.lines?.length) return;
        const headers = [
            'Customer',
            'Code',
            'Invoice',
            'Type',
            'Currency',
            'Issue date',
            'Age (days)',
            'Contract',
            'Vehicle',
            ...bucketLabels,
            'Line total',
        ];
        const esc = (v) => {
            const s = v == null ? '' : String(v);
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        const rows = reportData.lines.map((r) =>
            [
                r.customerName,
                r.customerCode,
                r.invoiceNo,
                r.invoiceType,
                r.currency,
                format(new Date(r.issueDate), 'yyyy-MM-dd'),
                r.ageDays,
                r.contractNo,
                r.vehiclePlate,
                ...(r.bucketAmounts || []).map((x) => formatMoney(x)),
                formatMoney(r.outstanding),
            ].map(esc)
        );
        const csv = [headers.join(','), ...rows.map((line) => line.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-aging-${asOfDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {companyLogo ? (
                        <img
                            src={companyLogo}
                            alt="Company Logo"
                            style={{
                                height: 52,
                                width: 52,
                                objectFit: 'contain',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.6)',
                            }}
                        />
                    ) : null}
                    <div>
                        {companyName?.trim() ? (
                            <div style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.1 }}>{companyName.trim()}</div>
                        ) : null}
                        {companyAddress?.trim() ? (
                            <div style={{ color: '#555', fontSize: 12, marginTop: 6, whiteSpace: 'pre-line' }}>
                                {companyAddress}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase tracking-widest">
                        Customer payment due
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Aging summary from invoice issue date (open amounts as of selected date).
                    </p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.print()}
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/5"
                    >
                        <FileText className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={downloadCsv}
                        disabled={!reportData?.lines?.length}
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/5"
                    >
                        <Download className="w-4 h-4 mr-2" /> CSV
                    </Button>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-md border-border rounded-[2.5rem] shadow-sm overflow-hidden print:hidden">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Customer</Label>
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger className="bg-secondary/50 border-border rounded-xl h-12">
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl max-h-72">
                                    <SelectItem value="all">All customers</SelectItem>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {(c.companyName || c.name || c.email || c.code || c.id).slice(0, 80)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">As of date</Label>
                            <Input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
                                className="bg-secondary/50 border-border rounded-xl h-12"
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={fetchReport}
                            disabled={loading}
                            className="bg-primary text-white font-black uppercase tracking-widest text-xs h-12 rounded-xl shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Loading…' : 'Generate'}
                        </Button>
                    </div>
                    {error ? <p className="text-sm text-red-600 mt-4 font-medium">{error}</p> : null}
                </CardContent>
            </Card>

            {reportData ? (
                <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground print:text-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                            As of <b>{formatDate(reportData.asOf)}</b> — {reportData.lines.length}{' '}
                            open line(s). Total due: <b>{formatMoney(reportData.grandTotal)}</b>
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-3xl print:text-foreground">{reportData.definition}</p>

                    <Card className="bg-card border-border rounded-[2.5rem] shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black uppercase tracking-tight">By customer</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">
                                            Customer
                                        </TableHead>
                                        {bucketLabels.map((label) => (
                                            <TableHead
                                                key={label}
                                                className="text-right font-black text-[10px] uppercase tracking-widest"
                                            >
                                                {label}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.byCustomer.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={2 + (reportData.buckets?.length || 4)}
                                                className="pl-8 py-10 text-muted-foreground"
                                            >
                                                No open receivables for this filter.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reportData.byCustomer.map((row) => (
                                            <TableRow key={row.customerId}>
                                                <TableCell className="pl-8 font-bold">
                                                    {row.customerName}
                                                    {row.customerCode ? (
                                                        <span className="text-muted-foreground font-normal text-xs ml-2">
                                                            ({row.customerCode})
                                                        </span>
                                                    ) : null}
                                                </TableCell>
                                                {(row.bucketAmounts || []).map((amt, i) => (
                                                    <TableCell key={i} className="text-right tabular-nums">
                                                        {formatMoney(amt)}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right pr-8 font-black tabular-nums">
                                                    {formatMoney(row.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    {reportData.byCustomer.length > 0 ? (
                                        <TableRow className="bg-primary/5 font-black">
                                            <TableCell className="pl-8">Grand total</TableCell>
                                            {(reportData.grandBuckets || []).map((amt, i) => (
                                                <TableCell key={i} className="text-right tabular-nums">
                                                    {formatMoney(amt)}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right pr-8 tabular-nums">
                                                {formatMoney(reportData.grandTotal)}
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border rounded-[2.5rem] shadow-sm overflow-hidden print:break-inside-avoid">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black uppercase tracking-tight">Invoice detail</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Invoice
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Customer
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Type
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Issue
                                        </TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Age
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Contract
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Vehicle
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            CCY
                                        </TableHead>
                                        {bucketLabels.map((label) => (
                                            <TableHead
                                                key={label}
                                                className="text-right font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
                                            >
                                                {label}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                                            Due
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.lines.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9 + (reportData.buckets?.length || 4)}
                                                className="pl-8 py-10 text-muted-foreground"
                                            >
                                                No rows.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reportData.lines.map((r) => (
                                            <TableRow key={r.invoiceId}>
                                                <TableCell className="pl-8 font-mono text-sm whitespace-nowrap">
                                                    {r.invoiceNo}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap max-w-[200px] truncate">
                                                    {r.customerName}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">{r.invoiceType}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {formatDate(r.issueDate)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{r.ageDays}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs font-mono">
                                                    {r.contractNo || '—'}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">{r.vehiclePlate || '—'}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">{r.currency}</TableCell>
                                                {(r.bucketAmounts || []).map((amt, i) => (
                                                    <TableCell key={i} className="text-right tabular-nums text-sm">
                                                        {amt ? formatMoney(amt) : '—'}
                                                    </TableCell>
                                                ))}
                                                <TableCell
                                                    className={`text-right pr-8 font-bold tabular-nums ${
                                                        r.outstanding < 0 ? 'text-red-600' : ''
                                                    }`}
                                                >
                                                    {formatMoney(r.outstanding)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}
