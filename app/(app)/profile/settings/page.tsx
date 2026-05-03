"use client";

import { useMemo, useState } from "react";
import { Bell, Lock, Save, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { useUserStore } from "@/lib/store/userStore";

export default function ProfileSettingsPage() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [promoUpdates, setPromoUpdates] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return name.trim() !== user.name || phone.trim() !== user.phone;
  }, [name, phone, user]);

  if (!user) return null;

  async function handleSaveProfile() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!phone.trim()) { toast.error("Phone number is required"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${user!.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to save"); return; }
      setUser({ ...user!, ...json.data });
      toast.success("Settings saved");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h1 className="font-syne text-3xl font-bold text-[var(--accent-dark)]">Profile Settings</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Update your account details and communication preferences.</p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserRound size={18} className="text-[var(--accent)]" />
          <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Account Details</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--accent-dark)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="Enter your full name"
            />
          </Field>

          <Field label="Phone Number">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--accent-dark)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="Enter phone number"
            />
          </Field>

          <Field label="Email Address">
            <input
              value={user.email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#71717A]"
            />
          </Field>

          <Field label="Account Status">
            <div className="flex h-[42px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700">
              Active account
            </div>
          </Field>
        </div>

        <div className="mt-5">
          <button
            onClick={handleSaveProfile}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} className="text-[var(--accent)]" />
          <h2 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Notifications</h2>
        </div>

        <div className="space-y-3">
          <ToggleRow
            title="Email Updates"
            description="Receive booking confirmations and schedule changes"
            enabled={emailUpdates}
            onToggle={() => setEmailUpdates((v) => !v)}
          />
          <ToggleRow
            title="Booking Alerts"
            description="Reminders before event start time"
            enabled={bookingAlerts}
            onToggle={() => setBookingAlerts((v) => !v)}
          />
          <ToggleRow
            title="Promotional Offers"
            description="Get discount and promo campaign messages"
            enabled={promoUpdates}
            onToggle={() => setPromoUpdates((v) => !v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#F1D4D4] bg-[#FFF8F8] p-5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#B42318]" />
          <h2 className="font-syne text-xl font-bold text-[#7A271A]">Security</h2>
        </div>
        <p className="text-sm text-[#7A271A]">Password reset can be wired to a real auth provider.</p>
        <button
          onClick={() => toast("Security actions will be enabled with backend auth integration.")}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E9AFAF] bg-white px-4 py-2 text-sm font-semibold text-[#7A271A] hover:bg-[#FFF1F1]"
        >
          <Lock size={15} />
          Manage Password
        </button>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3.5">
      <div>
        <p className="text-sm font-semibold text-[var(--accent-dark)]">{title}</p>
        <p className="text-xs text-[var(--text-secondary)]">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-[var(--accent)]" : "bg-[#D4D4D8]"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}
