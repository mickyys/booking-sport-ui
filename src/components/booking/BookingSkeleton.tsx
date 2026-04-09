"use client";
import React from 'react';

export const BookingCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="bg-slate-200 w-16 h-16 rounded-xl"></div>
                <div className="space-y-2">
                    <div className="h-3 w-32 bg-slate-200 rounded"></div>
                    <div className="h-5 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-40 bg-slate-200 rounded"></div>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
                <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
            </div>
        </div>
    );
};

export const PastBookingItemSkeleton: React.FC = () => {
    return (
        <div className="p-4 border-b border-slate-100 last:border-0 flex justify-between items-center animate-pulse">
            <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-3 w-32 bg-slate-100 rounded"></div>
            </div>
            <div className="h-4 w-16 bg-slate-100 rounded"></div>
        </div>
    );
};
