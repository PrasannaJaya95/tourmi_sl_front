import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { User, Phone, Mail, CreditCard, Calendar, MapPin, Shield, CheckCircle2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { resolveServerUrl } from '@/lib/api';

const DriverDetailModal = ({ driver, isOpen, onClose, onEditClick }) => {
    if (!driver) return null;

    const details = driver.driverDetails || {};
    const driverName = driver.name;
    const driverEmail = driver.email;
    const driverPhone = details.phoneNumber || 'N/A';
    const driverImage = details.driverImageUrl ? resolveServerUrl(details.driverImageUrl) : null;
    const status = details.status || 'ACTIVE';

    const handleEditClick = () => {
        onClose();
        if (onEditClick) {
            onEditClick(driver);
        }
    };

    const documents = [
        { label: 'License (Front)', url: details.licenseFrontUrl },
        { label: 'License (Back)', url: details.licenseBackUrl },
        { label: 'NIC (Front)', url: details.nicFrontUrl },
        { label: 'NIC (Back)', url: details.nicBackUrl },
        { label: 'Optional I', url: details.optionalDoc1Url },
        { label: 'Optional II', url: details.optionalDoc2Url },
    ].filter(doc => doc.url);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl w-full p-0 bg-card border-border rounded-[2.5rem] overflow-hidden shadow-2xl gap-0 max-h-[95vh] overflow-y-auto custom-scrollbar [&>button]:right-6 [&>button]:top-6 [&>button]:text-foreground [&>button]:bg-background/80 [&>button]:backdrop-blur [&>button]:rounded-full [&>button]:p-2 [&>button]:shadow-lg [&>button]:transition-all [&>button:hover]:scale-110">
                <DialogTitle className="sr-only">Driver Profile Summary - {driverName}</DialogTitle>
                <DialogDescription className="sr-only">Comprehensive overview of driver credentials and status</DialogDescription>

                {/* Header Profile Section */}
                <div className="relative pt-12 pb-8 px-10 bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/50">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-[2rem] bg-secondary flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                {driverImage ? (
                                    <img src={driverImage} alt={driverName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <User className="h-12 w-12 text-muted-foreground" />
                                )}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-4xl font-black text-foreground tracking-tight mb-2">{driverName}</h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                                <span className="flex items-center gap-1.5 text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                                    <Mail className="w-3.5 h-3.5 text-primary" /> {driverEmail}
                                </span>
                                <span className="h-1.5 w-1.5 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5 text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                                    <Phone className="w-3.5 h-3.5 text-primary" /> {driverPhone}
                                </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    Status: {status.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-border rounded-2xl p-5 bg-secondary/30 flex items-center gap-4 transition-all hover:bg-secondary/50 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">License Number</span>
                                <span className="font-black text-foreground">{details.licenseNumber || 'PENDING'}</span>
                            </div>
                        </div>

                        <div className="border border-border rounded-2xl p-5 bg-secondary/30 flex items-center gap-4 transition-all hover:bg-secondary/50 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">License Expiry</span>
                                <span className="font-black text-foreground">{formatDate(details.licenseExpiryDate, 'N/A')}</span>
                            </div>
                        </div>

                        <div className="border border-border rounded-2xl p-5 bg-secondary/30 flex items-center gap-4 transition-all hover:bg-secondary/50 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">NIC Profile</span>
                                <span className="font-black text-foreground">{details.nic || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="border border-border rounded-2xl p-5 bg-secondary/30 flex items-center gap-4 transition-all hover:bg-secondary/50 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">Resident Address</span>
                                <span className="font-black text-foreground truncate block">{details.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Document Gallery */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-black tracking-tight uppercase">Credential Gallery</h3>
                            <div className="h-px flex-1 bg-border/50"></div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="space-y-3 group cursor-pointer">
                                    <div className="relative aspect-[4/3] rounded-2xl bg-secondary/50 border-2 border-border overflow-hidden transition-all hover:border-primary/50 shadow-sm">
                                        <img src={resolveServerUrl(doc.url)} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest scale-90 group-hover:scale-100 transition-transform">Inspect</span>
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{doc.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleEditClick}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-5 rounded-2xl font-black transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 uppercase tracking-[0.2em] text-xs"
                        >
                            Refine Profile Credentials
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DriverDetailModal;
