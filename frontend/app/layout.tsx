import "./globals.css";

export const metadata = {
  title: "Digital Twin",
  description: "Your personal digital twin",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
