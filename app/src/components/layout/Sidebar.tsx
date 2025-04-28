import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analysis', href: '/analysis' },
  { label: 'Competitors', href: '/competitors' },
  { label: 'Teams', href: '/teams' },
  { label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-56 h-full border-r bg-white dark:bg-background py-6 px-4">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 