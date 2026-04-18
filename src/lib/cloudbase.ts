import cloudbase from '@cloudbase/js-sdk';

export const app = cloudbase.init({
  env: (import.meta as any).env.VITE_CLOUDBASE_ENV_ID || 'peclass-d1gxoyjin67a08c55'
});

export const auth = app.auth({
  persistence: 'local'
});

export const db = app.database();

// Automatically sign in anonymously for local data access without accounts
export const signInAnonymous = async () => {
  const loginState = await auth.getLoginState();
  if (!loginState) {
    await auth.anonymousAuthProvider().signIn();
  }
};

signInAnonymous().catch(error => {
  console.error("Anonymous auth failed", error);
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleCloudBaseError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`CloudBase Error [${operationType}] over ${path}:`, error);
}
