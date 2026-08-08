"use client";

import React, { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { useTheme } from "next-themes";

const pageViewsData = [
    { name: "Mon", views: 4000, visitors: 2400 },
    { name: "Tue", views: 3000, visitors: 1398 },
    { name: "Wed", views: 2000, visitors: 9800 },
    { name: "Thu", views: 2780, visitors: 3908 },
    { name: "Fri", views: 1890, visitors: 4800 },
    { name: "Sat", views: 2390, visitors: 3800 },
    { name: "Sun", views: 3490, visitors: 4300 },
];

const interactionData = [
    { name: "Hero CTA", clicks: 400 },
    { name: "Contact Form", clicks: 300 },
    { name: "Portfolio", clicks: 200 },
    { name: "Resume DL", clicks: 278 },
    { name: "Social Links", clicks: 189 },
];

export function DashboardCharts() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const strokeColor = theme === "dark" ? "#e5e7eb" : "#374151";
    const primaryColor = "#3b82f6";
    const secondaryColor = "#10b981";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Page Views & Visitors</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={pageViewsData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke={strokeColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={strokeColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: theme === "dark" ? "#1f2937" : "#fff", borderColor: theme === "dark" ? "#374151" : "#e5e7eb", borderRadius: "8px" }}
                            />
                            <Area type="monotone" dataKey="views" stroke={primaryColor} fillOpacity={1} fill="url(#colorViews)" />
                            <Area type="monotone" dataKey="visitors" stroke={secondaryColor} fillOpacity={1} fill="url(#colorVisitors)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Interactions by Component</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={interactionData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <XAxis dataKey="name" stroke={strokeColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={strokeColor} fontSize={12} tickLine={false} axisLine={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} />
                            <Tooltip 
                                cursor={{ fill: theme === "dark" ? "#374151" : "#f3f4f6" }}
                                contentStyle={{ backgroundColor: theme === "dark" ? "#1f2937" : "#fff", borderColor: theme === "dark" ? "#374151" : "#e5e7eb", borderRadius: "8px" }}
                            />
                            <Bar dataKey="clicks" fill={primaryColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
