'use server';

import { cookies } from 'next/headers';

export async function enableGuestMode() {
  const cookieStore = await cookies();

  cookieStore.set('UFLUX_guest_mode', 'true', {
    path: '/',
    maxAge: 86400, // 24시간
    sameSite: 'lax',
    httpOnly: false,
  });

  return { success: true };
}

export async function disableGuestMode() {
  const cookieStore = await cookies();

  cookieStore.delete('UFLUX_guest_mode');

  return { success: true };
}

