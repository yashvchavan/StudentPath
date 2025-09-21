"use client"

import { useState } from "react"
import AdminShell from "@/components/admin-shell"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

// Fake program data
interface Program {
  id: number
  name: string
  degree: string
  semesters: number
  credits: number
  department: string
  status: "Active" | "Inactive"
}

const initialPrograms: Program[] = [
  { id: 1, name: "Computer Science", degree: "B.Tech", semesters: 8, credits: 160, department: "Engineering", status: "Active" },
  { id: 2, name: "Mechanical Engineering", degree: "B.Tech", semesters: 8, credits: 160, department: "Engineering", status: "Active" },
  { id: 3, name: "MBA", degree: "Masters", semesters: 4, credits: 80, department: "Management", status: "Inactive" },
  { id: 4, name: "Physics", degree: "B.Sc", semesters: 6, credits: 120, department: "Science", status: "Active" },
]

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newProgram, setNewProgram] = useState<Partial<Program>>({ status: "Active" })

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStatus = (id: number) => {
    setPrograms(prev =>
      prev.map(p =>
        p.id === id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" } : p
      )
    )
  }

  const deleteProgram = (id: number) => {
    if (confirm("Are you sure you want to delete this program?")) {
      setPrograms(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleAddProgram = () => {
    if (!newProgram.name || !newProgram.degree || !newProgram.department) {
      alert("Please fill in all required fields!")
      return
    }

    const nextId = Math.max(...programs.map(p => p.id)) + 1
    setPrograms(prev => [...prev, { id: nextId, ...newProgram } as Program])
    setNewProgram({ status: "Active" })
    setIsDialogOpen(false)
  }

  // Button styles
  const buttonBase = "flex items-center px-3 py-1 rounded-md font-medium transition-colors"
  const primaryBtn = buttonBase + " bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
  const secondaryBtn = buttonBase + " bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  const destructiveBtn = buttonBase + " bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"

  return (
    <AdminShell title="Program Management" description="Define programs, semesters, and degree requirements.">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search programs..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className={primaryBtn} onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Program
        </button>
      </div>

      {/* Programs Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Degree</TableHead>
              <TableHead>Semesters</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrograms.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No programs found.
                </TableCell>
              </TableRow>
            )}
            {filteredPrograms.map(program => (
              <TableRow key={program.id} className="hover:bg-muted/10">
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.degree}</TableCell>
                <TableCell>{program.semesters}</TableCell>
                <TableCell>{program.credits}</TableCell>
                <TableCell>{program.department}</TableCell>
                <TableCell>
                  <Badge
                    variant={program.status === "Active" ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(program.id)}
                  >
                    {program.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <button
                    className={secondaryBtn}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button
                    className={destructiveBtn}
                    onClick={() => deleteProgram(program.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* New Program Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Program</DialogTitle>
            <DialogDescription>
              Fill in the program details to add a new program.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Input
              placeholder="Program Name"
              value={newProgram.name || ""}
              onChange={e => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Degree (e.g., B.Tech, M.Sc, MBA)"
              value={newProgram.degree || ""}
              onChange={e => setNewProgram(prev => ({ ...prev, degree: e.target.value }))}
            />
            <Input
              placeholder="Department"
              value={newProgram.department || ""}
              onChange={e => setNewProgram(prev => ({ ...prev, department: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Semesters"
              value={newProgram.semesters || ""}
              onChange={e => setNewProgram(prev => ({ ...prev, semesters: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="Credits"
              value={newProgram.credits || ""}
              onChange={e => setNewProgram(prev => ({ ...prev, credits: Number(e.target.value) }))}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <button className={secondaryBtn} onClick={() => setIsDialogOpen(false)}>Cancel</button>
            <button className={primaryBtn} onClick={handleAddProgram}>Add Program</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
