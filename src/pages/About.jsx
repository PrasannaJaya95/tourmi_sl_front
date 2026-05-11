import React from 'react';
import { Info, Mail, Globe, Phone, ShieldCheck, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logoPng from '../assets/logo.png';

const About = () => {
    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-foreground mb-2 uppercase italic">
                            About Rentix
                        </h1>
                        <p className="text-muted-foreground text-lg font-medium italic">
                            Version 2.4.0 — Premium Rental Management Suite
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Brand Story */}
                <Card className="lg:col-span-2 bg-card/50 backdrop-blur-xl border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/[0.02]">
                    <CardHeader className="p-10 pb-0">
                        <img src={logoPng} alt="Rentix Logo" className="w-full max-w-[240px] h-auto mb-6 object-contain" />
                        <CardTitle className="text-3xl font-black tracking-tight">The Rentix Protocol</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 pt-6 space-y-6 text-muted-foreground leading-relaxed">
                        <p>
                            Rentix is a comprehensive fleet management and car rental orchestration platform designed for premium operators.
                            Our system streamlines the entire lifecycle of a rental agreement, from initial quotation and identity verification
                            to real-time ledger maintenance and return processing.
                        </p>
                        <p>
                            Engineered with a focus on data integrity and user experience, Rentix empowers administrators to maintain
                            full control over their operations through a centralized, high-fidelity command center.
                        </p>

                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <div className="p-6 bg-secondary/30 rounded-3xl border border-border/50">
                                <ShieldCheck className="h-8 w-8 text-primary mb-3" />
                                <h4 className="font-bold text-foreground mb-1">Secure Core</h4>
                                <p className="text-xs">End-to-end data encryption and robust role-based access.</p>
                            </div>
                            <div className="p-6 bg-secondary/30 rounded-3xl border border-border/50">
                                <Heart className="h-8 w-8 text-rose-500 mb-3" />
                                <h4 className="font-bold text-foreground mb-1">User Centric</h4>
                                <p className="text-xs">Designed for maximum efficiency and minimal friction.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Developer / Contact */}
                <Card className="bg-[#3B82F6] text-white border-none rounded-[2.5rem] shadow-2xl shadow-[#3B82F6]/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <CardHeader className="p-10">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                            <Info className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight">Developer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Website</p>
                                    <a href="https://www.codebraze.lk" target="_blank" rel="noreferrer" className="font-bold hover:underline">www.codebraze.lk</a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Support & Sales</p>
                                    <a href="mailto:sales@codebraze.lk" className="font-bold hover:underline">sales@codebraze.lk</a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Contact Number</p>
                                    <p className="font-bold">070 2 78 78 73</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <p className="text-xs font-medium leading-relaxed opacity-80">
                                © {new Date().getFullYear()} Codebraze PVT LTD.<br />
                                All rights reserved. Rentix is a registered trademark of Codebraze PVT LTD.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default About;
