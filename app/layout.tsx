import "./globals.css";

export const metadata = {
  title: "Coway ESG Master System",
  description: "Supply Chain Scope 1, 2 Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
