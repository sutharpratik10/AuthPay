# 📚 AuthPay Documentation

Welcome to the comprehensive documentation for the AuthPay application - a production-ready Next.js authentication and payment processing platform with advanced Role-Based Access Control (RBAC).

---

## 📖 Core Documentation (New)

Complete, modern documentation covering all aspects of AuthPay:

| Document | Description | Audience |
|----------|-------------|----------|
| [**01-OVERVIEW.md**](./01-OVERVIEW.md) | 🏗️ Project overview, architecture, tech stack | All developers |
| [**02-AUTHENTICATION.md**](./02-AUTHENTICATION.md) | 🔐 Authentication system, NextAuth, OAuth | Backend developers |
| [**03-RBAC.md**](./03-RBAC.md) | 🛡️ Role-Based Access Control system | All developers |
| [**04-DATABASE.md**](./04-DATABASE.md) | 🗄️ Database schema, migrations, Drizzle ORM | Backend developers |
| [**05-API-ROUTES.md**](./05-API-ROUTES.md) | 🌐 Complete API reference | Frontend & Backend |
| [**06-ROUTING.md**](./06-ROUTING.md) | 🧭 Routing system and navigation | Frontend developers |

---

## 🎯 Policy-Based RBAC System (Legacy)

Original RBAC documentation - still relevant and comprehensive:

| Document | Description | When to Read |
|----------|-------------|--------------|
| [**RBAC-OVERVIEW.md**](./RBAC-OVERVIEW.md) | 🌟 Start here! High-level overview | First time learning about RBAC |
| [**RBAC-SETUP.md**](./RBAC-SETUP.md) | ⚡ Quick setup guide (3 steps) | Ready to implement |
| [**RBAC-GUIDE.md**](./RBAC-GUIDE.md) | 📖 Complete usage guide | Need detailed documentation |
| [**RBAC-SUMMARY.md**](./RBAC-SUMMARY.md) | 📊 Implementation details | Want to understand internals |
| [**RBAC-CHECKLIST.md**](./RBAC-CHECKLIST.md) | ✅ Testing checklist | Verifying your setup |
| [**RBAC-DEPLOYMENT-GUIDE.md**](./RBAC-DEPLOYMENT-GUIDE.md) | 🚀 Deployment guide | Deploying to production |
| [**CENTRALIZED-ROUTING.md**](./CENTRALIZED-ROUTING.md) | 🧭 Routing system (legacy) | Understanding routes |


---

## 🚀 Quick Start Guide

### For New Developers

**Day 1: Understanding the System**
1. Read [01-OVERVIEW.md](./01-OVERVIEW.md) - Architecture overview (15 min)
2. Read [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) - Auth system (20 min)
3. Read [03-RBAC.md](./03-RBAC.md) - Permission system (25 min)

