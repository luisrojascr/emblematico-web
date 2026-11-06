export function SignOutButton({
  className = "text-ink-soft hover:text-ink",
}: {
  className?: string;
}) {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={`text-sm underline ${className}`}>
        Cerrar sesión
      </button>
    </form>
  );
}
