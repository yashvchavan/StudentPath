"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2,
    Download,
    Building2,
    Globe,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AdminShell from "@/components/admin-shell";

// Types for our upload history
interface UploadRecord {
    id: string;
    fileName: string;
    type: "on-campus" | "off-campus";
    date: string;
    status: "success" | "error" | "processing";
    recordsProcessed: number;
}

export default function AdminPlacementsPage() {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("on-campus");

    // Mock upload history for now - ideally fetch from DB api/admin/placements/history
    const [uploads, setUploads] = useState<UploadRecord[]>([]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "on-campus" | "off-campus") => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            "text/csv", // .csv
            "application/pdf", // .pdf (for off-campus docs)
        ];

        if (type === "on-campus" && !file.name.match(/\.(xlsx|xls|csv)$/)) {
            toast({
                title: "Invalid file type",
                description: "Please upload an Excel or CSV file for on-campus drives.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);

            const response = await fetch("/api/admin/placements/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Upload Successful",
                    description: `Successfully uploaded ${file.name}. ${data.recordsInserted} records inserted.`,
                });

                // Add to history
                const newRecord: UploadRecord = {
                    id: Date.now().toString(),
                    fileName: file.name,
                    type,
                    date: new Date().toISOString(),
                    status: "success",
                    recordsProcessed: data.recordsInserted || 0,
                };
                setUploads([newRecord, ...uploads]);
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload Failed",
                description: "There was an error processing your file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    return (
        <AdminShell title="Placement Management" description="Upload and manage on-campus drives and off-campus opportunities.">
            <div className="p-8 space-y-8 animate-fade-in">
                <div className="flex items-center justify-end">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Download Template
                    </Button>
                </div>

                <Tabs defaultValue="on-campus" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="on-campus" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> On-Campus
                        </TabsTrigger>
                        <TabsTrigger value="off-campus" className="flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Off-Campus
                        </TabsTrigger>
                    </TabsList>

                    {/* ── On-Campus Upload ───────────────────────────────────────── */}
                    <TabsContent value="on-campus" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload On-Campus Drives</CardTitle>
                                <CardDescription>
                                    Upload an Excel sheet containing upcoming campus placement drives details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="on-campus-file"
                                        className={`
                    flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors
                    ${isUploading ? "opacity-50 pointer-events-none" : "border-muted-foreground/25 hover:border-primary/50"}
                  `}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isUploading ? (
                                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                            ) : (
                                                <FileSpreadsheet className="w-10 h-10 text-muted-foreground mb-3" />
                                            )}
                                            <p className="mb-2 text-sm text-foreground font-medium">
                                                {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                XLSX, XLS or CSV (MAX. 10MB)
                                            </p>
                                        </div>
                                        <input
                                            id="on-campus-file"
                                            type="file"
                                            className="hidden"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(e) => handleFileUpload(e, "on-campus")}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Off-Campus Upload ──────────────────────────────────────── */}
                    <TabsContent value="off-campus" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload Off-Campus Opportunities</CardTitle>
                                <CardDescription>
                                    Upload documents (PDF/Doc) or lists of off-campus opportunities.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="off-campus-file"
                                        className={`
                    flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors
                    ${isUploading ? "opacity-50 pointer-events-none" : "border-muted-foreground/25 hover:border-primary/50"}
                  `}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isUploading ? (
                                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                            ) : (
                                                <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                                            )}
                                            <p className="mb-2 text-sm text-foreground font-medium">
                                                {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PDF, DOCX or Excel Lists (MAX. 10MB)
                                            </p>
                                        </div>
                                        <input
                                            id="off-campus-file"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                                            onChange={(e) => handleFileUpload(e, "off-campus")}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* ── Recent Uploads Table ───────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Uploads</CardTitle>
                        <CardDescription>History of uploaded files and their processing status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploads.map((upload) => (
                                    <TableRow key={upload.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {upload.type === "on-campus" ? (
                                                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-blue-500" />
                                            )}
                                            {upload.fileName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{upload.type === "on-campus" ? "On-Campus" : "Off-Campus"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(upload.date).toLocaleDateString()} {new Date(upload.date).toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {upload.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                {upload.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                                {upload.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                                                <span className="capitalize">{upload.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminShell>
    );
}
