import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Field Shift — Grow with clarity', description: 'Explore historical farm context, compare illustrative crop sequences and test water scenarios in the Fayoum research prototype.' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ar" dir="rtl"><body>{children}</body></html>}
