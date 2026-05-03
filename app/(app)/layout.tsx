import AppNavbar from "@/components/layout/AppNavbar";
import AppFooter from "@/components/layout/AppFooter";
import PageTransition from "@/components/shared/PageTransition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-64px)]">
        <PageTransition>{children}</PageTransition>
      </main>
      <AppFooter />
    </>
  );
}
