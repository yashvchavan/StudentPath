"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Database,
  RefreshCw,
  Info,
  Download,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AdminShell from "@/components/admin-shell";

interface UploadRecord {
  id: string;
  fileName: string;
  date: string;
  status: "success" | "error" | "processing";
  totalParsed: number;
  inserted: number;
  updated: number;
  skipped: number;
}

export default function ErpManagementPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [erpStats, setErpStats] = useState<{
    total: number;
    registered: number;
    unregistered: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchErpStats();
  }, []);

  const fetchErpStats = async () => {
    try {
      setIsLoadingStats(true);
      // Get college token from localStorage
      const collegeData = JSON.parse(
        localStorage.getItem("collegeData") || "{}"
      );
      const token = collegeData?.token;
      if (!token) return;

      const res = await fetch(`/api/admin/erp/status?token=${token}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setErpStats({
          total: data.totalRecords || 0,
          registered: data.registeredCount || 0,
          unregistered: data.unregisteredCount ?? data.totalRecords ?? 0,
        });
      }
    } catch (e) {
      console.warn("Could not fetch ERP stats:", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const processUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 20MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const recordId = Date.now().toString();
    const pendingRecord: UploadRecord = {
      id: recordId,
      fileName: file.name,
      date: new Date().toISOString(),
      status: "processing",
      totalParsed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
    };
    setUploads((prev) => [pendingRecord, ...prev]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/erp/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploads((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: "success",
                  totalParsed: data.totalParsed,
                  inserted: data.inserted,
                  updated: data.updated,
                  skipped: data.skipped,
                }
              : r
          )
        );

        toast({
          title: "✅ ERP Data Uploaded Successfully",
          description: `${data.inserted} new records added, ${data.updated} updated out of ${data.totalParsed} parsed.`,
        });

        await fetchErpStats();
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: "error" } : r))
      );
      toast({
        title: "Upload Failed",
        description: error.message || "Please check your file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUpload(file);
  };

  return (
    <AdminShell
      title="ERP Student Data"
      description="Upload and manage your college's student ERP data for seamless PRN-based registration."
    >
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-600/30">
                <Database className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Total ERP Records</p>
                <p className="text-2xl font-bold text-white">
                  {isLoadingStats ? (
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  ) : (
                    erpStats?.total ?? 0
                  )}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">Students in ERP database</p>
          </div>

          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-emerald-600/20 rounded-lg flex items-center justify-center border border-emerald-600/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Registered</p>
                <p className="text-2xl font-bold text-white">
                  {isLoadingStats ? (
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  ) : (
                    erpStats?.registered ?? 0
                  )}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">Completed platform registration</p>
          </div>

          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-amber-600/20 rounded-lg flex items-center justify-center border border-amber-600/30">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Pending Registration</p>
                <p className="text-2xl font-bold text-white">
                  {isLoadingStats ? (
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  ) : (
                    erpStats?.unregistered ?? 0
                  )}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">Haven't registered yet</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-400" />
                  Upload ERP Excel Sheet
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  Upload your college's student roster Excel file. New records will be inserted, existing PRNs will be updated.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={fetchErpStats}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Info box */}
            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-300">
                <p className="font-semibold mb-1">Supported ERP Formats</p>
                <p className="text-indigo-400 leading-relaxed">
                  Your Excel should contain student information. The system auto-detects common column names including:
                  <br />
                  <span className="font-mono text-xs bg-indigo-900/40 px-1 py-0.5 rounded mt-1 inline-block">PRN / Roll No / Enrollment No</span>{" "}
                  <span className="font-mono text-xs bg-indigo-900/40 px-1 py-0.5 rounded">Name / First Name / Last Name</span>{" "}
                  <span className="font-mono text-xs bg-indigo-900/40 px-1 py-0.5 rounded">Email</span>{" "}
                  <span className="font-mono text-xs bg-indigo-900/40 px-1 py-0.5 rounded">Branch / Department</span>{" "}
                  <span className="font-mono text-xs bg-indigo-900/40 px-1 py-0.5 rounded">Year</span>{" "}
                  <span className="font-mono text-xs bg-indigo-900/40 px-1 py-0.5 rounded">Phone</span>
                </p>
              </div>
            </div>

            {/* Drop Zone */}
            <label
              htmlFor="erp-file-input"
              className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-950/30 scale-[1.01]"
                  : isUploading
                  ? "border-zinc-700 bg-zinc-900/50 opacity-60 pointer-events-none"
                  : "border-zinc-700 bg-zinc-900/30 hover:border-indigo-500/60 hover:bg-indigo-950/10"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-center px-6">
                {isUploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-base font-semibold text-white">Processing ERP data...</p>
                    <p className="text-sm text-zinc-500 mt-1">Please wait while we parse and store student records</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-600/30 mb-4">
                      <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-base font-semibold text-white mb-1">
                      {isDragging ? "Drop your file here" : "Click to upload or drag & drop"}
                    </p>
                    <p className="text-sm text-zinc-500">Excel (.xlsx, .xls) or CSV • Max 20MB</p>
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-medium border border-indigo-600/30">
                        <Upload className="w-3 h-3" />
                        Select ERP File
                      </span>
                    </div>
                  </>
                )}
              </div>
              <input
                id="erp-file-input"
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                disabled={isUploading}
              />
            </label>
          </CardContent>
        </Card>

        {/* Upload History */}
        {uploads.length > 0 && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-400" />
                Upload History (this session)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">File</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-zinc-400 text-center">Parsed</TableHead>
                    <TableHead className="text-zinc-400 text-center">Inserted</TableHead>
                    <TableHead className="text-zinc-400 text-center">Updated</TableHead>
                    <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id} className="border-zinc-800 hover:bg-zinc-800/30">
                      <TableCell className="font-medium text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{upload.fileName}</span>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {new Date(upload.date).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-zinc-300 font-medium">{upload.totalParsed || '—'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-emerald-400 font-medium">{upload.inserted || '—'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-blue-400 font-medium">{upload.updated || '—'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {upload.status === "success" && (
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                          </Badge>
                        )}
                        {upload.status === "processing" && (
                          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                          </Badge>
                        )}
                        {upload.status === "error" && (
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                            <AlertCircle className="w-3 h-3 mr-1" /> Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Note about PRN registration */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-600/30 flex-shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">How PRN-Based Registration Works</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Once you upload ERP data, students visiting your registration link will be prompted to enter their PRN number first.
              An OTP will be sent to their email address stored in the ERP. After OTP verification, their basic data
              (name, email, branch, year) will be pre-filled automatically — they only need to set up their interests, skills, and goals.
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              ⚡ If no ERP data is uploaded, students will use the standard manual registration form.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
