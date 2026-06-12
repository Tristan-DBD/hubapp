import { driveService } from '../../../core/google/drive-service'

export const folderPathService = {
  async ensurePath(block: number, week: number, session: number): Promise<{
    blockFolderId: string;
    sessionFolderId: string;
    weekFolderId: string;
  }> {
    const coachingFolderId = await driveService.findOrCreateFolder('Coaching', 'root')
    const blockName = `Bloc ${block}`
    const blockFolderId = await driveService.findOrCreateFolder(blockName, coachingFolderId)
    const weekName = `Semaine ${week}`
    const weekFolderId = await driveService.findOrCreateFolder(weekName, blockFolderId)
    const sessionName = `Séance ${session}`
    const sessionFolderId = await driveService.findOrCreateFolder(sessionName, weekFolderId)

    return { blockFolderId, weekFolderId, sessionFolderId }
  },
}