**Day 2: Setting Up**
1. Follow setup in [01-OVERVIEW.md](./01-OVERVIEW.md#getting-started)
2. Run migrations: [04-DATABASE.md](./04-DATABASE.md#migrations)
3. Seed RBAC: [RBAC-SETUP.md](./RBAC-SETUP.md)

**Day 3: Development**
1. API reference: [05-API-ROUTES.md](./05-API-ROUTES.md)
2. Routing patterns: [06-ROUTING.md](./06-ROUTING.md)
3. Review examples in `src/app/api/examples/`

### For Experienced Developers

**Quick Reference**:
- **Architecture**: [01-OVERVIEW.md](./01-OVERVIEW.md#architecture)
- **API Docs**: [05-API-ROUTES.md](./05-API-ROUTES.md)
- **Database Schema**: [04-DATABASE.md](./04-DATABASE.md#core-tables)
- **RBAC APIs**: [03-RBAC.md](./03-RBAC.md#admin-apis)

---

## 📖 Documentation by Role

### 👨‍💼 Project Managers / Product Owners
Start here to understand what AuthPay can do:
1. [01-OVERVIEW.md](./01-OVERVIEW.md) - Features and capabilities
2. [RBAC-OVERVIEW.md](./RBAC-OVERVIEW.md) - Permission system benefits

### 👨‍💻 Frontend Developers
Focus on UI and navigation:
1. [06-ROUTING.md](./06-ROUTING.md) - Navigation system
2. [05-API-ROUTES.md](./05-API-ROUTES.md) - API consumption
3. [03-RBAC.md](./03-RBAC.md#usage-examples) - Policy-based UI

### 👨‍💻 Backend Developers
Deep dive into server-side:
1. [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) - Auth implementation
2. [03-RBAC.md](./03-RBAC.md) - RBAC system
3. [04-DATABASE.md](./04-DATABASE.md) - Database design
4. [05-API-ROUTES.md](./05-API-ROUTES.md) - API development

### 🚀 DevOps Engineers
Deployment and infrastructure:
1. [RBAC-DEPLOYMENT-GUIDE.md](./RBAC-DEPLOYMENT-GUIDE.md) - Deployment checklist
2. [04-DATABASE.md](./04-DATABASE.md#migrations) - Migration strategy
3. [01-OVERVIEW.md](./01-OVERVIEW.md#deployment) - Environment setup

---

## 🎓 Learning Paths

### Path 1: RBAC Focused (Legacy Docs)
Perfect if you're specifically interested in the permission system:

1. ⭐ [RBAC-OVERVIEW.md](./RBAC-OVERVIEW.md) - Concept (5 min)
2. ⚡ [RBAC-SETUP.md](./RBAC-SETUP.md) - Setup (10 min)
3. 📖 [RBAC-GUIDE.md](./RBAC-GUIDE.md) - Usage (15 min)
4. ✅ [RBAC-CHECKLIST.md](./RBAC-CHECKLIST.md) - Verify (5 min)

**Total: ~35 minutes to working RBAC!**

### Path 2: Full Stack (New Docs)
Complete understanding of the entire application:

1. 🏗️ [01-OVERVIEW.md](./01-OVERVIEW.md) - Big picture (15 min)
2. 🔐 [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) - Auth (20 min)
3. 🛡️ [03-RBAC.md](./03-RBAC.md) - Permissions (25 min)
4. 🗄️ [04-DATABASE.md](./04-DATABASE.md) - Database (20 min)
5. 🌐 [05-API-ROUTES.md](./05-API-ROUTES.md) - APIs (15 min)
6. 🧭 [06-ROUTING.md](./06-ROUTING.md) - Navigation (10 min)

**Total: ~105 minutes for complete understanding**

### Path 3: Quick Setup
Just want to get started quickly:

1. Clone repository
2. Follow [RBAC-SETUP.md](./RBAC-SETUP.md) (10 min)
3. Read [05-API-ROUTES.md](./05-API-ROUTES.md) for API usage (15 min)
4. Start building!

---

## 📋 Documentation by Topic

### Authentication & Security
- **Auth Flow**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#authentication-flow)
- **OAuth Setup**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#oauth-authentication)
- **Password Security**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#security-features)
- **Session Management**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#session-management)

### Authorization & Permissions
- **RBAC Overview**: [03-RBAC.md](./03-RBAC.md#overview)
- **Policies**: [03-RBAC.md](./03-RBAC.md#policies)
- **Roles**: [03-RBAC.md](./03-RBAC.md#roles)
- **Middleware**: [03-RBAC.md](./03-RBAC.md#middleware-protection)
- **API Protection**: [03-RBAC.md](./03-RBAC.md#api-protection)

### Database
- **Schema**: [04-DATABASE.md](./04-DATABASE.md#core-tables)
- **Migrations**: [04-DATABASE.md](./04-DATABASE.md#migrations)
- **Queries**: [04-DATABASE.md](./04-DATABASE.md#queries--operations)
- **Drizzle ORM**: [04-DATABASE.md](./04-DATABASE.md#database-technology)

### API Development
- **REST APIs**: [05-API-ROUTES.md](./05-API-ROUTES.md)
- **Auth APIs**: [05-API-ROUTES.md](./05-API-ROUTES.md#authentication-apis)
- **RBAC APIs**: [05-API-ROUTES.md](./05-API-ROUTES.md#rbac-apis)
- **Error Handling**: [05-API-ROUTES.md](./05-API-ROUTES.md#error-handling)

### Routing & Navigation
- **Route Config**: [06-ROUTING.md](./06-ROUTING.md#route-configuration)
- **Dynamic Routes**: [06-ROUTING.md](./06-ROUTING.md#dynamic-routing)
- **Middleware**: [06-ROUTING.md](./06-ROUTING.md#middleware-protection)
- **Navigation**: [06-ROUTING.md](./06-ROUTING.md#navigation-components)

---

## 💡 Common Tasks & Examples

### Protect an API Route
```typescript
import { requirePolicy, POLICIES } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const authCheck = await requirePolicy(req, POLICIES.CONTENT_CREATE);
  if (!authCheck.authorized) return authCheck.response;
  
  // Your logic here
}
```
📖 See: [05-API-ROUTES.md](./05-API-ROUTES.md#example-protected-api-route)

### Dynamic Navigation
```typescript
import { ROUTES } from '@/routes/routeUtils';

const dashboardUrl = await getDashboardUrl(userId);
router.push(dashboardUrl); // Admin or user dashboard
```
📖 See: [06-ROUTING.md](./06-ROUTING.md#dynamic-routing)

### Check User Permission
```typescript
import { RBACService } from '@/lib/rbac/rbac-service';

const canEdit = await RBACService.hasPolicy(userId, 'content:edit');
if (canEdit) {
  // Show edit button
}
```
📖 See: [03-RBAC.md](./03-RBAC.md#rbac-service)

### Create New Policy
```bash
POST /api/rbac/policies/create
{
  "name": "blog:publish",
  "description": "Publish blog posts",
  "category": "blog"
}
```
📖 See: [05-API-ROUTES.md](./05-API-ROUTES.md#create-policy)

---

## 🔍 Finding What You Need

### I want to...

| Task | Go to |
|------|-------|
| Understand the overall architecture | [01-OVERVIEW.md](./01-OVERVIEW.md) |
| Set up authentication | [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) |
| Implement permissions | [03-RBAC.md](./03-RBAC.md) or [RBAC-SETUP.md](./RBAC-SETUP.md) |
| Work with the database | [04-DATABASE.md](./04-DATABASE.md) |
| Build API endpoints | [05-API-ROUTES.md](./05-API-ROUTES.md) |
| Add new routes | [06-ROUTING.md](./06-ROUTING.md) |
| Deploy the application | [RBAC-DEPLOYMENT-GUIDE.md](./RBAC-DEPLOYMENT-GUIDE.md) |
| Test the system | [RBAC-CHECKLIST.md](./RBAC-CHECKLIST.md) |

### I'm looking for...

| Information | Document | Section |
|-------------|----------|---------|
| Tech stack | [01-OVERVIEW.md](./01-OVERVIEW.md) | Technology Stack |
| Login flow | [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) | Authentication Flow |
| Password reset | [02-AUTHENTICATION.md](./02-AUTHENTICATION.md) | Password Reset |
| Policy format | [03-RBAC.md](./03-RBAC.md) | Policies |
| Database tables | [04-DATABASE.md](./04-DATABASE.md) | Core Tables |
| API endpoints | [05-API-ROUTES.md](./05-API-ROUTES.md) | API Structure |
| Route protection | [06-ROUTING.md](./06-ROUTING.md) | Middleware Protection |

---

## 🛠️ Tools & Resources

### Development Tools
- **Drizzle Studio**: `npm run db:studio` - Visual database browser
- **Type Safety**: Full TypeScript coverage
- **Testing**: Jest + React Testing Library
- **API Testing**: Built-in examples

### Useful Scripts
```bash
# Database
npm run db:generate      # Generate migration
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio

# RBAC
npx tsx scripts/seed-rbac.ts           # Seed RBAC data
npx tsx scripts/test-rbac-system.ts    # Test RBAC
npx tsx scripts/migrate-rbac.ts        # RBAC migration

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
```

### Example Code Locations
- API Examples: `src/app/api/examples/`
- Components: `src/components/`
- RBAC Service: `src/lib/rbac/`
- Scripts: `scripts/`

---

## 🆘 Troubleshooting

### Setup Issues
**Problem**: Database connection fails  
**Solution**: Check `DATABASE_URL` in `.env.local`  
**Reference**: [04-DATABASE.md](./04-DATABASE.md#troubleshooting)

**Problem**: Migration errors  
**Solution**: Drop and recreate database (dev only)  
**Reference**: [04-DATABASE.md](./04-DATABASE.md#migrations)

### Authentication Issues
**Problem**: Can't log in  
**Solution**: Check email verification status  
**Reference**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#troubleshooting)

**Problem**: OAuth not working  
**Solution**: Verify callback URLs in provider console  
**Reference**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#oauth-authentication)

### Permission Issues
**Problem**: User denied access  
**Solution**: Check user's policies and clear cache  
**Reference**: [03-RBAC.md](./03-RBAC.md#troubleshooting)

**Problem**: Admin can't access everything  
**Solution**: Verify Admin role has `admin:full` policy  
**Reference**: [03-RBAC.md](./03-RBAC.md#admin-override)

### Route Issues
**Problem**: Infinite redirect loop  
**Solution**: Ensure redirect targets are public routes  
**Reference**: [06-ROUTING.md](./06-ROUTING.md#troubleshooting)

---

## 📊 Architecture Diagrams

Visual representations of system components:

- **System Architecture**: [01-OVERVIEW.md](./01-OVERVIEW.md#architecture)
- **Auth Flow**: [02-AUTHENTICATION.md](./02-AUTHENTICATION.md#authentication-flow)
- **RBAC Flow**: [03-RBAC.md](./03-RBAC.md#architecture)
- **Database ER Diagram**: [04-DATABASE.md](./04-DATABASE.md#relationships)
- **API Structure**: [05-API-ROUTES.md](./05-API-ROUTES.md#api-structure)
- **Route Flow**: [06-ROUTING.md](./06-ROUTING.md#middleware-protection)

---

## 🤝 Contributing

When contributing to AuthPay:

1. **Read Documentation**: Understand existing patterns
2. **Follow Standards**: Use TypeScript, ESLint rules
3. **Add Tests**: Write tests for new features
4. **Update Docs**: Keep documentation current
5. **Use Patterns**: Follow existing code patterns

**Code Review Checklist**:
- [ ] TypeScript types defined
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] RBAC policies considered
- [ ] Error handling implemented

---

## 📞 Support & Resources

### Getting Help
1. Check relevant documentation above
2. Review example code in `src/app/api/examples/`
3. Check test files for usage patterns
4. Review GitHub issues (if applicable)

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)

---

## 🎯 Next Steps

### New Developer?
1. ✅ Read [01-OVERVIEW.md](./01-OVERVIEW.md)
2. ✅ Follow [RBAC-SETUP.md](./RBAC-SETUP.md)
3. ✅ Build your first feature

### Ready to Build?
1. ✅ Review [05-API-ROUTES.md](./05-API-ROUTES.md)
2. ✅ Check examples in `src/app/api/examples/`
3. ✅ Start coding!

### Ready to Deploy?
1. ✅ Read [RBAC-DEPLOYMENT-GUIDE.md](./RBAC-DEPLOYMENT-GUIDE.md)
2. ✅ Complete checklist
3. ✅ Deploy with confidence!

---

## 📈 Version History

- **v0.1.0** (October 2025)
  - Initial documentation release
  - Complete RBAC system
  - Full authentication flow
  - Database schema documented
  - API reference complete
  - Routing system documented

---

**Last Updated**: October 20, 2025  
**Version**: 0.1.0  
**Status**: Production Ready ✨

---

**Happy Coding! 🚀**

Need help? Start with [01-OVERVIEW.md](./01-OVERVIEW.md) or jump to the specific topic you need above.
