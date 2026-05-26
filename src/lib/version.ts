/**
 * Versão centralizada do sistema.
 * Para atualizar a versão de todo o portal, altere apenas este arquivo.
 */
export const SYSTEM_VERSION = '1.1.88';

export const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  ? `v${SYSTEM_VERSION}-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.substring(0, 6)}`
  : `v${SYSTEM_VERSION}`;
