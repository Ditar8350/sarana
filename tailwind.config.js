import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    'Instrument Sans',
                    'ui-sans-serif',
                    'system-ui',
                    'sans-serif',
                    '"Apple Color Emoji"',
                    '"Segoe UI Emoji"',
                    '"Segoe UI Symbol"',
                    '"Noto Color Emoji"',
                ],
                serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
                mono: [
                    'ui-monospace',
                    'SFMono-Regular',
                    'Menlo',
                    'Monaco',
                    'Consolas',
                    '"Liberation Mono"',
                    '"Courier New"',
                    'monospace',
                ],
            },
            colors: {
                // theme palette
                primary: {
                    DEFAULT: '#006039',
                    dark: '#004A2C',
                    light: '#0B7A4B',
                    soft: '#E3F1EA',
                },
                accent: {
                    DEFAULT: '#FCB900',
                    dark: '#D99F00',
                    soft: '#FFF4D1',
                },
                ink: '#111C2D',
                muted: '#3F4941',
                surface: {
                    DEFAULT: '#F9F9FF',
                    low: '#F0F3FF',
                    container: '#E7EEFF',
                },
                // legacy aliases (kept so older markup keeps working, now mapped to the new palette)
                'brand-green': '#006039',
                'brand-green-dark': '#004A2C',
                'brand-green-light': '#0B7A4B',
                'brand-amber': '#FCB900',
                'brand-amber-light': '#FFD866',
            },
        },
    },

    plugins: [forms],
};
