/**
 * Login layout — renders login page without the admin nav/guard.
 * The auth guard is applied in the admin (dashboard) layout, not here.
 */
export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
