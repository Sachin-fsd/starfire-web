export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <label className="flex items-center gap-3 rounded border bg-white p-3">
        <input type="checkbox" />
        <span>Sync notes to Google Tasks</span>
      </label>
      <label className="flex items-center gap-3 rounded border bg-white p-3">
        <span>Daily digest time</span>
        <input className="rounded border px-2 py-1" type="time" defaultValue="08:00" />
      </label>
    </section>
  );
}
