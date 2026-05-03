import Link from "next/link";

const EVENT_LINKS = ["Movies", "Concerts", "Sports", "Theatre", "Comedy", "Festivals"];
const SUPPORT_LINKS = ["Help Center", "Cancellation Policy", "Contact Us", "About"];
const LEGAL_LINKS = ["Privacy Policy", "Terms of Service", "Cookie Policy"];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-semibold text-[var(--accent-dark)]">{children}</p>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-dark)]">
        {children}
      </Link>
    </li>
  );
}

export default function AppFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="mb-3 font-sans text-base font-bold tracking-widest text-[var(--accent-dark)]">BOOKING_SYSTEM</p>
            <p className="mb-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Book tickets for movies, concerts, sports and live events.
            </p>
            <p className="text-xs text-[var(--text-muted)]">Built for 21CSC205P · SRM IST</p>
          </div>

          {/* Events */}
          <div>
            <FooterHeading>Events</FooterHeading>
            <ul className="space-y-2">
              {EVENT_LINKS.map((name) => (
                <FooterLink key={name} href={`/events?category=${name.toLowerCase()}`}>
                  {name}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <FooterHeading>Support</FooterHeading>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((name) => (
                <FooterLink key={name} href="#">
                  {name}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <FooterHeading>Legal</FooterHeading>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((name) => (
                <FooterLink key={name} href="#">
                  {name}
                </FooterLink>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--text-muted)]">© 2026 BOOKING_SYSTEM. All rights reserved.</p>
          <p className="text-xs text-[var(--text-muted)]">Yash Raj Sharan</p>
        </div>
      </div>
    </footer>
  );
}
