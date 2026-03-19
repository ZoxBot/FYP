# Test Accounts Reference

Use these accounts to test different roles and permissions in the Kaamko Kura platform.

## 🔑 Administrative Accounts

### Super Admin (Full Access)
- **Email**: `superadmin@kaamkokura.com`
- **Password**: `SuperAdmin123!`
- **Role**: Administrator (RBAC)

### Standard Admin
- **Email**: `admin@example.com`
- **Password**: `adminpassword`
- **Role**: admin

---

## 💼 Marketplace Accounts

### Client (Post Jobs & Pay)
- **Email**: `client@example.com`
- **Password**: `clientpassword`
- **Role**: client

### Freelancer (Bid on Jobs)
- **Email**: `freelancer@example.com`
- **Password**: `password`
- **Role**: freelancer

---

## 📝 Other Existing Accounts (Emails only)
*Note: Check the database for these if you need to reset their passwords.*
- `kumarshahdipak@yahoo.com`
- `willjackscanva754@outlook.com`
- `test@gmail.com`
- `zoxbot1@gmail.com`
- `sanket@gmail.com`

---

> [!TIP]
> All passwords are encrypted with bcrypt in the database. If you forget a password, you can use the `forgot password` flow (if implemented) or run a script to update the `password_hash` directly.
