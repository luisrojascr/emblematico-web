export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-ink-soft hover:text-ink text-sm underline"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
