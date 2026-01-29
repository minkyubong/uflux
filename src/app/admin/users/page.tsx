"use client";

import { useEffect, useState } from "react";
import { Users, Search, MoreVertical, Loader2, Shield, ShieldOff, Wallet, RefreshCw, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  tier: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceAction, setBalanceAction] = useState<"add" | "subtract">("add");
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [newTier, setNewTier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("회원 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !user.is_admin } as never)
        .eq("id", user.id);

      if (error) throw error;

      setUsers(users.map(u =>
        u.id === user.id ? { ...u, is_admin: !u.is_admin } : u
      ));

      toast.success(user.is_admin ? "관리자 권한이 해제되었습니다" : "관리자 권한이 부여되었습니다");
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast.error("권한 변경에 실패했습니다");
    }
  };

  const handleBalanceSubmit = async () => {
    if (!selectedUser || !balanceAmount) return;

    setIsSubmitting(true);
    try {
      const amount = parseInt(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("올바른 금액을 입력하세요");
        return;
      }

      const newBalance = balanceAction === "add"
        ? selectedUser.balance + amount
        : Math.max(0, selectedUser.balance - amount);

      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance } as never)
        .eq("id", selectedUser.id);

      if (error) throw error;

      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, balance: newBalance } : u
      ));

      toast.success(`잔액이 ${balanceAction === "add" ? "추가" : "차감"}되었습니다`);
      setBalanceDialogOpen(false);
      setBalanceAmount("");
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("잔액 변경에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTierSubmit = async () => {
    if (!selectedUser || !newTier) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ tier: newTier } as never)
        .eq("id", selectedUser.id);

      if (error) throw error;

      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, tier: newTier } : u
      ));

      toast.success("등급이 변경되었습니다");
      setTierDialogOpen(false);
    } catch (error) {
      console.error("Error updating tier:", error);
      toast.error("등급 변경에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "enterprise": return "bg-purple-100 text-purple-700 border-purple-200";
      case "premium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "standard": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground">전체 회원: {users.length}명</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 이메일로 검색..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.username || "이름 없음"}</p>
                        {user.is_admin && (
                          <Badge variant="destructive" className="text-xs">관리자</Badge>
                        )}
                        <Badge variant="outline" className={`text-xs ${getTierColor(user.tier)}`}>
                          {user.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(user.balance)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>회원 관리</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setBalanceDialogOpen(true);
                        }}>
                          <Wallet className="h-4 w-4 mr-2" />
                          잔액 조정
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setNewTier(user.tier);
                          setTierDialogOpen(true);
                        }}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          등급 변경
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                          {user.is_admin ? (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              관리자 해제
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              관리자 지정
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Adjustment Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>잔액 조정</DialogTitle>
            <DialogDescription>
              {selectedUser?.username || selectedUser?.email}님의 잔액을 조정합니다.
              <br />
              현재 잔액: {formatCurrency(selectedUser?.balance || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>조정 유형</Label>
              <Select value={balanceAction} onValueChange={(v) => setBalanceAction(v as "add" | "subtract")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">잔액 추가</SelectItem>
                  <SelectItem value="subtract">잔액 차감</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>금액 (원)</Label>
              <Input
                type="number"
                placeholder="금액 입력"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleBalanceSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Change Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>등급 변경</DialogTitle>
            <DialogDescription>
              {selectedUser?.username || selectedUser?.email}님의 등급을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>등급 선택</Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleTierSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

