interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-3">
        <span className="text-lg font-semibold">Admin CMS</span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
