import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { UserManagement } from "@/components/user-management";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin";

  // Fetch users
  const { 
    data: users = [], 
    isLoading 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: true // Fetch for all users
  });

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="bg-red-100 text-red-800 p-6 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p>Você não tem permissão para acessar esta página. Esta área é restrita a administradores.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      ) : (
        <UserManagement users={users} />
      )}
    </DashboardLayout>
  );
}