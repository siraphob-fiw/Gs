# StrengthOS Product Overview

StrengthOS is a modular, fullstack SaaS platform designed for strength athletes and coaches. The platform provides comprehensive tools for training management, coaching, and athlete development in the strength training domain.

## Core Features
- Multi-tenant architecture supporting coaches and self-coached users
- Training program management and tracking
- Health considerations and injury history tracking
- Payment and billing system integration
- Audit and compliance framework
- Notification system with preferences
- Security and session management

## Target Users
- **Coaches**: Professional trainers managing multiple athletes
- **Athletes**: Self-coached users tracking their own progress
- **Admins**: Platform administrators managing tenants and system operations

## Architecture Philosophy
The platform follows a monorepo structure with shared libraries to ensure consistency, reduce code duplication, and maintain type safety across all applications. All business logic is centralized in shared libraries while applications focus on presentation and user interaction.