export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-2xl font-bold">Área de alumnos</h1>
        <p className="mt-4 text-sm text-zinc-400">
          El login con Firebase Auth se activará cuando configures{" "}
          <code className="text-sky-400">.env.local</code>.
        </p>
      </div>
    </div>
  );
}
