import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VJ Song Notes',
  description: 'An application for managing song notes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 