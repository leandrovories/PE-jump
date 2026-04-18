import cloudbase from '@cloudbase/js-sdk';

export const app = cloudbase.init({
  env: (import.meta as any).env.VITE_CLOUDBASE_ENV_ID || 'peclass-d1gxoyjin67a08c55'
});

export const auth = app.auth({
  persistence: 'local'
});

export const db = app.database();

let signInPromise: Promise<void> | null = null;

export const signInAnonymous = async () => {
  if (signInPromise) return signInPromise;
  
  signInPromise = (async () => {
    try {
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.anonymousAuthProvider().signIn();
      }
    } catch (e) {
      signInPromise = null; // reset if fails
      throw e;
    }
  })();
  
  return signInPromise;
};

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
