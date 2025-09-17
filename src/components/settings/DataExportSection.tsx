import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {};

const DataExportSection: React.FC<Props> = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function downloadUrl(url: string, filename: string) {
    setLoading(true);
    try {
      // Attach Authorization header from stored token so backend can authenticate
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(url, { credentials: 'include', headers });
      if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Download started', description: filename });
    } catch (err: any) {
      toast({ title: 'Error', description: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleExportLearningHistory() {
    await downloadUrl('/api/v1/export/learning-history', 'learning_history.zip');
  }

  async function handleExportAllFaiss() {
    await downloadUrl('/api/v1/export/student/all/faiss', 'student_faiss_all.zip');
  }

  async function handleExportAllUploads() {
    await downloadUrl('/api/v1/export/student/all/uploads', 'student_uploads_all.zip');
  }

  // Destructive: delete all persisted data for the student (server-side will remove files and DB rows)
  async function doDeleteAllStudentData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch('/api/v1/export/student/all', { method: 'DELETE', credentials: 'include', headers });
      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText || 'Delete failed');
        throw new Error(text || 'Delete failed');
      }
      toast({ title: 'Deleted', description: 'All your persisted data has been removed' });
    } catch (err: any) {
      toast({ title: 'Error', description: String(err) });
    } finally {
      setLoading(false);
    }
  }
  // open a dialog to confirm deletion
  const [deleteOpen, setDeleteOpen] = useState(false);
  function handleDeleteAllStudentData() {
    setDeleteOpen(true);
  }


  return (
    <>
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Data Export & Delete</h2>
        <p className="text-muted-foreground mb-4">Download or remove your learning history, uploaded files, and vector stores used for rag</p>

        <div className="flex flex-col gap-3">
          <Button onClick={handleExportLearningHistory} disabled={loading} className="w-full text-left">Download learning history</Button>
          <Button onClick={handleExportAllFaiss} disabled={loading} className="w-full text-left">Download ALL session FAISS</Button>
          <Button onClick={handleExportAllUploads} disabled={loading} className="w-full text-left">Download ALL uploads</Button>

          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Delete all persisted data (irreversible):</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground mb-3">
              <li>Uploaded files you provided</li>
              <li>FAISS/vector stores generated from your uploads</li>
              <li>Learning history, subjects, chapters, and related metadata</li>
            </ul>
            <p className="text-sm text-muted-foreground mb-3">Please export any data you want to keep before deleting. This action cannot be undone.</p>

            <Button variant="destructive" onClick={handleDeleteAllStudentData} disabled={loading} className="w-full">
              <span className="font-semibold">Delete ALL persisted data</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all persisted data</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="text-sm text-muted-foreground">This will permanently delete your uploads, vector stores, learning history, subjects, chapters, and related metadata. This action cannot be undone. Are you sure?</div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={async () => {
                setDeleteOpen(false);
                await doDeleteAllStudentData();
              }}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataExportSection;
