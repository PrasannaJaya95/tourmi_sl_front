import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination) return null;

    const { page, totalPages, total, limit } = pagination;
    const hasMultiplePages = totalPages > 1;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={i === page ? "default" : "outline"}
                    size="sm"
                    className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                        i === page 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" 
                        : "bg-secondary/50 border-border hover:bg-secondary"
                    }`}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </Button>
            );
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 bg-card/30 backdrop-blur-md border-t border-border mt-auto">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Showing <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground">{total}</span> records
            </div>
            
            {hasMultiplePages && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-9 h-9 rounded-xl bg-secondary/50 border-border hover:bg-secondary disabled:opacity-30 transition-all"
                        onClick={() => onPageChange(1)}
                        disabled={page === 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-9 h-9 rounded-xl bg-secondary/50 border-border hover:bg-secondary disabled:opacity-30 transition-all"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 px-2">
                        {renderPageNumbers()}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="w-9 h-9 rounded-xl bg-secondary/50 border-border hover:bg-secondary disabled:opacity-30 transition-all"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-9 h-9 rounded-xl bg-secondary/50 border-border hover:bg-secondary disabled:opacity-30 transition-all"
                        onClick={() => onPageChange(totalPages)}
                        disabled={page === totalPages}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Pagination;
