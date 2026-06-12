import { registerModule } from './index'

export function registerAllModules(): void {
  registerModule({
    id: 'accounts',
    name: 'Accounts',
    icon: '💰',
    loadScreen: () => import('../../modules/accounts/ui/AccountsScreen').then((m) => ({ default: m.AccountsScreen })),
  })

  registerModule({
    id: 'coach-upload',
    name: 'Coach Upload',
    icon: '🎥',
    loadScreen: () => import('../../modules/coach-upload/ui/CoachUploadScreen').then((m) => ({ default: m.CoachUploadScreen })),
  })

  registerModule({
    id: 'upload-drive',
    name: 'Upload Drive',
    icon: '☁️',
    loadScreen: () => import('../../modules/upload-drive/ui/UploadDriveScreen').then((m) => ({ default: m.UploadDriveScreen })),
  })
}
