import { registerModule } from './index'

function wrapImport<T>(loader: () => Promise<{ default: T }>): () => Promise<{ default: T }> {
  return async () => {
    try {
      return await loader()
    } catch (err) {
      console.error('Module load failed:', err)
      return { default: (() => null) as unknown as T }
    }
  }
}

export function registerAllModules(): void {
  registerModule({
    id: 'accounts',
    name: 'Accounts',
    icon: '💰',
    loadScreen: wrapImport(() =>
      import('../../modules/accounts/ui/AccountsScreen').then(m => ({
        default: m.AccountsScreen,
      }))),
  })

  registerModule({
    id: 'task',
    name: 'Task',
    icon: '📋',
    loadScreen: wrapImport(() =>
      import('../../modules/task/ui/TaskScreen').then(m => ({
        default: m.TaskScreen,
      }))),
  })

  registerModule({
    id: 'coach-upload',
    name: 'Coach Upload',
    icon: '🎥',
    loadScreen: wrapImport(() =>
      import('../../modules/coach-upload/ui/CoachUploadScreen').then(m => ({
        default: m.CoachUploadScreen,
      }))),
  })

  registerModule({
    id: 'upload-drive',
    name: 'Upload Drive',
    icon: '☁️',
    loadScreen: wrapImport(() =>
      import('../../modules/upload-drive/ui/UploadDriveScreen').then(m => ({
        default: m.UploadDriveScreen,
      }))),
  })
}
