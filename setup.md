# Human Lift Training Monorepo - Setup Guide

## 🎉 Monorepo Successfully Created!

Your Human Lift Training application has been successfully restructured into a monorepo with the following structure:

```
human-lift-training-monorepo/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── api/              # Fastify.js backend API
├── packages/
│   └── shared/           # Shared types and utilities
├── package.json          # Root package.json with workspace configuration
├── README.md            # Comprehensive documentation
└── .gitignore           # Git ignore rules
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From the monorepo root
npm run install:all
```

### 2. Configure the API

```bash
cd apps/api
# Copy and edit the .env file with your database configuration
```

### 3. Start Development Servers

```bash
# From the monorepo root - starts both frontend and API
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:api       # API on http://localhost:3300
```

## 📦 Available Commands

### Root Level (from monorepo root)

- `npm run dev` - Start both frontend and API
- `npm run dev:frontend` - Start only frontend
- `npm run dev:api` - Start only API
- `npm run build` - Build all applications
- `npm run start` - Start both in production mode
- `npm run install:all` - Install all dependencies

### Individual Apps

```bash
# Frontend
cd apps/frontend
npm run dev      # Development
npm run build    # Build
npm run start    # Production

# API
cd apps/api
npm run build    # Build TypeScript
npm run start    # Start production server
```

## 🔧 Configuration

### API Environment Variables

Create `.env` in `apps/api/`:

```env
PORT=3300
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PWD=your_password
DB_DB=gym_db
JWT_SECRET=your_secret_key
```

### Database Setup

1. Create MySQL database `gym_db`
2. Import schema from `apps/api/_db/gym_db.sql`

## 🏗️ Architecture Benefits

### Monorepo Advantages

- **Shared Code**: Common types and utilities in `packages/shared/`
- **Consistent Dependencies**: Single source of truth for versions
- **Easier Development**: Work on frontend and API simultaneously
- **Simplified CI/CD**: Single repository for deployment
- **Better Testing**: Cross-package testing capabilities

### Package Structure

- **Frontend**: Next.js with TypeScript, Tailwind CSS, HeroUI
- **API**: Fastify.js with TypeScript, Knex.js, TSyringe
- **Shared**: Common types, utilities, and constants

## 🔄 Migration Notes

### What Changed

1. **Repository Structure**: Organized into `apps/` and `packages/`
2. **Package Names**: Updated to use `@human-lift/` namespace
3. **Dependencies**: Added shared package as workspace dependency
4. **Scripts**: Centralized commands in root package.json

### What Stayed the Same

- All existing code and functionality
- Database schema and API endpoints
- Frontend components and pages
- Configuration files (with minor updates)

## 🚀 Next Steps

1. **Test the Setup**: Run `npm run dev` and verify both apps start
2. **Configure Database**: Set up MySQL and import the schema
3. **Update Environment**: Configure API environment variables
4. **Start Development**: Begin working on new features

## 🆘 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000 and 3300 are available
2. **Database Connection**: Verify MySQL is running and credentials are correct
3. **Dependencies**: Run `npm run install:all` if packages are missing

### Getting Help

- Check the main README.md for detailed documentation
- Review individual app README files in `apps/frontend/` and `apps/api/`
- Contact the development team for support

---

🎯 **You're all set!** The monorepo is ready for development. Happy coding!
