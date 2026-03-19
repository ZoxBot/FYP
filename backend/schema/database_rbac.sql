-- Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'Administrator', 'Higher Admin', 'Admin'
    level INTEGER NOT NULL, -- 1 = Highest (Super Admin), 2 = Higher, 3 = Admin
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, -- 'document.view', 'user.ban'
    description TEXT,
    parent_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE, -- For hierarchy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mapping Roles to Permissions
CREATE TABLE IF NOT EXISTS admin_role_permissions (
    role_id INTEGER REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Mapping Users to Roles (Many-to-Many, though usually 1 user = 1 admin role)
CREATE TABLE IF NOT EXISTS admin_user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Direct User Permissions (Overrides/Additions to Role Permissions)
CREATE TABLE IF NOT EXISTS admin_user_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);
