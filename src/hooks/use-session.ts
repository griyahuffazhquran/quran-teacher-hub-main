import { useEffect, useState } from "react";
import { hydrateAll, teacherRepo } from "@/lib/data/repositories";
import { currentUser, roleOf } from "@/lib/services/auth-service";
import { hydrateSession, subscribeSession } from "@/lib/services/session-service";
import type { Teacher, UserRole } from "@/lib/data/types";

/** Current logged-in user, hydrated on the client only. */
export function useSession() {
  const [user, setUser] = useState<Teacher | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateAll();
    hydrateSession();
    const sync = () => setUser(currentUser());
    sync();
    setReady(true);
    const offSession = subscribeSession(sync);
    const offTeachers = teacherRepo.subscribe(sync);
    return () => {
      offSession();
      offTeachers();
    };
  }, []);

  const role: UserRole | undefined = roleOf(user);
  return { user, role, ready, isUpgrader: role === "upgrader" };
}
