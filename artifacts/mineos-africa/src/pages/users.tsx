import { useState } from "react";
import { useListUsers, useCreateUser, useDeleteUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Users as UsersIcon, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const roleColors: Record<string, string> = {
  admin: "bg-red-900/30 text-red-400 border-red-800/30",
  engineer: "bg-blue-900/30 text-blue-400 border-blue-800/30",
  topographer: "bg-green-900/30 text-green-400 border-green-800/30",
  geologist: "bg-purple-900/30 text-purple-400 border-purple-800/30",
  manager: "bg-amber-900/30 text-amber-400 border-amber-800/30",
};

const roleInitials: Record<string, string> = {
  admin: "AD",
  engineer: "EN",
  topographer: "TO",
  geologist: "GE",
  manager: "MG",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function NewUserDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "engineer" as const,
    status: "active" as const,
  });
  const qc = useQueryClient();
  const createUser = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync({
      data: { ...form, projectIds: [] },
    });
    qc.invalidateQueries({ queryKey: ["/api/users"] });
    setOpen(false);
    setForm({ name: "", email: "", role: "engineer", status: "active" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono text-xs"><Plus className="h-4 w-4" />New User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-mono">Add User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="topographer">Topographer</SelectItem>
                  <SelectItem value="geologist">Geologist</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Adding..." : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const [search, setSearch] = useState("");
  const { data: users } = useListUsers();
  const usersAny = users as unknown as {
    data?: Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      status: string;
    }>;
  } | undefined;
  const userRows = Array.isArray(users)
    ? users
    : Array.isArray(usersAny?.data)
      ? usersAny.data
      : [];
  const qc = useQueryClient();
  const deleteUser = useDeleteUser();

  const filtered = userRows.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleGroups = ["admin", "manager", "engineer", "topographer", "geologist"];

  const handleDelete = async (id: number) => {
    if (confirm("Remove this user?")) {
      await deleteUser.mutateAsync({ id });
      qc.invalidateQueries({ queryKey: ["/api/users"] });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {userRows.filter((u) => u.status === "active").length} active · {userRows.length} total
          </p>
        </div>
        <NewUserDialog />
      </div>

      <div className="mb-5">
        <Input placeholder="Search users by name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <motion.div initial="hidden" animate="show" variants={container} className="space-y-2">
        {filtered.map((user) => (
          <motion.div key={user.id} variants={item}
            className="group bg-card border border-border rounded-lg px-5 py-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 ${roleColors[user.role].replace("border-", "").replace(/\/\d+/g, "")}`}>
                {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${roleColors[user.role]}`}>
                {user.role}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                user.status === "active"
                  ? "bg-green-900/20 text-green-400 border-green-800/20"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {user.status}
              </span>
              <button onClick={() => handleDelete(user.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <UsersIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </motion.div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {roleGroups.map((role) => {
          const count = userRows.filter((u) => u.role === role).length;
          return (
            <div key={role} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono">{count}</p>
              <p className={`text-[10px] font-mono uppercase mt-1 ${roleColors[role].split(" ")[1]}`}>{role}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
