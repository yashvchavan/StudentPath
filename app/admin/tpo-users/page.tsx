"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  UserPlus,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Loader2,
  Search,
  Copy,
  Clock,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface TpoUser {
  id: number;
  email: string;
  name: string;
  designation: string | null;
  departmentId: number | null;
  departmentName: string | null;
  departmentCode: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PendingInvite {
  id: number;
  email: string;
  name: string;
  designation: string | null;
  departmentId: number | null;
  departmentName: string | null;
  departmentCode: string | null;
  permissions: string[];
  expiresAt: string;
  createdAt: string;
}

interface Permission {
  key: string;
  value: string;
  label: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function TpoUsersPage() {
  const [tpoUsers, setTpoUsers] = useState<TpoUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TpoUser | null>(null);
  const [fallbackInviteUrl, setFallbackInviteUrl] = useState<string | null>(null);
  const [resendInviteId, setResendInviteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    designation: "",
    departmentId: "",
    permissions: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tpoRes, deptRes] = await Promise.all([
        fetch("/api/admin/tpo-users", { credentials: "include" }),
        fetch("/api/admin/departments", { credentials: "include" }),
      ]);

      const tpoData = await tpoRes.json();
      const deptData = await deptRes.json();

      if (tpoData.success) {
        setTpoUsers(tpoData.tpoUsers);
        setPendingInvites(tpoData.pendingInvites);
        setAvailablePermissions(tpoData.availablePermissions);
      }

      if (deptData.success) {
        setDepartments(deptData.departments);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      toast.error("Email and name are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/tpo-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.emailSent === false && data.invite?.inviteUrl) {
          toast.warning(data.message || "Invite created but email delivery failed");
          setFallbackInviteUrl(data.invite.inviteUrl);
          toast.info(
            <div className="flex flex-col gap-2">
              <span>Fallback invite link:</span>
              <code className="text-xs bg-zinc-800 p-2 rounded break-all">
                {data.invite.inviteUrl}
              </code>
            </div>,
            { duration: 12000 }
          );
          fetchData();
        } else {
          toast.success(data.message || "Invite email sent successfully");
          setIsInviteDialogOpen(false);
          resetForm();
          setFallbackInviteUrl(null);
          fetchData();
        }
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tpo-users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          designation: formData.designation || null,
          departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
          permissions: formData.permissions,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("TPO user updated successfully");
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || "Failed to update TPO user");
      }
    } catch (error) {
      console.error("Error updating TPO user:", error);
      toast.error("Failed to update TPO user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tpo-users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "TPO user deactivated");
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to deactivate TPO user");
      }
    } catch (error) {
      console.error("Error deactivating TPO user:", error);
      toast.error("Failed to deactivate TPO user");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      designation: "",
      departmentId: "",
      permissions: availablePermissions
        .filter((p) => ["view_students", "manage_placements", "manage_internships", "view_analytics"].includes(p.value))
        .map((p) => p.value),
    });
  };

  const openEditDialog = (user: TpoUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      designation: user.designation || "",
      departmentId: user.departmentId?.toString() || "",
      permissions: user.permissions,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: TpoUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const copyFallbackLink = async () => {
    if (!fallbackInviteUrl) return;
    try {
      await navigator.clipboard.writeText(fallbackInviteUrl);
      toast.success("Fallback invite link copied");
    } catch {
      toast.error("Failed to copy fallback link");
    }
  };

  const handleResendInvite = async (inviteId: number) => {
    try {
      setResendInviteId(inviteId);
      const res = await fetch("/api/admin/tpo-users/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inviteId }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.emailSent === false && data.invite?.inviteUrl) {
          setFallbackInviteUrl(data.invite.inviteUrl);
          toast.warning(data.message || "Resend failed; use fallback link");
          toast.info(
            <div className="flex flex-col gap-2">
              <span>Fallback invite link:</span>
              <code className="text-xs bg-zinc-800 p-2 rounded break-all">
                {data.invite.inviteUrl}
              </code>
            </div>,
            { duration: 12000 }
          );
        } else {
          toast.success(data.message || "Invite email resent successfully");
          setFallbackInviteUrl(null);
        }
      } else {
        toast.error(data.error || "Failed to resend invite");
      }
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("Failed to resend invite");
    } finally {
      setResendInviteId(null);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  // Filter users by search
  const filteredUsers = tpoUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = pendingInvites.filter(
    (invite) =>
      invite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invite.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell title="TPO Users" description="Manage departmental TPO users and send invites">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tpoUsers.length}</p>
                <p className="text-xs text-zinc-400">Total TPO Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {tpoUsers.filter((u) => u.isActive).length}
                </p>
                <p className="text-xs text-zinc-400">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingInvites.length}</p>
                <p className="text-xs text-zinc-400">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search TPO users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-700 text-white"
          />
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                resetForm();
                setFallbackInviteUrl(null);
                setIsInviteDialogOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite TPO User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Invite Departmental TPO</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Send an invite to a new TPO user. They will receive a link to set their password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. john@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="e.g. Assistant TPO"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  {availablePermissions.map((perm) => (
                    <div key={perm.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.value}
                        checked={formData.permissions.includes(perm.value)}
                        onCheckedChange={() => togglePermission(perm.value)}
                      />
                      <label
                        htmlFor={perm.value}
                        className="text-sm text-zinc-300 cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {fallbackInviteUrl && (
                <div className="space-y-2 rounded-lg border border-amber-700/50 bg-amber-950/30 p-3">
                  <p className="text-sm text-amber-300">
                    Email delivery failed. Share this invite link manually:
                  </p>
                  <code className="block text-xs bg-zinc-950 p-2 rounded break-all text-zinc-200">
                    {fallbackInviteUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-600 text-amber-300 hover:bg-amber-900/30"
                    onClick={copyFallbackLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Fallback Link
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsInviteDialogOpen(false);
                  setFallbackInviteUrl(null);
                }}
                className="border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-zinc-900 border-zinc-800">
          <TabsTrigger value="users" className="data-[state=active]:bg-zinc-800">
            Active Users ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="invites" className="data-[state=active]:bg-zinc-800">
            Pending Invites ({filteredInvites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">
                    {searchQuery ? "No users found matching your search" : "No TPO users yet"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Email</TableHead>
                      <TableHead className="text-zinc-400">Department</TableHead>
                      <TableHead className="text-zinc-400">Permissions</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-zinc-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                              <span className="text-sm text-purple-400 font-medium">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              {user.designation && (
                                <p className="text-xs text-zinc-500">{user.designation}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-400">{user.email}</TableCell>
                        <TableCell>
                          {user.departmentName ? (
                            <Badge variant="outline" className="border-zinc-700">
                              {user.departmentCode}
                            </Badge>
                          ) : (
                            <span className="text-zinc-600 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 2).map((perm) => (
                              <Badge
                                key={perm}
                                variant="secondary"
                                className="text-xs bg-zinc-800 text-zinc-300"
                              >
                                {perm.replace(/_/g, " ")}
                              </Badge>
                            ))}
                            {user.permissions.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-zinc-800">
                                +{user.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.isActive
                                ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                                : "bg-red-600/20 text-red-400 border-red-600/30"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(user)}
                                className="cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(user)}
                                className="cursor-pointer text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              {filteredInvites.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  <p className="text-zinc-400">No pending invites</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Email</TableHead>
                      <TableHead className="text-zinc-400">Department</TableHead>
                      <TableHead className="text-zinc-400">Expires</TableHead>
                      <TableHead className="text-zinc-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvites.map((invite) => (
                      <TableRow key={invite.id} className="border-zinc-800">
                        <TableCell className="font-medium text-white">{invite.name}</TableCell>
                        <TableCell className="text-zinc-400">{invite.email}</TableCell>
                        <TableCell>
                          {invite.departmentName ? (
                            <Badge variant="outline" className="border-zinc-700">
                              {invite.departmentCode}
                            </Badge>
                          ) : (
                            <span className="text-zinc-600 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-zinc-700"
                            onClick={() => handleResendInvite(invite.id)}
                            disabled={resendInviteId === invite.id}
                          >
                            {resendInviteId === invite.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Mail className="w-4 h-4 mr-2" />
                            )}
                            Resend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit TPO User</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update TPO user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-designation">Designation</Label>
                <Input
                  id="edit-designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                {availablePermissions.map((perm) => (
                  <div key={perm.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${perm.value}`}
                      checked={formData.permissions.includes(perm.value)}
                      onCheckedChange={() => togglePermission(perm.value)}
                    />
                    <label
                      htmlFor={`edit-${perm.value}`}
                      className="text-sm text-zinc-300 cursor-pointer"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate TPO User?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will deactivate "{selectedUser?.name}" and they will no longer be able to access
              the admin panel. This action can be undone later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
