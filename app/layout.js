import "./globals.css";

export const metadata = {
  title: "Eswatini Travel AI Agent",
  description: "Cheapest Johannesburg-Lahore fares, paid with PayPal."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
