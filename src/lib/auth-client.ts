"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { additionalUserFields } from "./auth-shared";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: additionalUserFields })],
});

export const { signIn, signUp, signOut, useSession } = authClient;
