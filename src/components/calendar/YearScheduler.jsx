import React, { useMemo } from 'react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const YearScheduler = ({ date, events, onSelectEvent, onNavigate, vehicles = [] }) => {

    // 1. Year State (driven by RBC date)
    const yearStart = startOfYear(date);
    const yearEnd = endOfYear(date);
    const currentYear = date.getFullYear();

    // 2. Generate Timeline Data
    const months = useMemo(() => eachMonthOfInterval({ start: yearStart, end: yearEnd }), [yearStart, yearEnd]);

    // Flatten days for the header
    const days = useMemo(() => {
        return eachDayOfInterval({ start: yearStart, end: yearEnd });
    }, [yearStart, yearEnd]);

    // 3. Optimized Event Lookup Map (O(1) access per day)
    const eventLookup = useMemo(() => {
        const map = new Map(); // Key: "vehicleId-YYYY-MM-DD"

        events.forEach(ev => {
            const contract = ev.resource;
            if (!contract) return;

            const exchangeList = contract.vehicleExchanges || [];
            const lastEx = exchangeList.length > 0 ? exchangeList[exchangeList.length - 1] : null;
            const activeVehId = lastEx ? (lastEx.newVehicle?.id || lastEx.oldVehicle?.id) : contract.vehicle?.id;

            if (activeVehId) {
                if (ev.status === 'RETURN' || ev.status === 'COMPLETED') return;

                const start = new Date(ev.start);
                const end = new Date(ev.end);

                // Iterate through all days of the event and map them
                let curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                while (curr <= stop) {
                    const dateKey = `${activeVehId}-${format(curr, 'yyyy-MM-dd')}`;
                    if (!map.has(dateKey)) {
                        map.set(dateKey, {
                            ...ev,
                            isStart: isSameDay(start, curr),
                            isEnd: isSameDay(end, curr)
                        });
                    }
                    curr = addDays(curr, 1);
                }
            }
        });

        return map;
    }, [events]);

    // 4. Scroll Handler
    const handleYearChange = (delta) => {
        const newDate = new Date(date);
        newDate.setFullYear(newDate.getFullYear() + delta);
        onNavigate('DATE', newDate);
    };

    // Calculate dynamic height based on vehicle count
    const rowHeight = 48; // h-12 = 48px
    const headerHeight = 82; // Combined height of month + day headers (41px + 41px)
    const maxVisibleRows = 10; // Maximum rows before scrolling
    const visibleRows = Math.min(vehicles.length, maxVisibleRows);
    const containerHeight = visibleRows * rowHeight + headerHeight;
    const needsScroll = vehicles.length > maxVisibleRows;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#050b1d] text-slate-600 dark:text-slate-300 overflow-hidden font-['Exo_2'] transition-colors duration-300">

            {/* Header / Controls */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]">
                <div className="flex items-center gap-4">
                    <button onClick={() => handleYearChange(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-600 dark:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wider">{currentYear}</span>
                    <button onClick={() => handleYearChange(1)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-600 dark:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-600 dark:text-violet-400">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div> Upcoming
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-600 dark:text-yellow-400">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div> In Progress
                    </div>
                </div>
            </div>

            {/* Timeline Container */}
            <div
                className={cn(
                    "relative custom-scrollbar",
                    needsScroll ? "overflow-auto" : "overflow-x-auto overflow-y-hidden"
                )}
                style={{
                    maxHeight: needsScroll ? `${containerHeight}px` : 'auto',
                    minHeight: vehicles.length > 0 ? `${Math.min(vehicles.length * rowHeight + headerHeight, containerHeight)}px` : '200px'
                }}
            >

                <div className="inline-block min-w-full">
                    {/* Header Row: Months */}
                    <div className="flex sticky top-0 z-20 border-b border-slate-200 dark:border-white/5">
                        <div className="sticky left-0 z-30 w-[200px] min-w-[200px] bg-slate-100 dark:bg-[#0f172a] p-3 font-bold border-r border-slate-200 dark:border-white/5 text-center text-slate-700 dark:text-slate-100">
                            Vehicle
                        </div>
                        {months.map((m, idx) => {
                            const daysInMonth = eachDayOfInterval({ start: startOfMonth(m), end: endOfMonth(m) }).length;
                            const bgClass = idx % 2 === 0 ? "bg-slate-100 dark:bg-[#0f172a]" : "bg-slate-200 dark:bg-[#1e293b]";
                            return (
                                <div key={m.toString()} className={cn("text-center border-r border-slate-200 dark:border-white/5 py-2 font-bold text-slate-600 dark:text-slate-200", bgClass)} style={{ width: `${daysInMonth * 40}px` }}>
                                    {format(m, 'MMMM')}
                                </div>
                            );
                        })}
                    </div>

                    {/* Header Row: Days */}
                    <div className="flex sticky top-[41px] z-20 border-b border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="sticky left-0 z-30 w-[200px] min-w-[200px] bg-slate-50 dark:bg-[#1e293b] border-r border-slate-200 dark:border-white/5 flex items-center justify-center font-medium">
                            Days
                        </div>
                        {days.map((d, idx) => {
                            const isEven = idx % 2 === 0;
                            const bgClass = isEven 
                                ? "bg-slate-50 dark:bg-[#1e293b]" 
                                : "bg-slate-100 dark:bg-[#151f30]";

                            return (
                                <div key={d.toString()} className={cn("w-[40px] min-w-[40px] text-center py-1.5 border-r border-slate-200 dark:border-white/5", bgClass)}>
                                    {format(d, 'd')}
                                </div>
                            );
                        })}
                    </div>

                    {/* Body Rows: Vehicles */}
                    <div className="relative">
                        {vehicles.map((veh, idx) => (
                            <VehicleRow
                                key={veh.id}
                                veh={veh}
                                days={days}
                                eventLookup={eventLookup}
                                onSelectEvent={onSelectEvent}
                                isEvenRow={idx % 2 === 0}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Memoized Sub-component for High-Performance Rendering
const VehicleRow = React.memo(({ veh, days, eventLookup, onSelectEvent, isEvenRow }) => {
    const rowBgClass = isEvenRow ? "bg-white dark:bg-[#050b1d]" : "bg-slate-100/30 dark:bg-white/[0.03]";
    return (
        <div className={cn("flex border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group", rowBgClass)}>
            {/* Vehicle Name Sticky */}
            <div className="sticky left-0 z-10 w-[200px] min-w-[200px] p-3 bg-white dark:bg-[#050b1d] group-hover:bg-slate-50 dark:group-hover:bg-[#0f172a] border-r border-slate-200 dark:border-white/5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 truncate shadow-[4px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: veh.status === 'AVAILABLE' ? '#10b981' : veh.status === 'RENTED' ? '#ef4444' : '#64748b' }}></span>
                {veh.make} {veh.model}
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{veh.licensePlate}</span>
            </div>

            {/* Days Grid */}
            {days.map((d, idx) => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const dateKey = `${veh.id}-${dateStr}`;
                const event = eventLookup.get(dateKey);

                const isEven = idx % 2 === 0;
                const baseBgClass = isEven 
                    ? "bg-transparent" 
                    : "bg-slate-100/40 dark:bg-white/[0.04]";

                if (!event) {
                    return (
                        <div
                            key={dateStr}
                            className={cn(
                                "w-[40px] min-w-[40px] h-12 flex items-center justify-center relative border-r border-white/5",
                                isSameDay(d, new Date()) && "bg-white/5",
                                baseBgClass
                            )}
                        />
                    );
                }

                const isStart = event.isStart;
                const isEnd = event.isEnd;

                let bgClass = "";
                let marginClass = "mx-0.5 rounded-sm";

                if (event.status === 'IN_PROGRESS') bgClass = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.35)] z-0";
                else if (event.status === 'UPCOMING') bgClass = "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.35)] z-0";

                if (!isStart && !isEnd) {
                    marginClass = "mx-0 rounded-none";
                } else if (isStart && !isEnd) {
                    marginClass = "ml-0.5 mr-0 rounded-l-sm rounded-r-none";
                } else if (!isStart && isEnd) {
                    marginClass = "ml-0 mr-0.5 rounded-l-none rounded-r-sm";
                }

                return (
                    <div
                        key={dateStr}
                        className={cn(
                            "w-[40px] min-w-[40px] h-12 flex items-center justify-center relative border-r border-white/5",
                            isSameDay(d, new Date()) && "bg-white/5"
                        )}
                    >
                        <div
                            className={cn("absolute inset-y-1 opacity-80 hover:opacity-100 cursor-pointer transition-all", marginClass, bgClass,
                                !isStart && !isEnd ? "inset-x-0" : "",
                                isStart && !isEnd ? "left-0.5 right-0" : "",
                                !isStart && isEnd ? "left-0 right-0.5" : "",
                                isStart && isEnd ? "inset-x-0 mx-0.5" : ""
                            )}
                            onClick={() => onSelectEvent(event)}
                            title={event.title}
                        />
                    </div>
                );
            })}
        </div>
    );
});

// RBC Static Properties
YearScheduler.range = (date) => {
    return [startOfYear(date), endOfYear(date)];
};

YearScheduler.navigate = (date, action) => {
    if (action === 'PREV') return new Date(date.setFullYear(date.getFullYear() - 1));
    if (action === 'NEXT') return new Date(date.setFullYear(date.getFullYear() + 1));
    return date;
};

YearScheduler.title = (date) => {
    return format(date, 'yyyy');
};

export default YearScheduler;
