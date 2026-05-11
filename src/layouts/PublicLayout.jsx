import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div className="min-h-screen text-foreground flex flex-col font-sans bg-background transition-colors duration-300">
            <main className="flex-1 flex flex-col">
                <Outlet />
            </main>
            <footer className="py-8 border-t border-border/50 text-center space-y-2 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Powered by Rentix</p>
                <p className="text-[9px] font-bold text-muted-foreground italic">All rights reserved. Codebraze PVT LTD | 070 2 78 78 73 | www.codebraze.lk</p>
            </footer>
        </div>
    );
};

export default PublicLayout;
