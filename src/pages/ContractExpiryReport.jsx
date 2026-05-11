import { useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import { formatDate, formatDateTime } from '@/lib/dates';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function ContractExpiryReport() {
    const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    const [customerId, setCustomerId] = useState('all');
    const [vehicleId, setVehicleId] = useState('all');
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [cRes, vRes] = await Promise.all([
                    api.get('/clients?limit=1000'),
                    api.get('/vehicles?limit=1000')
                ]);
                
                const cData = cRes.data;
                setCustomers(Array.isArray(cData.data) ? cData.data : (Array.isArray(cData) ? cData : []));
                
                const vData = vRes.data;
                setVehicles(Array.isArray(vData.data) ? vData.data : (Array.isArray(vData) ? vData : []));
            } catch (e) {
                console.error('Failed to load filters', e);
            }
        };
        load();
    }, []);

    const runReport = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ fromDate, toDate });
            if (customerId !== 'all') params.set('customerId', customerId);
            if (vehicleId !== 'all') params.set('vehicleId', vehicleId);
            const res = await api.get(`/reports/contract-expiry?${params.toString()}`);
            setData(res.data);
        } catch (e) {
            console.error('Failed to load contract expiry report', e);
            setError(e?.response?.data?.message || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const downloadCsv = () => {
        if (!data?.lines?.length) return;
        const esc = (v) => {
            const s = v == null ? '' : String(v);
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        const headers = [
            'Contract',
            'Status',
            'Customer',
            'Code',
            'Vehicle plate',
            'Model',
            'Scheduled expiry',
            'Days until expiry',
            'Actual return',
        ];
        const rows = data.lines.map((r) =>
            [
                r.contractNo,
                r.status,
                r.customerName,
                r.customerCode,
                r.vehiclePlate,
                r.vehicleModel,
                format(new Date(r.scheduledExpiry), 'yyyy-MM-dd HH:mm'),
                r.daysUntilExpiry,
                r.actualReturnDate ? format(new Date(r.actualReturnDate), 'yyyy-MM-dd') : '',
            ].map(esc)
        );
        const csv = [headers.join(','), ...rows.map((line) => line.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contract-expiry-${fromDate}_to_${toDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase tracking-widest">
                        Vehicle contract expiry details
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Scheduled drop-off (contract end) within the selected period, by vehicle and customer.
                    </p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                        Print
                    </Button>
                    <Button variant="outline" onClick={downloadCsv} disabled={!data?.lines?.length} className="rounded-xl">
                        CSV
                    </Button>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-md border-border rounded-[2.5rem] shadow-sm overflow-hidden print:hidden">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">From</Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-secondary/50 border-border rounded-xl h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">To</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-secondary/50 border-border rounded-xl h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Vehicle</Label>
                            <Select value={vehicleId} onValueChange={setVehicleId}>
                                <SelectTrigger className="bg-secondary/50 border-border rounded-xl h-12">
                                    <SelectValue placeholder="All vehicles" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl max-h-72">
                                    <SelectItem value="all">All vehicles</SelectItem>
                                    {vehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {(v.licensePlate || v.id).slice(0, 80)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
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
                        <Button
                            onClick={runReport}
                            disabled={loading}
                            className="bg-primary text-white font-black uppercase tracking-widest text-xs h-12 rounded-xl shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Loading...' : 'Generate'}
                        </Button>
                    </div>
                    {error ? <p className="text-sm text-red-600 mt-4">{error}</p> : null}
                </CardContent>
            </Card>

            {data ? (
                <div className="space-y-6">
                    <p className="text-xs text-muted-foreground max-w-3xl">{data.definition}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contracts in period</CardTitle>
                            </CardHeader>
                            <CardContent>{data.count}</CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Period</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                {formatDate(data.period.from)} — {formatDate(data.period.to)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Days until expiry</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                From today’s calendar date ({formatDate(data.asOfDay)}); negative
                                means overdue.
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-8">Vehicle</TableHead>
                                        <TableHead>Contract</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Scheduled expiry</TableHead>
                                        <TableHead className="text-right">Days</TableHead>
                                        <TableHead className="pr-8">Actual return</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.lines?.length ? (
                                        data.lines.map((row) => (
                                            <TableRow key={row.contractId}>
                                                <TableCell className="pl-8 font-mono text-sm">
                                                    {row.vehiclePlate || '—'}
                                                    {row.vehicleModel ? (
                                                        <span className="block text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                                                            {row.vehicleModel}
                                                        </span>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{row.contractNo}</TableCell>
                                                <TableCell className="text-sm">{row.customerName}</TableCell>
                                                <TableCell className="text-xs">{row.status}</TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">
                                                    {formatDateTime(row.scheduledExpiry)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-bold ${
                                                        row.daysUntilExpiry < 0 ? 'text-red-600' : ''
                                                    }`}
                                                >
                                                    {row.daysUntilExpiry}
                                                </TableCell>
                                                <TableCell className="pr-8 text-sm whitespace-nowrap">
                                                    {formatDate(row.actualReturnDate)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="pl-8 py-8 text-muted-foreground">
                                                No contracts with scheduled expiry in this period.
                                            </TableCell>
                                        </TableRow>
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
