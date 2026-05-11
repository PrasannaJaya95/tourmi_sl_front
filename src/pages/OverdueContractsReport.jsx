import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatDateTime } from '@/lib/dates';
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

function money(n) {
    return (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OverdueContractsReport() {
    const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [customerId, setCustomerId] = useState('all');
    const [vehicleId, setVehicleId] = useState('all');
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        const loadVehicles = async () => {
            try {
                const { data } = await api.get('/vehicles?limit=1000');
                setVehicles(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            } catch (e) {
                console.error('Failed to load vehicles', e);
            }
        };
        loadVehicles();
    }, []);

    const runReport = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ asOfDate });
            if (customerId !== 'all') params.set('customerId', customerId);
            if (vehicleId !== 'all') params.set('vehicleId', vehicleId);
            const res = await api.get(`/reports/overdue-contracts?${params.toString()}`);
            setData(res.data);
        } catch (e) {
            console.error('Failed to load overdue contracts report', e);
            setError(e?.response?.data?.message || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase tracking-widest">
                        Overdue rental contracts
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Contracts past drop-off date/time and not completed/cancelled.
                    </p>
                </div>
                <div className="print:hidden">
                    <Button variant="outline" onClick={() => window.print()} className="rounded-xl">
                        Print
                    </Button>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-md border-border rounded-[2.5rem] shadow-sm overflow-hidden print:hidden">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Total overdue</CardTitle></CardHeader><CardContent>{data.count}</CardContent></Card>
                        <Card><CardHeader><CardTitle>Total amount due</CardTitle></CardHeader><CardContent>{money(data.totalAmountDue)}</CardContent></Card>
                        <Card><CardHeader><CardTitle>In progress</CardTitle></CardHeader><CardContent>{data.summaryByStatus?.IN_PROGRESS?.count || 0}</CardContent></Card>
                        <Card><CardHeader><CardTitle>Return pending</CardTitle></CardHeader><CardContent>{data.summaryByStatus?.RETURN?.count || 0}</CardContent></Card>
                    </div>

                    <Card className="rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-8">Contract</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Drop-off</TableHead>
                                        <TableHead className="text-right">Overdue days</TableHead>
                                        <TableHead className="text-right pr-8">Amount due</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.lines?.length ? data.lines.map((row) => (
                                        <TableRow key={row.contractId}>
                                            <TableCell className="pl-8 font-mono">{row.contractNo}</TableCell>
                                            <TableCell>{row.customerName}</TableCell>
                                            <TableCell>{row.status}</TableCell>
                                            <TableCell>{row.vehiclePlate || '-'}</TableCell>
                                            <TableCell>{formatDateTime(row.dueAt)}</TableCell>
                                            <TableCell className="text-right">{row.overdueDays}</TableCell>
                                            <TableCell className="text-right pr-8">{money(row.amountDue)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="pl-8 py-8 text-muted-foreground">No overdue contracts.</TableCell>
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
