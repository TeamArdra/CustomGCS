"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#3B82F6',
                secondary: '#10B981',
                danger: '#EF4444',
                warning: '#F59E0B',
                info: '#0EA5E9',
                success: '#10B981',
                dark: '#1F2937',
                light: '#F9FAFB',
            },
            spacing: {
                '128': '32rem',
                '144': '36rem',
            },
        },
    },
    plugins: [],
};
exports.default = config;
