import './globals.css';

export const metadata = {
  title: 'VJ Song Notes',
  description: 'An application for managing song notes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 