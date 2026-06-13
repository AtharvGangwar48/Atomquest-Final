import './globals.css';

export const metadata = {
  title: 'SupportVision - Video Support Platform',
  description: 'Real-time video calling for customer support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
