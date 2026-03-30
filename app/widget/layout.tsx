export default function WidgetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh w-full bg-white dark:bg-gray-900 overflow-hidden">
      {children}
    </div>
  );
}
