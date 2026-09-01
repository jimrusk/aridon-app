import { NextRequest, NextResponse } from 'next/server';
import { googleJson, googleWorkspaceAccessToken, listDriveFiles, readWorkspaceFile, type DriveFile } from '../../../../../lib/googleWorkspace';
import { auditExecutiveAction, connectedExecutiveActor, recommendExecutive } from '../../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const accessToken = await googleWorkspaceAccessToken(request);
    const fileId = (request.nextUrl.searchParams.get('fileId') || '').trim();
    const actor = connectedExecutiveActor(request);

    if (fileId) {
      const file = await googleJson<DriveFile>(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,size`,
        accessToken,
      );
      const content = await readWorkspaceFile(accessToken, file);
      const route = recommendExecutive({ filename: file.name, body: 'text' in content ? String(content.text || '') : JSON.stringify(content).slice(0, 12000) });
      await auditExecutiveAction({ actorEmail: actor.email, executive: route.executive, action: 'file_read', channel: 'google_drive', target: file.name, metadata: { fileId: file.id, mimeType: file.mimeType } });
      return NextResponse.json({ connected: true, file: content, recommendedExecutive: route }, { headers: NO_STORE });
    }

    const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 200);
    const files = await listDriveFiles(accessToken, query, 75);
    await auditExecutiveAction({ actorEmail: actor.email, action: 'files_search', channel: 'google_drive', metadata: { query, count: files.length } });
    return NextResponse.json({ connected: true, query, files }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ connected: false, files: [], error: error instanceof Error ? error.message : 'Unable to read Google Drive.' }, { status: 500, headers: NO_STORE });
  }
}
