// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import UserPresenceAvatar, { DEFAULT_USERS } from "../../componentes/user-presence-avatar/UserPresenceAvatar";

export default function UserPresenceAvatarDemo() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center">
      <UserPresenceAvatar users={DEFAULT_USERS} />
    </div>
  );
}
