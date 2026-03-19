export type UserData = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string; // Display role
    user_role: string; // Base role from users table
    is_verified: boolean;
    is_banned: boolean;
    created_at: string;
};

export type JobData = {
    id: number;
    title: string;
    description: string;
    budget: string;
    status: string;
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
};

export type RoleData = {
    id: number;
    name: string;
    level: number;
    description: string;
};

export type PermissionData = {
    id: number;
    slug: string;
    description: string;
    parent_id: number | null;
};

export type VerificationRequest = {
    id: number;
    user_id: number;
    document_path: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
};

export type Stats = {
    users: number;
    freelancers: number;
    clients: number;
    jobs: number;
    pending_jobs: number;
};

export type GroupData = {
    id: number;
    name: string;
    description: string;
    created_at: string;
};
