import { ConfirmHashSession } from "../callback/ConfirmHashSession";

export default function ConfirmPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <h1 className="mb-4 text-3xl">Acceso</h1>
      <ConfirmHashSession />
    </main>
  );
}
