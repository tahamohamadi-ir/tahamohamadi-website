"use client";

import React from "react";
import ReactDOM from "react-dom";

export const reportAccessibility = async () => {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        const axe = await import("@axe-core/react");
        axe.default(React, ReactDOM, 1000);
    }
};
