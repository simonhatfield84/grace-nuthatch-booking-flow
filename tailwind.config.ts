
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Grace OS Brand Colors
				grace: {
					primary: '#D87C5A',      // Warm Terracotta
					secondary: '#005F56',    // Deep Teal
					background: '#F4EAE0',   // Soft Sand
					accent: '#E9A036',       // Muted Gold
					dark: '#2E2E2E',         // Charcoal Grey
					light: '#FFFFFF'         // Pure White
				},
				// iPad-Native Host Interface Colors
				host: {
					'blackest-dark': '#111315',
					'dark-gray': '#292C2D',
					'mid-gray': '#676767',
					'white': '#FFFFFF',
					'mint': '#CCF0DB',
					'lavender': '#E4C0ED',
					'sky-blue': '#C2D8E9',
					'blush': '#F1C8D0',
					'pastel-purple': '#C5CAEF',
					'status-confirmed': '#C2D8E9',
					'status-seated': '#CCF0DB',
					'status-late': '#F1C8D0',
					'status-finished': '#676767',
					'status-error': '#E47272'
				},
				// The Nuthatch Brand Colors
				nuthatch: {
					'dark': '#2B3840',      // Primary dark
					'white': '#FFFFFF',     // Pure white  
					'green': '#384140',     // Secondary green
					'light': '#F8F9FA',     // Light background variant
					'border': '#E9ECEF',    // Border color
					'muted': '#6C757D'      // Muted text
				}
			},
			fontFamily: {
				'markazi': ['Markazi Text', 'serif'],
				'playfair': ['Playfair Display', 'serif'],
				'poppins': ['Poppins', 'sans-serif'],
				'karla': ['Karla', 'sans-serif'],
				'inter': ['Inter', 'sans-serif'],
				'lato': ['Lato', 'sans-serif'],
				'nuthatch-heading': ['Playfair Display', 'serif'],
				'nuthatch-body': ['Lato', 'sans-serif']
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
