import * as React from 'react';
// Substituto offline de next-auth/react: sempre "não autenticado"
export const useSession = () => ({ data: null, status: 'unauthenticated' as const, update: async () => null });
export const signIn = async (..._a: any[]) => undefined;
export const signOut = async (..._a: any[]) => undefined;
export const getSession = async () => null;
export const SessionProvider = ({ children }: any) => <>{children}</>;
