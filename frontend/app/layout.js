import './globals.css';

export const metadata = {
  title: 'Digital Twin',
  description: 'Your personal digital twin',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-900 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
