"use client"

import { useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, Shield, MoreHorizontal, Trash2, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface Admin {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([
    { id: 1, name: "Alice Johnson", email: "alice@college.edu", role: "Super Admin", created_at: "2025-01-15" },
    { id: 2, name: "Bob Smith", email: "bob@college.edu", role: "Editor", created_at: "2025-02-10" },
    { id: 3, name: "Carol Lee", email: "carol@college.edu", role: "Viewer", created_at: "2025-03-05" },
    { id: 4, name: "David Kim", email: "david@college.edu", role: "Editor", created_at: "2025-04-20" },
  ])
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this admin?")) {
      setAdmins((prev) => prev.filter((a) => a.id !== id))
    }
  }

  return (
    <AdminShell title="Admin Users" description="Invite and manage admin accounts.">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Search admins"
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary/80">
          <UserPlus className="w-4 h-4" />
          Invite Admin
        </Button>
      </div>

      {/* Admin Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-sm">
                      <Shield className="w-3 h-3" />
                      {admin.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
