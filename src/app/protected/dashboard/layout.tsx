export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-start py-8 md:py-12">
      <div className="container max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
}
