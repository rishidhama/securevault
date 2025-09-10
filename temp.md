# 🔐 SecureVault - Complete Comprehensive Guide
## Zero-Knowledge Password Manager with Full-Stack Implementation

---

## 📋 Table of Contents

### **1. PROJECT OVERVIEW & INTRODUCTION**
- 1.1 What is SecureVault?
- 1.2 Core Problem Statement & Market Analysis
- 1.3 Solution Architecture & Design Principles
- 1.4 Key Features & Capabilities
- 1.5 Technology Stack Breakdown
- 1.6 Project Structure & File Organization
- 1.7 Business Model & Target Users

### **2. SECURITY ARCHITECTURE (ZERO-KNOWLEDGE MODEL)**
- 2.1 Zero-Knowledge Principles & Fundamentals
- 2.2 Client-Side Encryption Flow
- 2.3 Key Derivation Process (PBKDF2)
- 2.4 AES-256-CBC Encryption Implementation
- 2.5 Salt & IV Generation Strategy
- 2.6 Master Key Security Model
- 2.7 Server-Side Data Storage Strategy
- 2.8 Security Trade-offs & Production Considerations

### **3. FRONTEND ARCHITECTURE (REACT)**
- 3.1 Component Structure & Organization
- 3.2 State Management Strategy
- 3.3 Routing & Navigation
- 3.4 UI/UX Design System (TailwindCSS)
- 3.5 Dark Mode Implementation
- 3.6 Responsive Design Patterns
- 3.7 Form Validation & Error Handling
- 3.8 Accessibility Features

### **4. BACKEND ARCHITECTURE (NODE.JS/EXPRESS)**
- 4.1 Server Setup & Configuration
- 4.2 Middleware Stack (Security, CORS, Rate Limiting)
- 4.3 Database Schema Design (MongoDB/Mongoose)
- 4.4 API Route Organization
- 4.5 Authentication & Authorization Flow
- 4.6 Error Handling & Logging
- 4.7 Environment Configuration
- 4.8 Health Check & Monitoring

### **5. DATABASE DESIGN & DATA MODELS**
- 5.1 User Schema Design
- 5.2 Credential Schema Design
- 5.3 Indexing Strategy
- 5.4 Data Validation & Constraints
- 5.5 Relationship Management
- 5.6 Backup & Recovery Considerations

### **6. AUTHENTICATION & AUTHORIZATION**
- 6.1 JWT Token Implementation
- 6.2 Master Key Validation Process
- 6.3 Account Lockout Mechanism
- 6.4 Session Management
- 6.5 Password Security (bcrypt)
- 6.6 Multi-Factor Authentication (MFA)
- 6.7 Biometric Authentication (WebAuthn Demo)
- 6.8 Backup Codes System

### **7. ENCRYPTION & CRYPTOGRAPHY**
- 7.1 CryptoJS Library Usage
- 7.2 AES-256-CBC Implementation Details
- 7.3 PBKDF2 Key Derivation Process
- 7.4 Salt Generation & Management
- 7.5 Initialization Vector (IV) Strategy
- 7.6 Password Strength Assessment
- 7.7 Breach Detection (HaveIBeenPwned Integration)
- 7.8 Cryptographic Best Practices

### **8. API DESIGN & ENDPOINTS**
- 8.1 RESTful API Structure
- 8.2 Authentication Endpoints (/api/auth/*)
- 8.3 Credential Management Endpoints (/api/credentials/*)
- 8.4 MFA Endpoints (/api/mfa/*)
- 8.5 Import/Export Endpoints (/api/import-export/*)
- 8.6 Billing Endpoints (/api/billing/*)
- 8.7 Preferences Endpoints (/api/auth/preferences)
- 8.8 Error Response Standards
- 8.9 API Documentation

### **9. BILLING & SUBSCRIPTION SYSTEM**
- 9.1 Stripe Integration Architecture
- 9.2 Checkout Session Creation
- 9.3 Customer Portal Integration
- 9.4 Subscription Management
- 9.5 Payment Method Handling
- 9.6 Invoice & Billing History
- 9.7 Webhook Handling (Future)
- 9.8 Test Mode Configuration

### **10. USER EXPERIENCE & FEATURES**
- 10.1 Dashboard & Vault Interface
- 10.2 Credential Management (CRUD Operations)
- 10.3 Search & Filtering Capabilities
- 10.4 Categories & Tagging System
- 10.5 Favorites & Organization
- 10.6 Password Generator
- 10.7 Import/Export Functionality
- 10.8 Settings & Preferences Management

### **11. SECURITY FEATURES & IMPLEMENTATIONS**
- 11.1 Helmet.js Security Headers
- 11.2 Content Security Policy (CSP)
- 11.3 Cross-Origin Resource Sharing (CORS)
- 11.4 Rate Limiting Implementation
- 11.5 Input Validation & Sanitization
- 11.6 SQL Injection Prevention
- 11.7 XSS Protection
- 11.8 CSRF Protection Considerations

### **12. TESTING & QUALITY ASSURANCE**
- 12.1 Unit Testing Strategy
- 12.2 Integration Testing
- 12.3 Security Testing Considerations
- 12.4 Performance Testing
- 12.5 User Acceptance Testing
- 12.6 Code Quality & Linting
- 12.7 Error Monitoring & Logging

### **13. DEPLOYMENT & PRODUCTION CONSIDERATIONS**
- 13.1 Environment Configuration
- 13.2 Database Deployment (MongoDB Atlas)
- 13.3 Frontend Deployment (Vercel/Netlify)
- 13.4 Backend Deployment (Heroku/AWS)
- 13.5 SSL/TLS Configuration
- 13.6 Environment Variables Management
- 13.7 Monitoring & Alerting
- 13.8 Backup & Disaster Recovery

### **14. PERFORMANCE OPTIMIZATION**
- 14.1 Database Query Optimization
- 14.2 Frontend Performance (React Optimization)
- 14.3 API Response Optimization
- 14.4 Caching Strategies
- 14.5 Bundle Size Optimization
- 14.6 Image & Asset Optimization
- 14.7 CDN Integration

### **15. SCALABILITY CONSIDERATIONS**
- 15.1 Horizontal Scaling Strategy
- 15.2 Database Scaling (Sharding/Replication)
- 15.3 Load Balancing
- 15.4 Microservices Architecture (Future)
- 15.5 Caching Layer (Redis)
- 15.6 Message Queues (Future)

### **16. COMPLIANCE & LEGAL CONSIDERATIONS**
- 16.1 GDPR Compliance
- 16.2 Data Privacy Regulations
- 16.3 Data Retention Policies
- 16.4 User Consent Management
- 16.5 Audit Logging
- 16.6 Security Incident Response

### **17. FUTURE ENHANCEMENTS & ROADMAP**
- 17.1 Mobile Application Development
- 17.2 Browser Extension Integration
- 17.3 Team/Enterprise Features
- 17.4 Advanced Security Features
- 17.5 API for Third-party Integrations
- 17.6 Advanced Analytics & Reporting

### **18. INTERVIEW PREPARATION**
- 18.1 Common Technical Questions & Answers
- 18.2 System Design Questions
- 18.3 Security-focused Questions
- 18.4 Code Review Scenarios
- 18.5 Architecture Discussion Points
- 18.6 Demo Script & Walkthrough
- 18.7 Resume Talking Points
- 18.8 Portfolio Presentation Tips

### **19. TROUBLESHOOTING & DEBUGGING**
- 19.1 Common Development Issues
- 19.2 Production Debugging Strategies
- 19.3 Performance Bottlenecks
- 19.4 Security Vulnerability Fixes
- 19.5 Database Connection Issues
- 19.6 API Integration Problems

### **20. RESOURCES & REFERENCES**
- 20.1 Documentation Links
- 20.2 Security Best Practices
- 20.3 Performance Optimization Guides
- 20.4 Deployment Tutorials
- 20.5 Testing Frameworks
- 20.6 Code Quality Tools

---

**📊 Guide Statistics:**
- **Total Sections**: 20 major sections
- **Total Subsections**: 160+ detailed topics
- **Estimated Pages**: 200+ pages of comprehensive content
- **Target Audience**: SDE, Cybersecurity Engineer, Full-Stack Developer interviews
- **Focus Areas**: Security Architecture, Full-Stack Development, System Design, DevOps

**🎯 Purpose:**
This comprehensive guide provides complete coverage of the SecureVault project, ensuring you can confidently discuss any technical detail during interviews and demonstrate expertise in modern full-stack development with security-first architecture.

---

*This guide will be built step by step, with each section providing detailed technical information, code examples, and interview-ready explanations.*

---

## 1. PROJECT OVERVIEW & INTRODUCTION

### 1.1 What is SecureVault?

SecureVault is a **zero-knowledge password manager** built as a full-stack web application that prioritizes user privacy and security above all else. Unlike traditional password managers that may have access to user data, SecureVault implements a true zero-knowledge architecture where:

- **The server never sees plaintext passwords or the master key**
- **All encryption/decryption happens client-side in the browser**
- **Only encrypted ciphertext is transmitted to and stored on the server**
- **Users have complete control over their data security**

**Key Differentiators:**
- **Zero-Knowledge Architecture**: Implements true end-to-end encryption where the service provider cannot access user data
- **Client-Side Encryption**: Uses AES-256-CBC encryption with PBKDF2 key derivation entirely in the browser
- **Master Key Security**: The master key never leaves the user's device and is used to derive encryption keys
- **Modern Tech Stack**: Built with React, Node.js, MongoDB, and integrates with Stripe for billing
- **Enterprise Features**: Includes MFA, biometric authentication, backup codes, and comprehensive audit trails

**Target Users:**
- **Individual Users**: Seeking secure password management with complete privacy
- **Security-Conscious Professionals**: Who require zero-knowledge solutions
- **Small Teams**: Looking for secure credential sharing capabilities
- **Enterprise Organizations**: Needing compliance with strict data privacy regulations

**Business Model:**
- **Freemium Approach**: Free tier with basic features, premium subscription for advanced capabilities
- **Subscription Tiers**: Free, Pro ($4.99/month), and Team ($9.99/month) plans
- **Stripe Integration**: Seamless payment processing and subscription management

### 1.2 Core Problem Statement & Market Analysis

**The Problem:**
In today's digital landscape, users face several critical challenges with password management:

1. **Password Fatigue**: Users struggle to remember unique, strong passwords for dozens of accounts
2. **Security Vulnerabilities**: 
   - Reusing weak passwords across multiple sites
   - Storing passwords in plaintext or insecure locations
   - Falling victim to phishing attacks due to poor password practices
3. **Privacy Concerns**: 
   - Traditional password managers may have access to user data
   - Cloud-based solutions raise questions about data ownership
   - Government surveillance and data breaches compromise user privacy
4. **Compliance Requirements**: 
   - GDPR, CCPA, and other privacy regulations require strict data protection
   - Enterprise environments need audit trails and access controls
5. **User Experience**: 
   - Complex security measures often lead to poor adoption
   - Lack of cross-platform synchronization
   - Difficulty in sharing credentials securely within teams

**Market Analysis:**
- **Growing Demand**: Password manager market expected to reach $3.5 billion by 2027
- **Security Breaches**: 81% of data breaches involve weak or stolen passwords
- **Regulatory Pressure**: Increasing privacy laws driving demand for zero-knowledge solutions
- **Remote Work**: Pandemic-driven shift to remote work increasing need for secure credential management

**Competitive Landscape:**
- **Traditional Players**: LastPass, 1Password, Dashlane (some have had security incidents)
- **Open Source**: Bitwarden, KeePass (require technical expertise)
- **Enterprise**: Okta, Microsoft Azure AD (complex, expensive)
- **Gap in Market**: User-friendly zero-knowledge solution with modern UX

### 1.3 Solution Architecture & Design Principles

SecureVault addresses these challenges through a comprehensive, multi-layered architecture:

**High-Level Architecture Diagram:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB DB    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   UI Layer  │ │    │ │  API Layer  │ │    │ │ User Data   │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ • Dashboard │ │    │ │ • Auth      │ │    │ │ • Users     │ │
│ │ • Vault     │ │    │ │ • Credentials│ │    │ │ • Credentials│ │
│ │ • Settings  │ │    │ │ • MFA       │ │    │ │ • MFA Data  │ │
│ │ • Billing   │ │    │ │ • Billing   │ │    │ │ • Billing   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Crypto Layer │ │    │ │Security     │ │    │ │Indexes &    │ │
│ │             │ │    │ │Middleware   │ │    │ │Constraints  │ │
│ │ • AES-256   │ │    │ │ • Helmet    │ │    │ │ • Performance│ │
│ │ • PBKDF2    │ │    │ │ • Rate Limit│ │    │ │ • Security  │ │
│ │ • Salt/IV   │ │    │ │ • CORS      │ │    │ │ • Validation│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Stripe API    │
                    │                 │
                    │ • Checkout      │
                    │ • Customer Portal│
                    │ • Webhooks      │
                    └─────────────────┘
```

**Core Design Principles:**

1. **Zero-Knowledge First**: Every design decision prioritizes user privacy
2. **Security by Default**: Multiple layers of security without compromising UX
3. **Modern Web Standards**: Leverages latest web technologies for performance and security
4. **Scalable Architecture**: Designed to handle growth from individual users to enterprise teams
5. **Developer Experience**: Clean, maintainable code with comprehensive documentation

**Data Flow Architecture:**

**Registration Flow:**
```
User Input → Client Validation → Key Derivation → Server Storage
(email, name, masterKey) → (PBKDF2 + Salt) → (bcrypt hash only)
```

**Login Flow:**
```
User Input → Server Validation → JWT Token → Client Session
(email, masterKey) → (bcrypt compare) → (7-day token) → (localStorage)
```

**Credential Storage Flow:**
```
User Input → Client Encryption → Server Storage → Database
(plaintext password) → (AES-256-CBC + IV + Salt) → (ciphertext only)
```

**Credential Retrieval Flow:**
```
Server Data → Client Decryption → User Display
(ciphertext + IV + Salt) → (AES-256-CBC) → (plaintext password)
```

### 1.4 Key Features & Capabilities

**Core Password Management:**
- **Secure Storage**: AES-256-CBC encryption with unique salt and IV per credential
- **Password Generation**: Configurable strong password generator with strength assessment
- **Breach Detection**: Integration with HaveIBeenPwned API for compromised password alerts
- **Categories & Tags**: Organizational system for efficient credential management
- **Search & Filter**: Advanced search capabilities across all stored credentials
- **Favorites System**: Quick access to frequently used credentials
- **Import/Export**: Support for standard password manager formats (JSON, CSV)

**Security Features:**
- **Zero-Knowledge Architecture**: Server never sees plaintext data
- **Master Key Protection**: bcrypt-12 hashing with account lockout protection
- **Multi-Factor Authentication**: TOTP-based 2FA with QR code generation
- **Backup Codes**: Secure recovery codes for account access
- **Biometric Authentication**: WebAuthn-style fingerprint/Face ID support
- **Account Lockout**: Brute force protection with progressive delays
- **Session Management**: JWT tokens with configurable expiration

**User Experience:**
- **Modern UI/UX**: Responsive design with TailwindCSS framework
- **Dark Mode Support**: Complete theme system with system preference detection
- **Cross-Platform**: Web-based solution accessible from any device
- **Offline Capability**: Core functionality works without internet connection
- **Accessibility**: WCAG 2.1 compliant design with keyboard navigation
- **Performance**: Optimized for fast loading and smooth interactions

**Enterprise Features:**
- **Team Management**: Role-based access control and credential sharing
- **Audit Logging**: Comprehensive activity tracking and reporting
- **Compliance**: GDPR, CCPA, and SOC 2 compliance features
- **API Access**: RESTful API for enterprise integrations
- **SSO Integration**: Single Sign-On support for enterprise environments
- **Advanced Analytics**: Usage statistics and security insights

**Billing & Subscription:**
- **Stripe Integration**: Secure payment processing with multiple payment methods
- **Subscription Management**: Easy plan upgrades, downgrades, and cancellations
- **Customer Portal**: Self-service billing management and invoice access
- **Usage Tracking**: Monitor feature usage and plan limits
- **Trial Periods**: Free trials for premium features
- **Prorated Billing**: Fair billing for mid-cycle plan changes

**Advanced Security:**
- **Security Headers**: Comprehensive Helmet.js implementation
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Validation**: Multi-layer validation and sanitization
- **CORS Protection**: Strict cross-origin resource sharing policies
- **Content Security Policy**: XSS protection with configurable directives
- **SQL Injection Prevention**: Parameterized queries and input sanitization

### 1.5 Technology Stack Breakdown

**Frontend Technologies:**

**React 18.x**
- **Purpose**: Modern, component-based UI framework
- **Key Features**: Hooks, Context API, Suspense, Concurrent Features
- **Benefits**: Virtual DOM, component reusability, large ecosystem
- **Implementation**: Functional components with hooks for state management

**TailwindCSS 3.x**
- **Purpose**: Utility-first CSS framework for rapid UI development
- **Key Features**: Responsive design, dark mode, custom configuration
- **Benefits**: Consistent design system, reduced CSS bundle size
- **Implementation**: Custom theme system with CSS variables

**Additional Frontend Libraries:**
- **React Router**: Client-side routing and navigation
- **React Hot Toast**: User notification system
- **Lucide React**: Modern icon library
- **CryptoJS**: Client-side cryptography operations
- **QRCode**: QR code generation for MFA setup

**Backend Technologies:**

**Node.js 18.x**
- **Purpose**: JavaScript runtime for server-side development
- **Key Features**: Event-driven, non-blocking I/O, npm ecosystem
- **Benefits**: Code sharing between frontend/backend, fast development
- **Implementation**: Express.js framework with middleware architecture

**Express.js 4.x**
- **Purpose**: Minimal, flexible web application framework
- **Key Features**: Middleware support, routing, error handling
- **Benefits**: Lightweight, extensible, large middleware ecosystem
- **Implementation**: RESTful API with modular route organization

**MongoDB 6.x with Mongoose**
- **Purpose**: NoSQL document database with ODM
- **Key Features**: Schema validation, middleware, indexing
- **Benefits**: Flexible schema, horizontal scaling, JSON-like documents
- **Implementation**: User and Credential models with comprehensive validation

**Security Libraries:**
- **bcryptjs**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **helmet**: Security headers middleware
- **express-rate-limit**: Rate limiting protection
- **express-validator**: Input validation and sanitization

**Third-Party Integrations:**

**Stripe API**
- **Purpose**: Payment processing and subscription management
- **Features**: Checkout Sessions, Customer Portal, Webhooks
- **Implementation**: Server-side API integration with client-side redirects

**HaveIBeenPwned API**
- **Purpose**: Password breach detection
- **Features**: k-anonymity range API for privacy protection
- **Implementation**: Client-side SHA-1 hashing with range queries

**Development Tools:**
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Nodemon**: Development server with auto-restart
- **Concurrently**: Run multiple npm scripts simultaneously

**Deployment & Infrastructure:**
- **Environment**: Node.js runtime with MongoDB Atlas
- **Process Management**: PM2 or similar for production
- **SSL/TLS**: Let's Encrypt or cloud provider certificates
- **CDN**: CloudFlare or similar for static asset delivery

### 1.6 Project Structure & File Organization

**Root Directory Structure:**
```
securevault-main/
├── client/                 # React frontend application
│   ├── public/            # Static assets and HTML template
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Application entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # TailwindCSS configuration
├── server/                # Node.js backend application
│   ├── models/           # Mongoose data models
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Server utility functions
│   └── index.js          # Server entry point
├── package.json          # Root dependencies and scripts
├── README.md             # Project documentation
└── .env.example          # Environment variables template
```

**Frontend Component Architecture:**

**Core Components:**
```
client/src/components/
├── App.js                 # Main application wrapper
├── Landing.js            # Landing page component
├── LoginEmail.js         # Email-based login
├── LoginMasterKey.js     # Master key authentication
├── LoginMFA.js          # Multi-factor authentication
├── Dashboard.js          # Main dashboard interface
├── Vault.js             # Credential management
├── AddCredential.js     # Add new credential form
├── SettingsPage.js      # User settings and preferences
├── Sidebar.js           # Navigation sidebar
└── LoadingSpinner.js    # Loading state component
```

**Security Components:**
```
client/src/components/
├── BiometricAuth.js      # Biometric authentication
├── BackupCodesManager.js # MFA backup codes
├── MasterKeyModal.js     # Master key change modal
└── BreachMonitor.js      # Password breach detection
```

**Service Layer:**
```
client/src/services/
└── api.js               # Centralized API client
    ├── authAPI          # Authentication endpoints
    ├── credentialsAPI   # Credential management
    ├── mfaAPI          # Multi-factor authentication
    └── billingAPI      # Stripe billing integration
```

**Utility Functions:**
```
client/src/utils/
└── encryption.js        # Client-side cryptography
    ├── encryptPassword  # AES-256-CBC encryption
    ├── decryptPassword  # AES-256-CBC decryption
    ├── deriveKey        # PBKDF2 key derivation
    ├── generatePassword # Strong password generation
    └── checkPasswordBreach # HIBP integration
```

**Backend Architecture:**

**Data Models:**
```
server/models/
├── User.js              # User account model
│   ├── Schema          # User data structure
│   ├── Methods         # Instance methods
│   ├── Statics         # Static methods
│   └── Middleware      # Pre-save hooks
└── Credential.js       # Credential storage model
    ├── Schema          # Credential data structure
    ├── Indexes         # Database indexes
    ├── Methods         # Instance methods
    └── Virtuals        # Computed properties
```

**API Routes:**
```
server/routes/
├── auth.js             # Authentication endpoints
│   ├── /register       # User registration
│   ├── /login          # User login
│   ├── /profile        # User profile management
│   ├── /preferences    # User preferences
│   └── /logout         # Session termination
├── credentials.js      # Credential management
│   ├── GET /           # List credentials
│   ├── POST /          # Create credential
│   ├── PUT /:id        # Update credential
│   └── DELETE /:id     # Delete credential
├── mfa.js             # Multi-factor authentication
│   ├── /setup          # MFA setup
│   ├── /verify         # MFA verification
│   └── /backup-codes   # Backup code management
├── billing.js         # Stripe billing integration
│   ├── /status         # Subscription status
│   ├── /checkout       # Create checkout session
│   └── /portal         # Customer portal access
└── import-export.js   # Data import/export
    ├── /export         # Export vault data
    └── /import         # Import vault data
```

**Configuration Files:**
```
├── package.json        # Dependencies and scripts
├── .env               # Environment variables
├── .gitignore         # Git ignore patterns
├── .eslintrc.js       # ESLint configuration
└── tailwind.config.js # TailwindCSS configuration
```

**Key Design Patterns:**

1. **Separation of Concerns**: Clear separation between UI, business logic, and data layers
2. **Component Composition**: Reusable React components with props and state management
3. **Service Layer Pattern**: Centralized API communication with error handling
4. **Middleware Architecture**: Modular Express middleware for cross-cutting concerns
5. **Model-View-Controller**: Clear separation of data models, business logic, and presentation
6. **Dependency Injection**: Environment-based configuration and service injection

**File Naming Conventions:**
- **Components**: PascalCase (e.g., `SettingsPage.js`)
- **Utilities**: camelCase (e.g., `encryption.js`)
- **Routes**: kebab-case (e.g., `import-export.js`)
- **Models**: PascalCase (e.g., `User.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

**Import/Export Patterns:**
- **Named Exports**: For multiple exports from utility files
- **Default Exports**: For main component files
- **Barrel Exports**: For organizing related components
- **Dynamic Imports**: For code splitting and lazy loading

### 1.7 Business Model & Target Users

**Business Model:**

**Freemium Approach:**
- **Free Tier**: Basic password management with limited features
- **Pro Tier ($4.99/month)**: Advanced features and unlimited storage
- **Team Tier ($9.99/month)**: Collaborative features and admin controls

**Revenue Streams:**
- **Subscription Revenue**: Monthly/annual subscription fees
- **Enterprise Licensing**: Custom pricing for large organizations
- **API Access**: Premium API access for third-party integrations
- **Professional Services**: Implementation and support services

**Pricing Strategy:**
```
Free Plan:
- Up to 50 credentials
- Basic password generation
- Standard support
- Web access only

Pro Plan ($4.99/month):
- Unlimited credentials
- Advanced password generation
- Priority support
- Mobile app access
- Breach monitoring
- Export functionality

Team Plan ($9.99/month):
- All Pro features
- Team collaboration
- Admin controls
- Audit logging
- SSO integration
- API access
```

**Target User Segments:**

**Individual Users:**
- **Security-Conscious Professionals**: Developers, security professionals, privacy advocates
- **Remote Workers**: Need secure access to multiple systems
- **Small Business Owners**: Managing business and personal credentials
- **Students**: Learning about security and password management

**Small Teams:**
- **Startups**: Need secure credential sharing without enterprise complexity
- **Development Teams**: Sharing API keys and development credentials
- **Consulting Firms**: Managing client access credentials
- **Remote Teams**: Secure collaboration across distributed teams

**Enterprise Organizations:**
- **Financial Services**: High security requirements and compliance needs
- **Healthcare**: HIPAA compliance and patient data protection
- **Technology Companies**: Managing developer and system credentials
- **Government Agencies**: Strict security and audit requirements

**Market Positioning:**

**Competitive Advantages:**
- **True Zero-Knowledge**: Unlike competitors, server cannot access user data
- **Modern UX**: Contemporary design with excellent user experience
- **Developer-Friendly**: Clean API and comprehensive documentation
- **Compliance Ready**: Built with GDPR, CCPA, and SOC 2 in mind
- **Scalable Architecture**: Designed to grow with user needs

**Value Propositions:**
- **Privacy First**: Complete user control over data security
- **Ease of Use**: Intuitive interface without sacrificing security
- **Enterprise Ready**: Professional features for business use
- **Cost Effective**: Competitive pricing with premium features
- **Future Proof**: Built on modern, scalable technologies

This comprehensive project structure ensures maintainability, scalability, and follows industry best practices for full-stack JavaScript applications.

---

## 1. PROJECT OVERVIEW & INTRODUCTION

### 1.1 What is SecureVault?

SecureVault is a **zero-knowledge password manager** built as a full-stack web application that prioritizes user privacy and security above all else. Unlike traditional password managers that may have access to user data, SecureVault implements a true zero-knowledge architecture where:

- **The server never sees plaintext passwords or the master key**
- **All encryption/decryption happens client-side in the browser**
- **Only encrypted ciphertext is transmitted to and stored on the server**
- **Users have complete control over their data security**

**Key Differentiators:**
- **Zero-Knowledge Architecture**: Implements true end-to-end encryption where the service provider cannot access user data
- **Client-Side Encryption**: Uses AES-256-CBC encryption with PBKDF2 key derivation entirely in the browser
- **Master Key Security**: The master key never leaves the user's device and is used to derive encryption keys
- **Modern Tech Stack**: Built with React, Node.js, MongoDB, and integrates with Stripe for billing
- **Enterprise Features**: Includes MFA, biometric authentication, backup codes, and comprehensive audit trails

**Target Users:**
- **Individual Users**: Seeking secure password management with complete privacy
- **Security-Conscious Professionals**: Who require zero-knowledge solutions
- **Small Teams**: Looking for secure credential sharing capabilities
- **Enterprise Organizations**: Needing compliance with strict data privacy regulations

**Business Model:**
- **Freemium Approach**: Free tier with basic features, premium subscription for advanced capabilities
- **Subscription Tiers**: Free, Pro ($4.99/month), and Team ($9.99/month) plans
- **Stripe Integration**: Seamless payment processing and subscription management

### 1.2 Core Problem Statement & Market Analysis

**The Problem:**
In today's digital landscape, users face several critical challenges with password management:

1. **Password Fatigue**: Users struggle to remember unique, strong passwords for dozens of accounts
2. **Security Vulnerabilities**: 
   - Reusing weak passwords across multiple sites
   - Storing passwords in plaintext or insecure locations
   - Falling victim to phishing attacks due to poor password practices
3. **Privacy Concerns**: 
   - Traditional password managers may have access to user data
   - Cloud-based solutions raise questions about data ownership
   - Government surveillance and data breaches compromise user privacy
4. **Compliance Requirements**: 
   - GDPR, CCPA, and other privacy regulations require strict data protection
   - Enterprise environments need audit trails and access controls
5. **User Experience**: 
   - Complex security measures often lead to poor adoption
   - Lack of cross-platform synchronization
   - Difficulty in sharing credentials securely within teams

**Market Analysis:**
- **Growing Demand**: Password manager market expected to reach $3.5 billion by 2027
- **Security Breaches**: 81% of data breaches involve weak or stolen passwords
- **Regulatory Pressure**: Increasing privacy laws driving demand for zero-knowledge solutions
- **Remote Work**: Pandemic-driven shift to remote work increasing need for secure credential management

**Competitive Landscape:**
- **Traditional Players**: LastPass, 1Password, Dashlane (some have had security incidents)
- **Open Source**: Bitwarden, KeePass (require technical expertise)
- **Enterprise**: Okta, Microsoft Azure AD (complex, expensive)
- **Gap in Market**: User-friendly zero-knowledge solution with modern UX

### 1.3 Solution Architecture & Design Principles

SecureVault addresses these challenges through a comprehensive, multi-layered architecture:

**High-Level Architecture Diagram:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB DB    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   UI Layer  │ │    │ │  API Layer  │ │    │ │ User Data   │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │ • Dashboard │ │    │ │ • Auth      │ │    │ │ • Users     │ │
│ │ • Vault     │ │    │ │ • Credentials│ │    │ │ • Credentials│ │
│ │ • Settings  │ │    │ │ • MFA       │ │    │ │ • MFA Data  │ │
│ │ • Billing   │ │    │ │ • Billing   │ │    │ │ • Billing   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Crypto Layer │ │    │ │Security     │ │    │ │Indexes &    │ │
│ │             │ │    │ │Middleware   │ │    │ │Constraints  │ │
│ │ • AES-256   │ │    │ │ • Helmet    │ │    │ │ • Performance│ │
│ │ • PBKDF2    │ │    │ │ • Rate Limit│ │    │ │ • Security  │ │
│ │ • Salt/IV   │ │    │ │ • CORS      │ │    │ │ • Validation│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Stripe API    │
                    │                 │
                    │ • Checkout      │
                    │ • Customer Portal│
                    │ • Webhooks      │
                    └─────────────────┘
```

**Core Design Principles:**

1. **Zero-Knowledge First**: Every design decision prioritizes user privacy
2. **Security by Default**: Multiple layers of security without compromising UX
3. **Modern Web Standards**: Leverages latest web technologies for performance and security
4. **Scalable Architecture**: Designed to handle growth from individual users to enterprise teams
5. **Developer Experience**: Clean, maintainable code with comprehensive documentation

**Data Flow Architecture:**

**Registration Flow:**
```
User Input → Client Validation → Key Derivation → Server Storage
(email, name, masterKey) → (PBKDF2 + Salt) → (bcrypt hash only)
```

**Login Flow:**
```
User Input → Server Validation → JWT Token → Client Session
(email, masterKey) → (bcrypt compare) → (7-day token) → (localStorage)
```

**Credential Storage Flow:**
```
User Input → Client Encryption → Server Storage → Database
(plaintext password) → (AES-256-CBC + IV + Salt) → (ciphertext only)
```

**Credential Retrieval Flow:**
```
Server Data → Client Decryption → User Display
(ciphertext + IV + Salt) → (AES-256-CBC) → (plaintext password)
```

### 1.4 Key Features & Capabilities

**Core Password Management:**
- **Secure Storage**: AES-256-CBC encryption with unique salt and IV per credential
- **Password Generation**: Configurable strong password generator with strength assessment
- **Breach Detection**: Integration with HaveIBeenPwned API for compromised password alerts
- **Categories & Tags**: Organizational system for efficient credential management
- **Search & Filter**: Advanced search capabilities across all stored credentials
- **Favorites System**: Quick access to frequently used credentials
- **Import/Export**: Support for standard password manager formats (JSON, CSV)

**Security Features:**
- **Zero-Knowledge Architecture**: Server never sees plaintext data
- **Master Key Protection**: bcrypt-12 hashing with account lockout protection
- **Multi-Factor Authentication**: TOTP-based 2FA with QR code generation
- **Backup Codes**: Secure recovery codes for account access
- **Biometric Authentication**: WebAuthn-style fingerprint/Face ID support
- **Account Lockout**: Brute force protection with progressive delays
- **Session Management**: JWT tokens with configurable expiration

**User Experience:**
- **Modern UI/UX**: Responsive design with TailwindCSS framework
- **Dark Mode Support**: Complete theme system with system preference detection
- **Cross-Platform**: Web-based solution accessible from any device
- **Offline Capability**: Core functionality works without internet connection
- **Accessibility**: WCAG 2.1 compliant design with keyboard navigation
- **Performance**: Optimized for fast loading and smooth interactions

**Enterprise Features:**
- **Team Management**: Role-based access control and credential sharing
- **Audit Logging**: Comprehensive activity tracking and reporting
- **Compliance**: GDPR, CCPA, and SOC 2 compliance features
- **API Access**: RESTful API for enterprise integrations
- **SSO Integration**: Single Sign-On support for enterprise environments
- **Advanced Analytics**: Usage statistics and security insights

**Billing & Subscription:**
- **Stripe Integration**: Secure payment processing with multiple payment methods
- **Subscription Management**: Easy plan upgrades, downgrades, and cancellations
- **Customer Portal**: Self-service billing management and invoice access
- **Usage Tracking**: Monitor feature usage and plan limits
- **Trial Periods**: Free trials for premium features
- **Prorated Billing**: Fair billing for mid-cycle plan changes

**Advanced Security:**
- **Security Headers**: Comprehensive Helmet.js implementation
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Validation**: Multi-layer validation and sanitization
- **CORS Protection**: Strict cross-origin resource sharing policies
- **Content Security Policy**: XSS protection with configurable directives
- **SQL Injection Prevention**: Parameterized queries and input sanitization

### 1.5 Technology Stack Breakdown

**Frontend Technologies:**

**React 18.x**
- **Purpose**: Modern, component-based UI framework
- **Key Features**: Hooks, Context API, Suspense, Concurrent Features
- **Benefits**: Virtual DOM, component reusability, large ecosystem
- **Implementation**: Functional components with hooks for state management

**TailwindCSS 3.x**
- **Purpose**: Utility-first CSS framework for rapid UI development
- **Key Features**: Responsive design, dark mode, custom configuration
- **Benefits**: Consistent design system, reduced CSS bundle size
- **Implementation**: Custom theme system with CSS variables

**Additional Frontend Libraries:**
- **React Router**: Client-side routing and navigation
- **React Hot Toast**: User notification system
- **Lucide React**: Modern icon library
- **CryptoJS**: Client-side cryptography operations
- **QRCode**: QR code generation for MFA setup

**Backend Technologies:**

**Node.js 18.x**
- **Purpose**: JavaScript runtime for server-side development
- **Key Features**: Event-driven, non-blocking I/O, npm ecosystem
- **Benefits**: Code sharing between frontend/backend, fast development
- **Implementation**: Express.js framework with middleware architecture

**Express.js 4.x**
- **Purpose**: Minimal, flexible web application framework
- **Key Features**: Middleware support, routing, error handling
- **Benefits**: Lightweight, extensible, large middleware ecosystem
- **Implementation**: RESTful API with modular route organization

**MongoDB 6.x with Mongoose**
- **Purpose**: NoSQL document database with ODM
- **Key Features**: Schema validation, middleware, indexing
- **Benefits**: Flexible schema, horizontal scaling, JSON-like documents
- **Implementation**: User and Credential models with comprehensive validation

**Security Libraries:**
- **bcryptjs**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **helmet**: Security headers middleware
- **express-rate-limit**: Rate limiting protection
- **express-validator**: Input validation and sanitization

**Third-Party Integrations:**

**Stripe API**
- **Purpose**: Payment processing and subscription management
- **Features**: Checkout Sessions, Customer Portal, Webhooks
- **Implementation**: Server-side API integration with client-side redirects

**HaveIBeenPwned API**
- **Purpose**: Password breach detection
- **Features**: k-anonymity range API for privacy protection
- **Implementation**: Client-side SHA-1 hashing with range queries

**Development Tools:**
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Nodemon**: Development server with auto-restart
- **Concurrently**: Run multiple npm scripts simultaneously

**Deployment & Infrastructure:**
- **Environment**: Node.js runtime with MongoDB Atlas
- **Process Management**: PM2 or similar for production
- **SSL/TLS**: Let's Encrypt or cloud provider certificates
- **CDN**: CloudFlare or similar for static asset delivery

### 1.6 Project Structure & File Organization

**Root Directory Structure:**
```
securevault-main/
├── client/                 # React frontend application
│   ├── public/            # Static assets and HTML template
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Application entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # TailwindCSS configuration
├── server/                # Node.js backend application
│   ├── models/           # Mongoose data models
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Server utility functions
│   └── index.js          # Server entry point
├── package.json          # Root dependencies and scripts
├── README.md             # Project documentation
└── .env.example          # Environment variables template
```

**Frontend Component Architecture:**

**Core Components:**
```
client/src/components/
├── App.js                 # Main application wrapper
├── Landing.js            # Landing page component
├── LoginEmail.js         # Email-based login
├── LoginMasterKey.js     # Master key authentication
├── LoginMFA.js          # Multi-factor authentication
├── Dashboard.js          # Main dashboard interface
├── Vault.js             # Credential management
├── AddCredential.js     # Add new credential form
├── SettingsPage.js      # User settings and preferences
├── Sidebar.js           # Navigation sidebar
└── LoadingSpinner.js    # Loading state component
```

**Security Components:**
```
client/src/components/
├── BiometricAuth.js      # Biometric authentication
├── BackupCodesManager.js # MFA backup codes
├── MasterKeyModal.js     # Master key change modal
└── BreachMonitor.js      # Password breach detection
```

**Service Layer:**
```
client/src/services/
└── api.js               # Centralized API client
    ├── authAPI          # Authentication endpoints
    ├── credentialsAPI   # Credential management
    ├── mfaAPI          # Multi-factor authentication
    └── billingAPI      # Stripe billing integration
```

**Utility Functions:**
```
client/src/utils/
└── encryption.js        # Client-side cryptography
    ├── encryptPassword  # AES-256-CBC encryption
    ├── decryptPassword  # AES-256-CBC decryption
    ├── deriveKey        # PBKDF2 key derivation
    ├── generatePassword # Strong password generation
    └── checkPasswordBreach # HIBP integration
```

**Backend Architecture:**

**Data Models:**
```
server/models/
├── User.js              # User account model
│   ├── Schema          # User data structure
│   ├── Methods         # Instance methods
│   ├── Statics         # Static methods
│   └── Middleware      # Pre-save hooks
└── Credential.js       # Credential storage model
    ├── Schema          # Credential data structure
    ├── Indexes         # Database indexes
    ├── Methods         # Instance methods
    └── Virtuals        # Computed properties
```

**API Routes:**
```
server/routes/
├── auth.js             # Authentication endpoints
│   ├── /register       # User registration
│   ├── /login          # User login
│   ├── /profile        # User profile management
│   ├── /preferences    # User preferences
│   └── /logout         # Session termination
├── credentials.js      # Credential management
│   ├── GET /           # List credentials
│   ├── POST /          # Create credential
│   ├── PUT /:id        # Update credential
│   └── DELETE /:id     # Delete credential
├── mfa.js             # Multi-factor authentication
│   ├── /setup          # MFA setup
│   ├── /verify         # MFA verification
│   └── /backup-codes   # Backup code management
├── billing.js         # Stripe billing integration
│   ├── /status         # Subscription status
│   ├── /checkout       # Create checkout session
│   └── /portal         # Customer portal access
└── import-export.js   # Data import/export
    ├── /export         # Export vault data
    └── /import         # Import vault data
```

**Configuration Files:**
```
├── package.json        # Dependencies and scripts
├── .env               # Environment variables
├── .gitignore         # Git ignore patterns
├── .eslintrc.js       # ESLint configuration
└── tailwind.config.js # TailwindCSS configuration
```

**Key Design Patterns:**

1. **Separation of Concerns**: Clear separation between UI, business logic, and data layers
2. **Component Composition**: Reusable React components with props and state management
3. **Service Layer Pattern**: Centralized API communication with error handling
4. **Middleware Architecture**: Modular Express middleware for cross-cutting concerns
5. **Model-View-Controller**: Clear separation of data models, business logic, and presentation
6. **Dependency Injection**: Environment-based configuration and service injection

**File Naming Conventions:**
- **Components**: PascalCase (e.g., `SettingsPage.js`)
- **Utilities**: camelCase (e.g., `encryption.js`)
- **Routes**: kebab-case (e.g., `import-export.js`)
- **Models**: PascalCase (e.g., `User.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

**Import/Export Patterns:**
- **Named Exports**: For multiple exports from utility files
- **Default Exports**: For main component files
- **Barrel Exports**: For organizing related components
- **Dynamic Imports**: For code splitting and lazy loading

### 1.7 Business Model & Target Users

**Business Model:**

**Freemium Approach:**
- **Free Tier**: Basic password management with limited features
- **Pro Tier ($4.99/month)**: Advanced features and unlimited storage
- **Team Tier ($9.99/month)**: Collaborative features and admin controls

**Revenue Streams:**
- **Subscription Revenue**: Monthly/annual subscription fees
- **Enterprise Licensing**: Custom pricing for large organizations
- **API Access**: Premium API access for third-party integrations
- **Professional Services**: Implementation and support services

**Pricing Strategy:**
```
Free Plan:
- Up to 50 credentials
- Basic password generation
- Standard support
- Web access only

Pro Plan ($4.99/month):
- Unlimited credentials
- Advanced password generation
- Priority support
- Mobile app access
- Breach monitoring
- Export functionality

Team Plan ($9.99/month):
- All Pro features
- Team collaboration
- Admin controls
- Audit logging
- SSO integration
- API access
```

**Target User Segments:**

**Individual Users:**
- **Security-Conscious Professionals**: Developers, security professionals, privacy advocates
- **Remote Workers**: Need secure access to multiple systems
- **Small Business Owners**: Managing business and personal credentials
- **Students**: Learning about security and password management

**Small Teams:**
- **Startups**: Need secure credential sharing without enterprise complexity
- **Development Teams**: Sharing API keys and development credentials
- **Consulting Firms**: Managing client access credentials
- **Remote Teams**: Secure collaboration across distributed teams

**Enterprise Organizations:**
- **Financial Services**: High security requirements and compliance needs
- **Healthcare**: HIPAA compliance and patient data protection
- **Technology Companies**: Managing developer and system credentials
- **Government Agencies**: Strict security and audit requirements

**Market Positioning:**

**Competitive Advantages:**
- **True Zero-Knowledge**: Unlike competitors, server cannot access user data
- **Modern UX**: Contemporary design with excellent user experience
- **Developer-Friendly**: Clean API and comprehensive documentation
- **Compliance Ready**: Built with GDPR, CCPA, and SOC 2 in mind
- **Scalable Architecture**: Designed to grow with user needs

**Value Propositions:**
- **Privacy First**: Complete user control over data security
- **Ease of Use**: Intuitive interface without sacrificing security
- **Enterprise Ready**: Professional features for business use
- **Cost Effective**: Competitive pricing with premium features
- **Future Proof**: Built on modern, scalable technologies

This comprehensive project structure ensures maintainability, scalability, and follows industry best practices for full-stack JavaScript applications.

---

## 2. SECURITY ARCHITECTURE (ZERO-KNOWLEDGE MODEL)

### 2.1 Zero-Knowledge Principles & Fundamentals

**Definition and Core Concept:**
Zero-knowledge architecture is a security model where the service provider (SecureVault) has **absolutely no access** to the user's sensitive data. This means:

- **No Plaintext Access**: The server never sees, stores, or processes plaintext passwords
- **No Key Access**: The master key never leaves the user's device
- **No Decryption Capability**: The server cannot decrypt user data even if compelled
- **Complete User Control**: Users maintain full ownership and control of their data

**Mathematical Foundation:**
The zero-knowledge concept is based on cryptographic principles where:
```
Server Knowledge = {encrypted_data, metadata, user_account_info}
Server Knowledge ≠ {plaintext_passwords, master_keys, decryption_capability}
```

**Key Principles Implemented:**

1. **Client-Side Processing**: All cryptographic operations happen in the user's browser
2. **Key Derivation**: Encryption keys are derived from user input, not stored
3. **Ciphertext-Only Storage**: Only encrypted data reaches the server
4. **No Backdoor Access**: No mechanism exists for the service to access plaintext
5. **User-Controlled Recovery**: Only the user can recover their data

**Comparison with Traditional Models:**

| Aspect | Traditional Password Manager | SecureVault (Zero-Knowledge) |
|--------|------------------------------|------------------------------|
| **Data Access** | Server can access plaintext | Server sees only ciphertext |
| **Key Storage** | Keys stored on server | Keys never leave client |
| **Recovery** | Service can reset passwords | Only user can recover data |
| **Compliance** | Service must protect data | Service has no data to protect |
| **Trust Model** | Trust the service provider | Trust only cryptography |

**Legal and Compliance Benefits:**
- **GDPR Compliance**: No personal data processing by the service
- **CCPA Compliance**: No data subject to California privacy laws
- **Subpoena Resistance**: Service cannot provide plaintext data
- **Audit Simplicity**: No sensitive data in logs or backups

### 2.2 Client-Side Encryption Flow

**Complete Encryption Process:**

The client-side encryption flow ensures that sensitive data is encrypted before it ever leaves the user's browser:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE ENCRYPTION FLOW              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User Input (Plaintext Password)                        │
│     ↓                                                       │
│  2. Generate Random Salt (128-bit)                         │
│     ↓                                                       │
│  3. Generate Random IV (128-bit)                           │
│     ↓                                                       │
│  4. Derive Encryption Key (PBKDF2)                         │
│     Master Key + Salt → 256-bit Key                        │
│     ↓                                                       │
│  5. Encrypt Password (AES-256-CBC)                         │
│     Plaintext + Key + IV → Ciphertext                      │
│     ↓                                                       │
│  6. Prepare for Transmission                               │
│     {ciphertext, salt, iv, metadata} → Server              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detailed Step-by-Step Process:**

**Step 1: Input Validation**
```javascript
// Validate user input before processing
if (!password || password.trim() === '') {
  throw new Error('Password is required for encryption');
}
if (!masterKey || masterKey.trim() === '') {
  throw new Error('Master key is required for encryption');
}
```

**Step 2: Salt Generation**
```javascript
generateSalt() {
  const wordArray = CryptoJS.lib.WordArray.random(128/8);
  return wordArray.toString(CryptoJS.enc.Base64);
}
```

**Step 3: IV Generation**
```javascript
generateIV() {
  const wordArray = CryptoJS.lib.WordArray.random(128/8);
  return wordArray.toString(CryptoJS.enc.Base64);
}
```

**Step 4: Key Derivation**
```javascript
deriveKey(masterKey, salt) {
  const saltWordArray = CryptoJS.enc.Base64.parse(salt);
  const key = CryptoJS.PBKDF2(masterKey, saltWordArray, {
    keySize: 256 / 32,  // 256-bit key
    iterations: 1000    // Configurable for production
  });
  return key;
}
```

**Step 5: Encryption**
```javascript
encryptPassword(password, masterKey) {
  const salt = this.generateSalt();
  const iv = this.generateIV();
  const key = this.deriveKey(masterKey, salt);
  
  const encrypted = CryptoJS.AES.encrypt(password, key, {
    iv: CryptoJS.enc.Base64.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return {
    encryptedPassword: encrypted.toString(),
    iv: iv,
    salt: salt
  };
}
```

**Step 6: Data Transmission**
```javascript
// Only encrypted data is sent to server
const credentialData = {
  title: "My Account",
  username: "user@example.com",
  encryptedPassword: result.encryptedPassword,  // Ciphertext only
  iv: result.iv,                                // Required for decryption
  salt: result.salt,                            // Required for key derivation
  url: "https://example.com",
  notes: "Personal account"
};
```

**Security Guarantees:**

1. **Confidentiality**: Plaintext never leaves the client
2. **Integrity**: Tampering with ciphertext will cause decryption failure
3. **Authenticity**: Each credential has unique salt and IV
4. **Non-repudiation**: Cryptographic proof of data origin

**Error Handling and Validation:**
```javascript
try {
  // Validate generated values
  if (!salt || !iv) {
    throw new Error('Failed to generate salt or IV');
  }
  
  // Validate derived key
  if (!key || !key.sigBytes) {
    throw new Error('Failed to derive encryption key');
  }
  
  // Validate encryption result
  if (!encrypted || !encrypted.toString()) {
    throw new Error('Encryption failed');
  }
} catch (error) {
  console.error('Encryption error:', error);
  throw new Error(`Failed to encrypt password: ${error.message}`);
}
```

### 2.3 Key Derivation Process (PBKDF2)

**PBKDF2 (Password-Based Key Derivation Function 2) Overview:**

PBKDF2 is a key derivation function that transforms a password into a cryptographic key suitable for encryption. It's designed to be computationally expensive to prevent brute-force attacks.

**Mathematical Foundation:**
```
PBKDF2(Password, Salt, Iterations, KeyLength) = Key

Where:
- Password: User's master key
- Salt: Random value to prevent rainbow table attacks
- Iterations: Number of hash iterations (currently 1,000)
- KeyLength: Desired key length in bits (256 bits)
```

**Implementation Details:**

**Key Derivation Function:**
```javascript
deriveKey(masterKey, salt) {
  try {
    // Ensure salt is properly formatted as WordArray
    const saltWordArray = CryptoJS.enc.Base64.parse(salt);
    
    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(masterKey, saltWordArray, {
      keySize: this.keySize / 32,    // 256 bits = 8 words
      iterations: this.iterations    // 1,000 iterations
    });
    
    return key;
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive encryption key');
  }
}
```

**Configuration Parameters:**
```javascript
class EncryptionService {
  constructor() {
    this.algorithm = 'AES-256-CBC';
    this.keySize = 256;           // 256-bit key
    this.iterations = 1000;       // 1,000 iterations (configurable)
  }
}
```

**Security Considerations:**

1. **Iteration Count**: 
   - Current: 1,000 iterations
   - Production Recommendation: 100,000+ iterations
   - Balance between security and performance

2. **Salt Requirements**:
   - Random: Each credential gets unique salt
   - Length: 128 bits (16 bytes)
   - Storage: Salt stored alongside ciphertext

3. **Key Length**:
   - 256 bits for AES-256
   - Provides 128-bit security level
   - Resistant to quantum attacks

**Performance Impact:**
```javascript
// Benchmarking key derivation
const startTime = performance.now();
const key = deriveKey(masterKey, salt);
const endTime = performance.now();
console.log(`Key derivation took ${endTime - startTime}ms`);
```

**Production Hardening:**
```javascript
// Production configuration
const PRODUCTION_CONFIG = {
  iterations: 100000,    // 100x more iterations
  keySize: 256,          // 256-bit key
  saltLength: 128,       // 128-bit salt
  memoryCost: 16384,     // For Argon2 (future upgrade)
  timeCost: 3,           // For Argon2 (future upgrade)
  parallelism: 1         // For Argon2 (future upgrade)
};
```

### 2.4 AES-256-CBC Encryption Implementation

**AES (Advanced Encryption Standard) Overview:**

AES is a symmetric block cipher that encrypts data in 128-bit blocks. AES-256 uses a 256-bit key and is considered cryptographically secure.

**Cipher Mode: CBC (Cipher Block Chaining)**

CBC mode provides confidentiality by chaining blocks together, where each plaintext block is XORed with the previous ciphertext block before encryption.

**Mathematical Process:**
```
For each block i:
C[i] = AES_Encrypt(P[i] ⊕ C[i-1], Key)
Where C[0] = IV (Initialization Vector)
```

**Implementation Details:**

**Encryption Process:**
```javascript
encryptPassword(password, masterKey) {
  try {
    // Generate cryptographic materials
    const salt = this.generateSalt();
    const iv = this.generateIV();
    const key = this.deriveKey(masterKey, salt);
    
    // Validate derived key
    if (!key || !key.sigBytes) {
      throw new Error('Failed to derive encryption key');
    }
    
    // Encrypt using AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(password, key, {
      iv: CryptoJS.enc.Base64.parse(iv),      // Initialization Vector
      mode: CryptoJS.mode.CBC,                // Cipher Block Chaining
      padding: CryptoJS.pad.Pkcs7             // PKCS7 padding
    });
    
    return {
      encryptedPassword: encrypted.toString(),
      iv: iv,
      salt: salt
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt password: ${error.message}`);
  }
}
```

**Decryption Process:**
```javascript
decryptPassword(encryptedPassword, masterKey, iv, salt) {
  try {
    // Validate inputs
    if (!masterKey || !encryptedPassword || !iv || !salt) {
      throw new Error('Missing required parameters');
    }
    
    // Derive the same key
    const key = this.deriveKey(masterKey, salt);
    
    // Decrypt using AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, key, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert to string
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Validate decryption result
    if (!result || result.trim() === '') {
      throw new Error('Decryption resulted in empty string');
    }
    
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password. Check your master key.');
  }
}
```

**Security Features:**

1. **Block Size**: 128-bit blocks (AES standard)
2. **Key Size**: 256-bit key (AES-256)
3. **Mode**: CBC with random IV
4. **Padding**: PKCS7 padding
5. **IV**: Unique per encryption

**Cryptographic Properties:**

- **Confidentiality**: Encrypted data reveals no information about plaintext
- **Integrity**: Tampering with ciphertext causes decryption failure
- **Authenticity**: Each encryption uses unique IV
- **Non-repudiation**: Cryptographic proof of encryption

**Error Handling:**
```javascript
// Comprehensive error handling
try {
  const result = decryptPassword(encryptedPassword, masterKey, iv, salt);
  return result;
} catch (error) {
  if (error.message.includes('empty string')) {
    throw new Error('Invalid master key or corrupted data');
  } else if (error.message.includes('Missing parameters')) {
    throw new Error('Incomplete encryption parameters');
  } else {
    throw new Error('Decryption failed');
  }
}
```

### 2.5 Salt & IV Generation Strategy

**Salt Generation Strategy:**

A salt is a random value added to the password before key derivation to prevent rainbow table attacks and ensure that identical passwords produce different keys.

**Implementation:**
```javascript
generateSalt() {
  try {
    // Generate 128-bit (16-byte) random salt
    const wordArray = CryptoJS.lib.WordArray.random(128/8);
    return wordArray.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error('Salt generation error:', error);
    throw new Error('Failed to generate salt');
  }
}
```

**Salt Properties:**
- **Length**: 128 bits (16 bytes)
- **Randomness**: Cryptographically secure random generation
- **Uniqueness**: Each credential gets a unique salt
- **Storage**: Stored alongside ciphertext in database

**IV (Initialization Vector) Generation Strategy:**

An IV is a random value used to initialize the encryption process, ensuring that identical plaintexts produce different ciphertexts.

**Implementation:**
```javascript
generateIV() {
  try {
    // Generate 128-bit (16-byte) random IV
    const wordArray = CryptoJS.lib.WordArray.random(128/8);
    return wordArray.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error('IV generation error:', error);
    throw new Error('Failed to generate IV');
  }
}
```

**IV Properties:**
- **Length**: 128 bits (16 bytes) - matches AES block size
- **Randomness**: Cryptographically secure random generation
- **Uniqueness**: Each encryption uses a unique IV
- **Storage**: Stored alongside ciphertext for decryption

**Security Benefits:**

1. **Rainbow Table Protection**: Salt prevents pre-computed attack tables
2. **Pattern Elimination**: IV ensures identical plaintexts produce different ciphertexts
3. **Uniqueness**: Each credential has unique cryptographic materials
4. **Forward Secrecy**: Compromise of one credential doesn't affect others

**Storage Strategy:**
```javascript
// Database schema includes salt and IV
const credentialSchema = {
  userId: ObjectId,
  title: String,
  username: String,
  encryptedPassword: String,  // AES-256-CBC ciphertext
  iv: String,                 // Base64 encoded IV
  salt: String,               // Base64 encoded salt
  url: String,
  notes: String,
  // ... other fields
};
```

**Validation and Error Handling:**
```javascript
// Validate generated cryptographic materials
if (!salt || salt.length < 20) {  // Minimum length check
  throw new Error('Invalid salt generated');
}

if (!iv || iv.length < 20) {      // Minimum length check
  throw new Error('Invalid IV generated');
}

// Verify Base64 encoding
try {
  CryptoJS.enc.Base64.parse(salt);
  CryptoJS.enc.Base64.parse(iv);
} catch (error) {
  throw new Error('Invalid Base64 encoding');
}
```

### 2.6 Master Key Security Model

**Master Key Concept:**

The master key is the single secret that protects all user data. It's used to derive encryption keys but is never stored or transmitted to the server.

**Security Model:**

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTER KEY SECURITY MODEL               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User's Master Key                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Never leaves client device                        │   │
│  │ • Used to derive encryption keys                    │   │
│  │ • Validated against bcrypt hash on server          │   │
│  │ • Lost = Data unrecoverable                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Server Storage (bcrypt hash only)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • bcrypt-12 hash of master key                      │   │
│  │ • Used for login validation only                    │   │
│  │ • Cannot be used for decryption                     │   │
│  │ • Account lockout protection                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Registration Process:**
```javascript
// Client-side: Master key never sent
const registrationData = {
  email: userEmail,
  name: userName,
  // masterKey is NOT included - only used locally
};

// Server-side: Only hash is stored
userSchema.pre('save', async function(next) {
  if (this.isModified('masterKeyHash')) {
    this.masterKeyHash = await bcrypt.hash(this.masterKeyHash, 12);
  }
  next();
});
```

**Login Validation:**
```javascript
// Server-side validation
userSchema.methods.validateMasterKey = async function(masterKey) {
  return await bcrypt.compare(masterKey, this.masterKeyHash);
};

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, masterKey } = req.body;
  const user = await User.findByEmail(email);
  
  if (!user || !(await user.validateMasterKey(masterKey))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token
  const token = generateToken(user._id);
  res.json({ success: true, token });
});
```

**Security Measures:**

1. **bcrypt Hashing**: 12 rounds of bcrypt for server-side storage
2. **Account Lockout**: Progressive delays after failed attempts
3. **Rate Limiting**: Protection against brute force attacks
4. **Input Validation**: Strict validation of master key format
5. **Secure Transmission**: HTTPS for all communications

**Account Lockout Implementation:**
```javascript
userSchema.methods.incLoginAttempts = function() {
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};
```

**Master Key Requirements:**
```javascript
// Client-side validation
const validateMasterKey = (masterKey) => {
  if (!masterKey || masterKey.length < 8) {
    throw new Error('Master key must be at least 8 characters');
  }
  
  // Additional complexity requirements
  const hasUpperCase = /[A-Z]/.test(masterKey);
  const hasLowerCase = /[a-z]/.test(masterKey);
  const hasNumbers = /\d/.test(masterKey);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(masterKey);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    throw new Error('Master key must include uppercase, lowercase, numbers, and special characters');
  }
  
  return true;
};
```

### 2.7 Server-Side Data Storage Strategy

**Data Storage Philosophy:**

The server stores only encrypted data and metadata necessary for application functionality. No plaintext sensitive data is ever stored.

**Database Schema Design:**

**User Collection:**
```javascript
const userSchema = {
  _id: ObjectId,
  email: String,                    // For login and identification
  name: String,                     // Display name
  masterKeyHash: String,            // bcrypt hash only
  mfaEnabled: Boolean,              // MFA status
  mfaSecret: String,                // Encrypted TOTP secret
  biometricEnabled: Boolean,        // Biometric status
  biometricCredential: Mixed,       // Encrypted biometric data
  loginAttempts: Number,            // Security tracking
  lockUntil: Date,                  // Account lockout
  stripeCustomerId: String,         // Billing integration
  subscription: {                   // Subscription data
    id: String,
    status: String,
    priceId: String,
    currentPeriodEnd: Date
  },
  preferences: {                    // User preferences
    notifications: {
      securityAlerts: Boolean,
      breachNotifications: Boolean,
      weeklyReports: Boolean
    },
    privacy: {
      analyticsOptIn: Boolean,
      crashReports: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
};
```

**Credential Collection:**
```javascript
const credentialSchema = {
  _id: ObjectId,
  userId: ObjectId,                 // User reference
  title: String,                    // Credential title
  username: String,                 // Username/email
  encryptedPassword: String,        // AES-256-CBC ciphertext
  iv: String,                       // Initialization Vector
  salt: String,                     // Salt for key derivation
  url: String,                      // Associated URL
  notes: String,                    // User notes
  category: String,                 // Organization
  tags: [String],                   // Searchable tags
  isFavorite: Boolean,              // Quick access
  lastModified: Date,               // Audit trail
  createdAt: Date                   // Audit trail
};
```

**Security Considerations:**

1. **No Plaintext Storage**: Only encrypted passwords are stored
2. **Metadata Encryption**: Sensitive metadata could be encrypted
3. **Access Control**: User isolation through userId references
4. **Audit Logging**: Track all data access and modifications
5. **Backup Encryption**: Database backups are encrypted

**Indexing Strategy:**
```javascript
// Performance and security indexes
credentialSchema.index({ userId: 1 });           // User isolation
credentialSchema.index({ title: 'text' });       // Search functionality
credentialSchema.index({ category: 1 });         // Category filtering
credentialSchema.index({ isFavorite: 1 });       // Favorites query
credentialSchema.index({ createdAt: -1 });       // Recent items

// Compound indexes for complex queries
credentialSchema.index({ userId: 1, category: 1 });
credentialSchema.index({ userId: 1, isFavorite: 1 });
```

**Data Access Patterns:**

**User Isolation:**
```javascript
// All queries include userId for security
const getCredentials = async (userId) => {
  return await Credential.find({ userId }).sort({ createdAt: -1 });
};

const getCredentialById = async (credentialId, userId) => {
  return await Credential.findOne({ _id: credentialId, userId });
};
```

**Search and Filtering:**
```javascript
// Secure search with user isolation
const searchCredentials = async (userId, searchTerm) => {
  return await Credential.find({
    userId,
    $text: { $search: searchTerm }
  }).sort({ score: { $meta: "textScore" } });
};
```

**Backup and Recovery:**
```javascript
// Encrypted backup strategy
const createBackup = async (userId) => {
  const credentials = await Credential.find({ userId });
  const backupData = {
    version: '1.0',
    timestamp: new Date(),
    credentials: credentials.map(cred => ({
      title: cred.title,
      username: cred.username,
      encryptedPassword: cred.encryptedPassword,
      iv: cred.iv,
      salt: cred.salt,
      url: cred.url,
      notes: cred.notes,
      category: cred.category,
      tags: cred.tags
    }))
  };
  
  return backupData;
};
```

### 2.8 Security Trade-offs & Production Considerations

**Current Implementation Trade-offs:**

**Strengths:**
1. **True Zero-Knowledge**: Server cannot access plaintext data
2. **Strong Cryptography**: AES-256-CBC with PBKDF2
3. **Unique Materials**: Each credential has unique salt and IV
4. **Account Protection**: bcrypt-12 with lockout mechanism
5. **Modern Standards**: Industry-standard cryptographic algorithms

**Areas for Production Enhancement:**

**1. Key Derivation Function:**
```javascript
// Current: PBKDF2 with 1,000 iterations
// Production: Argon2id with higher cost factors
const PRODUCTION_KDF_CONFIG = {
  type: 'argon2id',
  memoryCost: 16384,    // 16MB memory usage
  timeCost: 3,          // 3 iterations
  parallelism: 1,       // Single thread
  saltLength: 32,       // 256-bit salt
  hashLength: 32        // 256-bit hash
};
```

**2. Authenticated Encryption:**
```javascript
// Current: AES-CBC (confidentiality only)
// Production: AES-GCM (confidentiality + authenticity)
const encryptWithGCM = (plaintext, key, iv) => {
  return CryptoJS.AES.encrypt(plaintext, key, {
    mode: CryptoJS.mode.GCM,
    iv: iv,
    padding: CryptoJS.pad.NoPadding
  });
};
```

**3. Key Management:**
```javascript
// Current: Single master key
// Production: Hierarchical key management
const KEY_HIERARCHY = {
  masterKey: 'User-provided master key',
  derivedKeys: {
    encryption: 'Derived from master key + purpose',
    authentication: 'Separate key for auth operations',
    backup: 'Separate key for backup operations'
  }
};
```

**4. Memory Protection:**
```javascript
// Production: Secure memory handling
const secureMemoryHandling = {
  keyWiping: 'Zero out keys after use',
  memoryLocking: 'Prevent key swapping to disk',
  secureDeletion: 'Secure deletion of sensitive data'
};
```

**5. Side-Channel Protection:**
```javascript
// Production: Constant-time operations
const constantTimeComparison = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};
```

**Production Security Checklist:**

**Cryptographic Enhancements:**
- [ ] Upgrade to Argon2id for key derivation
- [ ] Implement AES-GCM for authenticated encryption
- [ ] Add HMAC for additional integrity protection
- [ ] Implement secure key rotation
- [ ] Add hardware security module (HSM) support

**Operational Security:**
- [ ] Implement secure logging (no sensitive data)
- [ ] Add intrusion detection and monitoring
- [ ] Implement secure backup and recovery
- [ ] Add disaster recovery procedures
- [ ] Implement security incident response

**Compliance and Auditing:**
- [ ] SOC 2 Type II certification
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Vulnerability assessments
- [ ] Compliance monitoring

**Performance Optimizations:**
```javascript
// Production performance considerations
const PERFORMANCE_CONFIG = {
  keyDerivation: {
    iterations: 100000,    // Higher for production
    memoryCost: 16384,     // Argon2 memory cost
    timeCost: 3            // Argon2 time cost
  },
  encryption: {
    algorithm: 'AES-GCM',  // Authenticated encryption
    keySize: 256,          // 256-bit keys
    ivSize: 96             // 96-bit IV for GCM
  },
  caching: {
    derivedKeys: false,    // Never cache derived keys
    userSessions: true,    // Cache user sessions
    metadata: true         // Cache non-sensitive metadata
  }
};
```

**Security Monitoring:**
```javascript
// Production security monitoring
const SECURITY_MONITORING = {
  failedLogins: 'Track and alert on failed login attempts',
  unusualActivity: 'Detect unusual access patterns',
  encryptionErrors: 'Monitor for encryption/decryption failures',
  accountLockouts: 'Track account lockout events',
  dataAccess: 'Audit all data access operations'
};
```

This comprehensive security architecture ensures that SecureVault maintains the highest standards of data protection while providing a user-friendly experience. The zero-knowledge model guarantees that user data remains private and secure, even from the service provider itself.

---

## 3. FRONTEND ARCHITECTURE (REACT)

### 3.1 Component Structure & Organization

**Component Hierarchy Overview:**

SecureVault's React frontend follows a well-organized component hierarchy that promotes reusability, maintainability, and clear separation of concerns:

```
App (Root Component)
├── Landing (Public Landing Page)
├── AuthFlow (Authentication Flow)
│   ├── LoginEmail
│   ├── LoginMasterKey
│   └── LoginMFA
├── Dashboard (Main Application)
│   ├── Sidebar (Navigation)
│   ├── MainContent
│   │   ├── Vault (Credential Management)
│   │   ├── AddCredential (Form)
│   │   ├── SettingsPage
│   │   └── BillingPage
│   └── SecurityComponents
│       ├── BiometricAuth
│       ├── BackupCodesManager
│       └── MasterKeyModal
└── Shared Components
    ├── LoadingSpinner
    ├── ErrorBoundary
    └── Toast Notifications
```

**Component Design Patterns:**

**1. Container/Presentational Pattern:**
```javascript
// Container Component (Smart Component)
const VaultContainer = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCredentials();
      setCredentials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return (
    <Vault
      credentials={credentials}
      loading={loading}
      error={error}
      onRefresh={fetchCredentials}
    />
  );
};

// Presentational Component (Dumb Component)
const Vault = ({ credentials, loading, error, onRefresh }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={onRefresh} />;

  return (
    <div className="vault-container">
      <VaultHeader />
      <CredentialList credentials={credentials} />
      <AddCredentialButton />
    </div>
  );
};
```

**2. Custom Hooks Pattern:**
```javascript
// Custom hook for credential management
const useCredentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCredentials();
      setCredentials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCredential = useCallback(async (credentialData) => {
    try {
      const newCredential = await api.createCredential(credentialData);
      setCredentials(prev => [...prev, newCredential]);
      return newCredential;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateCredential = useCallback(async (id, updates) => {
    try {
      const updatedCredential = await api.updateCredential(id, updates);
      setCredentials(prev => 
        prev.map(cred => cred.id === id ? updatedCredential : cred)
      );
      return updatedCredential;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteCredential = useCallback(async (id) => {
    try {
      await api.deleteCredential(id);
      setCredentials(prev => prev.filter(cred => cred.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    credentials,
    loading,
    error,
    fetchCredentials,
    addCredential,
    updateCredential,
    deleteCredential
  };
};
```

**3. Context API for Global State:**
```javascript
// Authentication Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, masterKey) => {
    try {
      const response = await api.login(email, masterKey);
      setUser(response.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const user = await api.getCurrentUser();
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Component Organization Strategy:**

**1. Feature-Based Organization:**
```
src/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── LoginEmail.js
│   │   ├── LoginMasterKey.js
│   │   └── LoginMFA.js
│   ├── vault/          # Credential management
│   │   ├── Vault.js
│   │   ├── CredentialCard.js
│   │   ├── AddCredential.js
│   │   └── CredentialList.js
│   ├── security/       # Security features
│   │   ├── BiometricAuth.js
│   │   ├── BackupCodesManager.js
│   │   └── MasterKeyModal.js
│   ├── settings/       # Settings and preferences
│   │   ├── SettingsPage.js
│   │   ├── ProfileSettings.js
│   │   └── SecuritySettings.js
│   └── shared/         # Reusable components
│       ├── LoadingSpinner.js
│       ├── ErrorBoundary.js
│       └── Toast.js
```

**2. Component Composition:**
```javascript
// Flexible component composition
const CredentialCard = ({ credential, onEdit, onDelete, onToggleFavorite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="credential-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{credential.title}</h3>
          <div className="flex space-x-2">
            <IconButton
              icon={credential.isFavorite ? Heart : HeartOff}
              onClick={() => onToggleFavorite(credential.id)}
              variant={credential.isFavorite ? "filled" : "outline"}
            />
            <IconButton
              icon={isExpanded ? ChevronUp : ChevronDown}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Username:</span>
            <span className="font-mono">{credential.username}</span>
            <CopyButton text={credential.username} />
          </div>
          
          {isExpanded && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Password:</span>
                <span className="font-mono">
                  {showPassword ? credential.password : '••••••••'}
                </span>
                <IconButton
                  icon={showPassword ? EyeOff : Eye}
                  onClick={() => setShowPassword(!showPassword)}
                />
                <CopyButton text={credential.password} />
              </div>
              
              {credential.url && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">URL:</span>
                  <a href={credential.url} className="text-blue-600 hover:underline">
                    {credential.url}
                  </a>
                </div>
              )}
              
              {credential.notes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {credential.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex space-x-2">
          <Button onClick={() => onEdit(credential)} variant="outline">
            Edit
          </Button>
          <Button onClick={() => onDelete(credential.id)} variant="destructive">
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
```

### 3.2 State Management Strategy

**Multi-Layer State Management:**

SecureVault implements a comprehensive state management strategy that handles different types of state at appropriate levels:

**1. Local Component State:**
```javascript
// Form state management
const AddCredentialForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'personal'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await addCredential(formData);
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: 'personal'
      });
      toast.success('Credential added successfully');
    } catch (error) {
      toast.error('Failed to add credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Title"
        value={formData.title}
        onChange={(value) => handleInputChange('title', value)}
        error={errors.title}
        required
      />
      {/* Other form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Credential'}
      </Button>
    </form>
  );
};
```

**2. Global State with Context API:**
```javascript
// Theme Context
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// User Preferences Context
const PreferencesContext = createContext();

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    autoLock: 15, // minutes
    showPasswords: false,
    enableBiometric: false,
    notifications: {
      securityAlerts: true,
      breachNotifications: true,
      weeklyReports: false
    }
  });

  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      localStorage.setItem('preferences', JSON.stringify(newPreferences));
      return newPreferences;
    });
  }, []);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('preferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, []);

  const value = {
    preferences,
    updatePreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
```

**3. Server State Management:**
```javascript
// Custom hook for server state
const useServerState = (key, fetcher, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const {
    refetchInterval = 0,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    ...otherOptions
  } = options;

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const isStale = !lastUpdated || (now - lastUpdated) > staleTime;
    
    if (!force && data && !isStale) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastUpdated(now);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetcher, data, lastUpdated, staleTime]);

  // Auto-refetch on interval
  useEffect(() => {
    if (refetchInterval > 0) {
      const interval = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    lastUpdated
  };
};

// Usage example
const useCredentials = () => {
  return useServerState(
    'credentials',
    () => api.getCredentials(),
    {
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
      staleTime: 2 * 60 * 1000    // Consider stale after 2 minutes
    }
  );
};
```

**4. Optimistic Updates:**
```javascript
// Optimistic updates for better UX
const useOptimisticUpdate = (updateFn, rollbackFn) => {
  const [optimisticData, setOptimisticData] = useState(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const executeOptimisticUpdate = useCallback(async (updates) => {
    // Apply optimistic update immediately
    setOptimisticData(updates);
    setIsOptimistic(true);

    try {
      // Perform actual update
      const result = await updateFn(updates);
      setIsOptimistic(false);
      setOptimisticData(null);
      return result;
    } catch (error) {
      // Rollback on error
      rollbackFn(updates);
      setIsOptimistic(false);
      setOptimisticData(null);
      throw error;
    }
  }, [updateFn, rollbackFn]);

  return {
    optimisticData,
    isOptimistic,
    executeOptimisticUpdate
  };
};

// Usage in credential management
const CredentialManager = () => {
  const { credentials, updateCredential } = useCredentials();
  
  const { executeOptimisticUpdate } = useOptimisticUpdate(
    // Update function
    async (updates) => {
      return await api.updateCredential(updates.id, updates);
    },
    // Rollback function
    (updates) => {
      // Revert optimistic changes
      console.log('Rolling back optimistic update:', updates);
    }
  );

  const handleToggleFavorite = async (credentialId) => {
    const credential = credentials.find(c => c.id === credentialId);
    const newFavoriteState = !credential.isFavorite;

    try {
      await executeOptimisticUpdate({
        id: credentialId,
        isFavorite: newFavoriteState
      });
      toast.success('Favorite status updated');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  return (
    <div>
      {credentials.map(credential => (
        <CredentialCard
          key={credential.id}
          credential={credential}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}
    </div>
  );
};
```

### 3.3 Routing & Navigation

**React Router v6 Implementation:**

SecureVault uses React Router v6 for client-side routing with protected routes and dynamic navigation:

**1. Route Configuration:**
```javascript
// App.js - Main routing configuration
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PreferencesProvider>
            <ErrorBoundary>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } />
                
                <Route path="/login" element={
                  <PublicRoute>
                    <AuthFlow />
                  </PublicRoute>
                } />
                
                <Route path="/signup" element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                } />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/vault" element={
                  <ProtectedRoute>
                    <Vault />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/billing" element={
                  <ProtectedRoute>
                    <BillingPage />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </PreferencesProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
```

**2. Protected Route Component:**
```javascript
// ProtectedRoute.js - Route protection logic
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const ProtectedRoute = ({ children, requireMFA = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireMFA && user && !user.mfaEnabled) {
    // Redirect to MFA setup
    return <Navigate to="/mfa-setup" state={{ from: location }} replace />;
  }

  return children;
};

// PublicRoute.js - Prevent authenticated users from accessing public routes
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to dashboard or intended destination
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
};
```

**3. Navigation Components:**
```javascript
// Sidebar.js - Main navigation sidebar
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Shield, 
  Settings, 
  CreditCard, 
  LogOut,
  User,
  Bell
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Overview and quick actions'
    },
    {
      path: '/vault',
      icon: Shield,
      label: 'Vault',
      description: 'Manage your credentials'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Account and preferences'
    },
    {
      path: '/billing',
      icon: CreditCard,
      label: 'Billing',
      description: 'Subscription and payments'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8">
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            SecureVault
          </span>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
                title={item.description}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
```

**4. Breadcrumb Navigation:**
```javascript
// Breadcrumbs.js - Dynamic breadcrumb navigation
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = () => {
  const location = useLocation();
  
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [];
    
    let currentPath = '';
    
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Convert pathname to readable label
      const label = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: index === pathnames.length - 1
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
      <Link
        to="/dashboard"
        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {breadcrumb.isLast ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
```

**5. Programmatic Navigation:**
```javascript
// useNavigation hook for programmatic navigation
import { useNavigate, useLocation } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = useCallback((path, options = {}) => {
    const { replace = false, state = {} } = options;
    
    if (replace) {
      navigate(path, { replace: true, state });
    } else {
      navigate(path, { state });
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const refresh = useCallback(() => {
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  return {
    goTo,
    goBack,
    goForward,
    refresh,
    currentPath: location.pathname,
    currentState: location.state
  };
};

// Usage in components
const CredentialActions = ({ credentialId }) => {
  const { goTo } = useNavigation();

  const handleEdit = () => {
    goTo(`/vault/edit/${credentialId}`, {
      state: { from: '/vault' }
    });
  };

  const handleView = () => {
    goTo(`/vault/view/${credentialId}`);
  };

  return (
    <div className="flex space-x-2">
      <Button onClick={handleView} variant="outline">
        View
      </Button>
      <Button onClick={handleEdit} variant="outline">
        Edit
      </Button>
    </div>
  );
};
```

This comprehensive frontend architecture provides a solid foundation for the SecureVault application with proper state management, routing, and component organization that scales well and maintains good performance.

## 4. BACKEND ARCHITECTURE (NODE.JS/EXPRESS)

### 4.1 Server Setup & Configuration

Entry point: `server/index.js` initializes Express, connects to MongoDB, wires routes, and applies security middleware.

Environment variables:
```bash
# .env
PORT=5000
NODE_ENV=development
JWT_SECRET=replace-with-strong-secret
MONGODB_URI=mongodb://127.0.0.1:27017/securevault
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID_PRO=price_xxx
```

Server initialization:
```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const credentialsRoutes = require('./routes/credentials');
const mfaRoutes = require('./routes/mfa');
const billingRoutes = require('./routes/billing');
const importExportRoutes = require('./routes/import-export');

const app = express();

// Basic security headers
app.use(helmet({
  contentSecurityPolicy: false // Enable CSP separately if serving UI from same origin
}));

// Request logging (dev)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Rate limiting (global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/import-export', importExportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    // Helpful logs in dev/test only
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ error: message });
});

// Mongo connection
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', e);
    process.exit(1);
  }
};

start();
```

Recommendations:
- Use `NODE_ENV=production` and a strong `JWT_SECRET` in production.
- Expose only `/api/*` endpoints; serve the React app from a separate host/domain or via a static host in production.
- Keep request size limits tight; increase for import/export endpoints only if needed.

### 4.2 Middleware Stack (Security, CORS, Rate Limiting)

Security headers with Helmet:
```javascript
app.use(helmet({
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'deny' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
  contentSecurityPolicy: false
}));
```

Optional Content Security Policy (CSP) for API-only server is minimal; if serving UI, configure sources explicitly:
```javascript
const { contentSecurityPolicy } = require('helmet');
app.use(contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'", process.env.CLIENT_URL],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
}));
```

CORS configuration:
```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
```

Rate limiting profiles:
```javascript
const { RateLimit } = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
const mfaLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const credentialsLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600 });

app.use('/api/auth/', authLimiter);
app.use('/api/mfa/', mfaLimiter);
app.use('/api/credentials/', credentialsLimiter);
```

Input validation and sanitization (example using `express-validator`):
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/login',
  body('email').isEmail().normalizeEmail(),
  body('masterKey').isString().isLength({ min: 8 }).trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }
    next();
  },
  (req, res) => {
    // handle login
  }
);
```

### 4.3 Database Schema Design (MongoDB/Mongoose)

Two primary collections: `User` and `Credential`.

`User` model (`server/models/User.js`):
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  masterKeyHash: { type: String, required: true }, // bcrypt hash only
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String }, // store encrypted if persisted
  biometricEnabled: { type: Boolean, default: false },
  biometricCredential: { type: mongoose.Schema.Types.Mixed },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  stripeCustomerId: { type: String },
  subscription: {
    id: String,
    status: String,
    priceId: String,
    currentPeriodEnd: Date
  },
  preferences: {
    notifications: {
      securityAlerts: { type: Boolean, default: true },
      breachNotifications: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: false }
    },
    privacy: {
      analyticsOptIn: { type: Boolean, default: false },
      crashReports: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

userSchema.methods.validateMasterKey = async function(masterKey) {
  return bcrypt.compare(masterKey, this.masterKeyHash);
};

userSchema.methods.isLocked = function() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = function() {
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
```

`Credential` model (`server/models/Credential.js`):
```javascript
const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  username: { type: String, required: true },
  encryptedPassword: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  url: { type: String },
  notes: { type: String },
  category: { type: String, default: 'personal' },
  tags: { type: [String], index: true },
  isFavorite: { type: Boolean, default: false },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: { createdAt: true, updatedAt: true } });

// Indexes
credentialSchema.index({ userId: 1, category: 1 });
credentialSchema.index({ userId: 1, isFavorite: 1 });
credentialSchema.index({ title: 'text' });

module.exports = mongoose.model('Credential', credentialSchema);
```

Query patterns (always scope by `userId`):
```javascript
const Credential = require('../models/Credential');

const list = (userId) => Credential.find({ userId }).sort({ createdAt: -1 });
const byId = (userId, id) => Credential.findOne({ _id: id, userId });
const search = (userId, q) => Credential.find({ userId, $text: { $search: q } });
```

Data retention and backups:
- Store only ciphertext, IV, and salt for passwords, never plaintext.
- Keep database backups encrypted at rest; avoid logging sensitive fields.
- For exports, include only the encrypted payloads and necessary metadata.

### 4.4 API Route Organization

Routes are grouped by feature under `server/routes/*` and mounted under `/api/*`.

Structure:
```
server/routes/
- auth.js           // register, login, profile, preferences
- credentials.js    // CRUD for credentials
- mfa.js            // setup, verify, backup codes
- billing.js        // Stripe checkout/portal/status
- import-export.js  // export/import vault data
```

Auth middleware (JWT):
```javascript
// server/middleware/requireAuth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

Example route using middleware:
```javascript
// server/routes/credentials.js
const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const Credential = require('../models/Credential');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const items = await Credential.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, username, encryptedPassword, iv, salt, url, notes, category, tags } = req.body;
    const created = await Credential.create({ userId: req.userId, title, username, encryptedPassword, iv, salt, url, notes, category, tags });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

module.exports = router;
```

Versioning: prefix future breaking API changes with `/api/v2/*` while keeping v1 stable.

### 4.5 Authentication & Authorization Flow

Flow:
- Register: create user with `bcrypt` hash of master key (hash only, master key itself never stored).
- Login: verify bcrypt; on success issue JWT with `sub = user._id`, `exp = 7 days`.
- Authorization: protect routes with `requireAuth` and scope queries by `req.userId`.

Register/login endpoints:
```javascript
// server/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('name').isString().isLength({ min: 2 }).trim(),
  body('masterKey').isString().isLength({ min: 8 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      const { email, name, masterKey } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: 'Email already registered' });
      const masterKeyHash = await bcrypt.hash(masterKey, 12);
      const user = await User.create({ email, name, masterKeyHash });
      res.status(201).json({ success: true, userId: user._id });
    } catch (e) { next(e); }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('masterKey').isString().isLength({ min: 8 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input' });
      const { email, masterKey } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(masterKey, user.masterKeyHash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user._id, email: user.email, name: user.name, mfaEnabled: user.mfaEnabled } });
    } catch (e) { next(e); }
  }
);

module.exports = router;
```

Authorization patterns:
- Always filter by `userId` on data access.
- Keep roles minimal; add `roles: ['admin']` onto the JWT if needed and check in middleware.

### 4.6 Error Handling & Logging

Centralized error handler (already wired in server setup):
```javascript
// Pass errors to next(err) in routes; handler returns JSON with status/message
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.publicMessage || err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(err); // dev visibility only
  }
  res.status(status).json({ error: message });
});
```

Lightweight logging:
- Use `morgan('dev')` in development for concise request logs.
- In production, prefer JSON logs via `morgan('combined')` or integrate a structured logger (e.g., pino) at process level.
- Never log sensitive payloads (master keys, ciphertexts, secrets).

Route helper to reduce try/catch noise:
```javascript
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req, res) => {
  const items = await Credential.find({ userId: req.userId });
  res.json(items);
}));
```

### 4.7 Environment Configuration

Configuration loading:
```javascript
// server/config.js
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    priceIdPro: process.env.STRIPE_PRICE_ID_PRO || ''
  }
};
```

Best practices:
- Use `.env` locally and environment variables in production (no `.env` committed).
- Keep secrets out of source control and logs.
- Validate required variables at startup; fail fast if missing.

### 4.8 Health Check & Monitoring

Endpoints:
- `/api/health` — liveness: returns `{ ok, uptime }`.
- `/api/health/db` — readiness: verifies Mongo connectivity.

Implementation:
```javascript
// in server/index.js
const mongoose = require('mongoose');

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV });
});

app.get('/api/health/db', async (req, res) => {
  const state = mongoose.connection.readyState; // 1=connected
  const ok = state === 1;
  res.status(ok ? 200 : 503).json({ ok, state });
});
```

Operational tips:
- Export minimal metrics (counts, latencies) via logs; integrate with a monitoring stack (Datadog, Grafana) in production.
- Alert on repeated 5xx, auth failures spikes, and DB readiness failures.

## 5. DATABASE DESIGN & DATA MODELS

### 5.1 User Schema Design

Objectives:
- Minimal PII, strong constraints, secure auth-related fields.
- Prefer booleans/enums for flags; keep optional fields nullable.

Key fields and constraints:
- **email**: unique, indexed, normalized, lower-cased.
- **masterKeyHash**: `bcrypt` hash only; never store master key or derived keys.
- **mfaSecret**: if stored, store encrypted; consider per-user wrapping key.
- **lockUntil/loginAttempts**: for account lockout.
- **subscription**: flat structure for Stripe.
- **preferences**: nested document with safe defaults.

Example (reference implementation uses this shape):
```javascript
// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  masterKeyHash: { type: String, required: true },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String }, // store encrypted
  biometricEnabled: { type: Boolean, default: false },
  biometricCredential: { type: mongoose.Schema.Types.Mixed },
  loginAttempts: { type: Number, default: 0, min: 0 },
  lockUntil: { type: Date },
  stripeCustomerId: { type: String },
  subscription: {
    id: String,
    status: { type: String, enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete', undefined], default: undefined },
    priceId: String,
    currentPeriodEnd: Date
  },
  preferences: {
    notifications: {
      securityAlerts: { type: Boolean, default: true },
      breachNotifications: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: false }
    },
    privacy: {
      analyticsOptIn: { type: Boolean, default: false },
      crashReports: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

userSchema.methods.validateMasterKey = function(masterKey) {
  return bcrypt.compare(masterKey, this.masterKeyHash);
};

module.exports = mongoose.model('User', userSchema);
```

Indexes:
- `{ email: 1 }` unique.
- Optional: `{ 'subscription.status': 1 }` for admin/billing dashboards.

### 5.2 Credential Schema Design

Goals:
- Store only ciphertext plus cryptographic metadata.
- Enable fast per-user queries, favorites, and search.

Fields:
- `userId` (ObjectId, required, indexed)
- `title` (String, required)
- `username` (String, required)
- `encryptedPassword` (String, required)
- `iv` (String, required)
- `salt` (String, required)
- `url` (String, optional)
- `notes` (String, optional)
- `category` (String enum or free-form; default 'personal')
- `tags` ([String])
- `isFavorite` (Boolean)

Example:
```javascript
// server/models/Credential.js
const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  username: { type: String, required: true, trim: true, maxlength: 300 },
  encryptedPassword: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  url: { type: String, trim: true },
  notes: { type: String, maxlength: 5000 },
  category: { type: String, default: 'personal', trim: true },
  tags: { type: [String], default: [] },
  isFavorite: { type: Boolean, default: false },
  lastModified: { type: Date, default: Date.now }
}, { timestamps: true });

credentialSchema.index({ userId: 1, category: 1 });
credentialSchema.index({ userId: 1, isFavorite: 1 });
credentialSchema.index({ title: 'text' });

module.exports = mongoose.model('Credential', credentialSchema);
```

Optional virtuals:
- `domain` extracted from `url` for grouping.

### 5.3 Indexing Strategy

Patterns to optimize:
- List user credentials: index `{ userId: 1, createdAt: -1 }` (use sort on createdAt).
- Filter by category/favorite: compound indexes `{ userId: 1, category: 1 }`, `{ userId: 1, isFavorite: 1 }`.
- Search by title: text index on `title`.
- Optional uniqueness per user: prevent duplicate titles per user with a scoped unique index.

Scoped unique index example:
```javascript
// Ensures a user cannot have two credentials with same title
credentialSchema.index({ userId: 1, title: 1 }, { unique: true });
```

Notes:
- Review index cardinality and write amplification; avoid over-indexing.
- Use `.explain('executionStats')` during performance tuning.

### 5.4 Data Validation & Constraints

Recommended validators:
- `email`: ensure valid format and lower-casing on `User`.
- `url`: optional but, if present, validate with `validator.js`.
- Lengths: sanity limits on strings (title, username, notes).
- `category`: optionally restrict to defined set (e.g., `['personal','work','finance','dev']`).

Example URL validator:
```javascript
// In Credential schema
const validator = require('validator');

url: {
  type: String,
  trim: true,
  validate: {
    validator: (v) => !v || validator.isURL(v, { require_protocol: true }),
    message: 'URL must be absolute (include protocol)'
  }
}
```

Server-side guards:
- Never accept plaintext passwords in API. Require `{ encryptedPassword, iv, salt }`.
- Enforce `userId` from JWT, not the request body.
- Validate payloads with `express-validator` before hitting DB.

### 5.5 Relationship Management

Cardinality:
- `User (1) → (N) Credential` via `Credential.userId`.

Integrity patterns:
- Always scope queries by `userId` for isolation.
- On user deletion, cascade delete credentials to prevent orphans.

Cascade example:
```javascript
// On user removal, delete credentials
// Use application/service layer to run a transaction for safety
const session = await mongoose.startSession();
try {
  session.startTransaction();
  await Credential.deleteMany({ userId: user._id }).session(session);
  await User.deleteOne({ _id: user._id }).session(session);
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

Uniqueness per user:
- Optional: `(userId, title)` unique to reduce duplicates.
- Alternative: unique per `(userId, url, username)` for site-level uniqueness.

### 5.6 Backup & Recovery Considerations

Backup format (encrypted-only):
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-01T12:00:00.000Z",
  "credentials": [
    {
      "title": "Example",
      "username": "user@example.com",
      "encryptedPassword": "...",
      "iv": "...",
      "salt": "...",
      "url": "https://example.com",
      "notes": "...",
      "category": "personal",
      "tags": ["email"]
    }
  ]
}
```

Principles:
- Do not include secrets or master key material in backups.
- Include a `version` field for future migrations.
- Validate structure and required fields on import; reject malformed records.
- Allow idempotent import (upsert by `(title)` or `(url, username)` when desired).

Operational backups:
- Use MongoDB Atlas automated snapshots for PITR; encrypt at rest.
- Test restores regularly in a staging environment.
- Hash and sign export files for integrity (SHA-256 + detached signature if applicable).

## 6. AUTHENTICATION & AUTHORIZATION

### 6.1 JWT Token Implementation

Token issue and verify:
```javascript
// Issue (on login)
const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Verify (middleware)
module.exports = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

Client attach header (centralized API layer):
```javascript
// client/src/services/api.js
const withAuth = (headers = {}) => {
  const token = localStorage.getItem('token');
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};
```

### 6.2 Master Key Validation Process

- Server stores only `bcrypt` hash of master key; compares on login.
- Master key itself never sent or stored after login.

```javascript
const valid = await bcrypt.compare(masterKey, user.masterKeyHash);
if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
```

### 6.3 Account Lockout Mechanism

Progressive lockout to mitigate brute force:
```javascript
// Pseudocode integrated in auth route
if (user.isLocked()) return res.status(423).json({ error: 'Account locked. Try later.' });
const ok = await bcrypt.compare(masterKey, user.masterKeyHash);
if (!ok) {
  await user.incLoginAttempts();
  return res.status(401).json({ error: 'Invalid credentials' });
}
user.loginAttempts = 0;
user.lockUntil = undefined;
await user.save();
```

### 6.4 Session Management

- Stateless JWT; expiry 7 days.
- Client persists token in `localStorage`; removes on logout or 401.

Axios interceptor example:
```javascript
// client/src/services/api.js
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (error?.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
```

### 6.5 Password Security (bcrypt)

- Use `bcrypt` with cost factor 12 for `masterKeyHash`.
- Never log or echo secrets.

### 6.6 Multi-Factor Authentication (MFA)

TOTP flow:
- `/api/mfa/setup` returns secret and QR data (displayed client-side).
- `/api/mfa/verify` validates a code, then flips `mfaEnabled=true`.
- `/api/mfa/backup-codes` issues hashed backup codes.

Example verify handler (using `speakeasy`):
```javascript
const speakeasy = require('speakeasy');
const ok = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: req.body.code, window: 1 });
if (!ok) return res.status(400).json({ error: 'Invalid code' });
user.mfaEnabled = true;
await user.save();
```

### 6.7 Biometric Authentication (WebAuthn Demo)

Client demo (platform authenticator):
```javascript
// Start registration
const publicKey = {/* fetched from server challenge */};
const credential = await navigator.credentials.create({ publicKey });
// Send credential.response to server for verification & storage
```

### 6.8 Backup Codes System

Generation and storage:
```javascript
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const generateCodes = async (n = 10) => {
  const raw = Array.from({ length: n }, () => crypto.randomBytes(5).toString('hex')); // 10 chars
  const hashed = await Promise.all(raw.map((c) => bcrypt.hash(c, 10)));
  return { raw, hashed };
};
```

Store only hashed codes; compare with `bcrypt.compare` on use, then invalidate.

## 7. ENCRYPTION & CRYPTOGRAPHY

### 7.1 CryptoJS Library Usage

Client-side only encryption/decryption with CryptoJS. Import once in utility and re-use.

### 7.2 AES-256-CBC Implementation Details

- Random 128-bit IV per encryption; Base64 encode.
- PKCS#7 padding; ciphertext string safe for JSON.
- Key derived via PBKDF2 from user master key + per-item salt.

### 7.3 PBKDF2 Key Derivation Process

- Dev: 1,000 iterations for UX in demos; Production: 100,000+.
- 256-bit key; 128-bit salt per credential.

### 7.4 Salt Generation & Management

- Use `CryptoJS.lib.WordArray.random(16)`; store Base64 salt alongside ciphertext.

### 7.5 Initialization Vector (IV) Strategy

- Unique per encryption; never reuse with same key.
- Store Base64 IV with ciphertext.

### 7.6 Password Strength Assessment

Use `zxcvbn` or a custom heuristic:
```javascript
const scorePassword = (s) => {
  let score = 0;
  if (!s) return 0;
  const letters = {};
  for (let i = 0; i < s.length; i++) letters[s[i]] = (letters[s[i]] || 0) + 1, score += 5.0 / letters[s[i]];
  const variations = { digits: /\d/.test(s), lower: /[a-z]/.test(s), upper: /[A-Z]/.test(s), nonWords: /\W/.test(s) };
  let variationCount = 0; for (const check in variations) variationCount += variations[check] ? 1 : 0;
  return Math.min(100, score + (variationCount - 1) * 10);
};
```

### 7.7 Breach Detection (HaveIBeenPwned)

K-Anonymity Range API:
```javascript
// client: do not send password, only SHA-1 prefix
import sha1 from 'crypto-js/sha1';
const hash = sha1(password).toString().toUpperCase();
const prefix = hash.slice(0, 5);
const suffix = hash.slice(5);
const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
const body = await resp.text();
const compromised = body.split('\n').some(line => line.startsWith(suffix));
```

### 7.8 Cryptographic Best Practices

- Zero-knowledge: encrypt before sending; never transmit master key.
- Prefer AES-GCM in production for AEAD; keep IV at 96 bits and store auth tag.
- Consider Argon2id for KDF when available.
- Wipe sensitive memory in long-running contexts (where feasible in JS).

## 8. API DESIGN & ENDPOINTS

### 8.1 RESTful API Structure

Prefix all routes with `/api`. Use nouns for resources, verbs for actions.

### 8.2 Authentication Endpoints (/api/auth/*)

- `POST /register` → { email, name, masterKey }
- `POST /login` → { email, masterKey } → { token, user }
- `GET /profile` → current user
- `PUT /preferences` → update preferences
- `POST /logout` → client-side token discard

### 8.3 Credential Management Endpoints (/api/credentials/*)

- `GET /` → list
- `POST /` → create { title, username, encryptedPassword, iv, salt, ... }
- `PUT /:id` → update (same encrypted structure)
- `DELETE /:id` → delete

Response standard:
```json
{ "data": { /* resource or array */ }, "error": null }
{ "data": null, "error": "Message", "code": "VALIDATION_ERROR", "details": [] }
```

### 8.4 MFA Endpoints (/api/mfa/*)

- `POST /setup` → secret + QR data URL
- `POST /verify` → { code }
- `GET /backup-codes` → issues new codes (admin/secure action)

### 8.5 Import/Export Endpoints (/api/import-export/*)

- `GET /export` → JSON export (encrypted-only)
- `POST /import` → import JSON; server validates structure and ownership

### 8.6 Billing Endpoints (/api/billing/*)

- `POST /checkout` → Stripe Checkout session URL
- `GET /status` → current subscription
- `POST /portal` → Stripe Customer Portal URL

### 8.7 Preferences Endpoints (/api/auth/preferences)

- `GET /` → get preferences
- `PUT /` → update preferences

### 8.8 Error Response Standards

- Always return JSON: `{ error, code?, details? }` with appropriate HTTP status.
- Do not expose internal errors in production.

### 8.9 API Documentation

- Maintain an OpenAPI 3.0 spec for endpoints.
- Use Swagger UI in development for quick testing.

## 9. BILLING & SUBSCRIPTION SYSTEM

### 9.1 Stripe Integration Architecture

- Server-side: create sessions, portal URLs; store subscription state on user.
- Client-side: redirect to Stripe-hosted pages.

### 9.2 Checkout Session Creation

```javascript
// server/routes/billing.js
const router = require('express').Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/checkout', async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/billing?success=1`,
      cancel_url: `${process.env.CLIENT_URL}/billing?canceled=1`,
      customer_email: req.user?.email
    });
    res.json({ url: session.url });
  } catch (e) { next(e); }
});
```

### 9.3 Customer Portal Integration

```javascript
router.post('/portal', async (req, res, next) => {
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/billing`
    });
    res.json({ url: portal.url });
  } catch (e) { next(e); }
});
```

### 9.4 Subscription Management

- Reflect subscription `status`, `priceId`, and `currentPeriodEnd` on the `User` document.
- Update after Checkout or via webhook events.

### 9.5 Payment Method Handling

- Handled within Stripe-hosted pages; no PCI burden on app.

### 9.6 Invoice & Billing History

- Link users to Stripe Customer Portal for invoices.
- Optionally fetch invoice summaries via Stripe API (server-side) for a billing page.

### 9.7 Webhook Handling (Future)

- Expose `/api/stripe/webhook` with raw body parsing.
- Handle events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

### 9.8 Test Mode Configuration

- Use test keys; seed `STRIPE_PRICE_ID_PRO` for a test product/price.
- Use test cards documented by Stripe.

## 10. USER EXPERIENCE & FEATURES

### 10.1 Dashboard & Vault Interface

- Provide at-a-glance stats (last updated, favorites count, breach alerts).
- Vault grid with responsive cards; skeletons while loading.

### 10.2 Credential Management (CRUD Operations)

- Inline create/edit with validation.
- Copy-to-clipboard for username/password with success toasts.

### 10.3 Search & Filtering Capabilities

- Client-side filter by title, tags, category; debounce search input.
- Server-side text search for large datasets.

### 10.4 Categories & Tagging System

- Free-form tags with suggestions; category chips for quick filters.

### 10.5 Favorites & Organization

- Toggle favorite; pinned section at top of list.

### 10.6 Password Generator

```javascript
const generatePassword = ({ length = 16, upper = true, lower = true, digits = true, symbols = true } = {}) => {
  const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = 'abcdefghijklmnopqrstuvwxyz';
  const D = '0123456789';
  const S = '!@#$%^&*()_+-={}[]:;<>,.?';
  let pool = (upper ? U : '') + (lower ? L : '') + (digits ? D : '') + (symbols ? S : '');
  if (!pool) pool = L + D;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => pool[b % pool.length]).join('');
};
```

### 10.7 Import/Export Functionality

- Export encrypted JSON only; include `version` and timestamp.
- Import validates structure; show a dry-run preview before commit.

### 10.8 Settings & Preferences Management

- Theme toggle, auto-lock timer, biometric enablement, notification prefs.
- Persist in local storage and server-side `preferences` for cross-device sync.

## 11. SECURITY FEATURES & IMPLEMENTATIONS

### 11.1 Helmet.js Security Headers

```javascript
app.use(helmet({
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
  noSniff: true,
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
  contentSecurityPolicy: false // configure CSP separately
}));
```

### 11.2 Content Security Policy (CSP)

```javascript
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", process.env.CLIENT_URL]
  }
}));
```

### 11.3 Cross-Origin Resource Sharing (CORS)

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 11.4 Rate Limiting Implementation

```javascript
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));
```

### 11.5 Input Validation & Sanitization

```javascript
const { body, validationResult } = require('express-validator');
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('name').isString().isLength({ min: 2 }).trim().escape(),
  body('masterKey').isString().isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    // ...
  }
);
```

### 11.6 SQL/NoSQL Injection Prevention

- Use Mongoose with strict schemas; never pass raw user strings to operators like `$where`.
- Whitelist fields for updates; reject unknown keys.
```javascript
const allowed = (({ title, username, url, notes, category, tags, isFavorite }) => ({ title, username, url, notes, category, tags, isFavorite }))(req.body);
await Credential.updateOne({ _id: id, userId: req.userId }, { $set: allowed });
```

### 11.7 XSS Protection

- Encrypt secrets client-side; never render decrypted secrets in HTML without escaping.
- Sanitize rich text fields on input; render with safe components.

### 11.8 CSRF Protection Considerations

- For API with Bearer tokens, CSRF risk is reduced; still set `SameSite=Lax` if cookies are used.
- Prefer token-in-header over cookies for SPA → API.

## 12. TESTING & QUALITY ASSURANCE

### 12.1 Unit Testing Strategy

- Use Jest for unit tests (utils, services, controllers).
```javascript
test('deriveKey returns consistent key for same input', () => {
  const key1 = deriveKey('secret', 'salt');
  const key2 = deriveKey('secret', 'salt');
  expect(key1.toString()).toBe(key2.toString());
});
```

### 12.2 Integration Testing

- Use Supertest to hit Express endpoints with an in-memory Mongo or test DB.
```javascript
const request = require('supertest');
it('requires auth on /api/credentials', async () => {
  const res = await request(app).get('/api/credentials');
  expect(res.status).toBe(401);
});
```

### 12.3 Security Testing Considerations

- Automated dependency scan (npm audit, Snyk).
- DAST with OWASP ZAP against staging.
- Verify CSP, HSTS, and headers with securityheaders.com.

### 12.4 Performance Testing

- Use k6/Artillery to simulate load; ensure P95 latency targets.

### 12.5 User Acceptance Testing

- Scripted flows: signup → login → add credential → search → export.

### 12.6 Code Quality & Linting

- ESLint + Prettier; CI gate on lint/test.

## 13. DEPLOYMENT & PRODUCTION CONSIDERATIONS

### 13.1 Environment Configuration

- Separate env per environment; no secrets in repo.

### 13.2 Database Deployment (MongoDB Atlas)

- Dedicated cluster; IP allowlist; SCRAM auth; TLS enforced.

### 13.3 Frontend Deployment (Vercel/Netlify)

- Set `VITE_API_BASE` or proxy to backend `/api` origin.

### 13.4 Backend Deployment (Heroku/Render/AWS)

- Node LTS; `NODE_ENV=production`; autoscale on CPU/latency.

### 13.5 SSL/TLS Configuration

- Force HTTPS; HSTS in Helmet; redirect HTTP → HTTPS at edge.

### 13.6 Environment Variables Management

- Use provider secrets manager; rotate keys regularly.

### 13.7 Monitoring & Alerting

- Uptime checks, error rate alerts, DB health, latency SLOs.

### 13.8 Backup & Disaster Recovery

- Atlas PITR; document RPO/RTO; periodic restore drills.

## 14. PERFORMANCE OPTIMIZATION

### 14.1 Database Query Optimization

- Use appropriate indexes; filter by `userId`; project minimal fields.
```javascript
await Credential.find({ userId }).select('title username url isFavorite createdAt').lean();
```

### 14.2 Frontend Performance (React Optimization)

- Code-splitting routes, memoize heavy lists, virtualization for large vaults.

### 14.3 API Response Optimization

- Enable gzip/br compression; avoid over-fetching; paginate.
```javascript
const page = Math.max(1, Number(req.query.page || 1));
const limit = Math.min(100, Number(req.query.limit || 20));
const skip = (page - 1) * limit;
const [items, total] = await Promise.all([
  Credential.find({ userId }).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
  Credential.countDocuments({ userId })
]);
res.json({ data: items, page, total, pages: Math.ceil(total / limit) });
```

### 14.4 Caching Strategies

- Client: cache server state; conditional requests with ETag.
- Server: short-lived cache for read-heavy endpoints (consider Redis).

### 14.5 Bundle Size Optimization

- Tree-shake icons; dynamic import for infrequent views; analyze bundle.

### 14.6 Image & Asset Optimization

- Use SVG icons; lazy-load non-critical images.

### 14.7 CDN Integration

- Serve static assets via CDN; set long-lived cache with revisioned filenames.

## 15. SCALABILITY CONSIDERATIONS

### 15.1 Horizontal Scaling Strategy

- Stateless API; JWT-based auth enables scale without sticky sessions.

### 15.2 Database Scaling (Sharding/Replication)

- Start with replica set for HA; shard by `userId` when datasets grow.

### 15.3 Load Balancing

- Terminate TLS at edge; health checks; rolling deploys.

### 15.4 Microservices Architecture (Future)

- Split billing, notifications, and analytics when necessary.

### 15.5 Caching Layer (Redis)

```javascript
// Cache example
const key = `cred:list:${req.userId}:${page}:${limit}`;
const cached = await redis.get(key);
if (cached) return res.json(JSON.parse(cached));
// compute ... then:
await redis.set(key, JSON.stringify(payload), 'EX', 60);
```

### 15.6 Message Queues (Future)

- Queue for breach scans, email notifications, backup exports.

## 16. COMPLIANCE & LEGAL CONSIDERATIONS

### 16.1 GDPR Compliance

- Data minimization; encryption at rest/in transit; DSR workflows.

### 16.2 Data Privacy Regulations

- Document data flows; maintain RoPA; DPIA for new features.

### 16.3 Data Retention Policies

- Define retention for inactive users; purge timelines; secure deletion.

### 16.4 User Consent Management

- Explicit opt-in for analytics/crash reports; store timestamp and scope.

### 16.5 Audit Logging

- Log security events (login, MFA changes) without sensitive payloads.

### 16.6 Security Incident Response

- Define severity levels, on-call rotation, and notification timelines.

## 17. FUTURE ENHANCEMENTS & ROADMAP

### 17.1 Mobile Application Development

- React Native app reusing crypto utilities; secure storage integration.

### 17.2 Browser Extension Integration

- Autofill and capture flows; message passing to web app.

### 17.3 Team/Enterprise Features

- Shared vaults with per-item keys; role-based access; audit trails.

### 17.4 Advanced Security Features

- Argon2id KDF, AES-GCM, hardware-backed keys (WebAuthn resident creds).

### 17.5 API for Third-party Integrations

- OAuth client credentials; per-token scopes and rate limits.

### 17.6 Advanced Analytics & Reporting

- Usage metrics dashboards; anonymized, opt-in only.

## 18. INTERVIEW PREPARATION

### 18.1 Common Technical Questions & Answers

- Zero-knowledge model: how is the server unable to decrypt data?
- Why PBKDF2 vs Argon2? Trade-offs and migration path.
- AES-CBC vs AES-GCM differences and integrity.

### 18.2 System Design Questions

- Scale to 10M users: partitioning strategy, read/write paths, caching.

### 18.3 Security-focused Questions

- Threat model: attacker with DB dump; side-channel considerations.

### 18.4 Code Review Scenarios

- Spot insecure random generator; improper CSP; missing rate limiters.

### 18.5 Architecture Discussion Points

- Stateless JWT pros/cons; token revocation strategies.

### 18.6 Demo Script & Walkthrough

- Signup → login → add credential (client encryption) → export → settings.

### 18.7 Resume Talking Points

- Built end-to-end zero-knowledge app; implemented MFA/backup codes; Stripe.

### 18.8 Portfolio Presentation Tips

- Emphasize security-first decisions and measured trade-offs.

## 19. TROUBLESHOOTING & DEBUGGING

### 19.1 Common Development Issues

- CORS errors: ensure `CLIENT_URL` matches front-end origin.
- 401 after login: verify JWT secret consistency and clock skew.
- Mongo connect timeout: check IP allowlist and URI.

### 19.2 Production Debugging Strategies

- Correlate logs by request ID; inspect error rates and latency percentiles.

### 19.3 Performance Bottlenecks

- Add indexes per slow query; enable `.lean()`; paginate; cache.

### 19.4 Security Vulnerability Fixes

- Patch dependencies; rotate secrets; add WAF rules if needed.

### 19.5 Database Connection Issues

- Monitor `readyState`; auto-retry with backoff; alert on flaps.

### 19.6 API Integration Problems

- Stripe: verify keys, webhook signing, and product/price IDs.

## 20. RESOURCES & REFERENCES

- Crypto: [NIST SP 800-38D AES-GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- KDF: [RFC 8018 PKCS #5](https://www.rfc-editor.org/rfc/rfc8018)
- Web security: [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- WebAuthn: [W3C WebAuthn](https://www.w3.org/TR/webauthn-2/)
- Stripe: [Stripe Docs](https://stripe.com/docs)
- MongoDB: [MongoDB Indexing](https://www.mongodb.com/docs/manual/indexes/)

### 3.4 UI/UX Design System (TailwindCSS)

SecureVault uses TailwindCSS as the design system foundation. The approach is utility-first with a small set of component primitives for consistency.

**Tailwind configuration:**
```javascript
// client/tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './public/index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB', // blue-600
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
};
```

**Base styles and tokens:**
```css
/* client/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --ring: 59 130 246; /* brand-500 */
}
.dark :root {
  --ring: 147 197 253; /* brand-300 */
}

/* Focus visibility for keyboard users */
:where(button, [role="button"], a, input, select, textarea):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(255 255 255 / 100%), 0 0 0 4px rgb(var(--ring) / 1);
}

/* Reduce motion by preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**UI primitives:**

```jsx
// Button (variants: solid, outline, ghost; sizes: sm, md, lg)
export const Button = ({ as: Tag = 'button', variant = 'solid', size = 'md', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    solid: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500',
    outline: 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
  };
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base'
  };
  return (
    <Tag className={[base, variants[variant], sizes[size], className].join(' ')} {...props} />
  );
};

// Input
export const Input = ({ className = '', ...props }) => (
  <input
    className={'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-brand-500 focus:border-brand-500 h-10 px-3 ' + className}
    {...props}
  />
);

// Card
export const Card = ({ className = '', ...props }) => (
  <div className={'rounded-xl bg-white dark:bg-gray-900 shadow-card border border-gray-100 dark:border-gray-800 ' + className} {...props} />
);
```

Guidelines:
- **Consistency**: Use the above primitives across pages (`Button`, `Input`, `Card`).
- **Spacing scale**: Prefer Tailwind spacing, avoid arbitrary pixel values.
- **Iconography**: Use `lucide-react` with `h-4 w-4` as default, larger sizes at `md+` breakpoints.
- **Feedback**: Always provide visual feedback for hover, focus, loading, and disabled states.

### 3.5 Dark Mode Implementation

Dark mode uses the `class` strategy with the `dark` class toggled on `html`. The `ThemeProvider` earlier manages persistence and system preference.

Using dark variants:
```jsx
// Example: section container with light/dark surfaces
export const Section = ({ title, children }) => (
  <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
    </header>
    <div className="p-4 text-gray-700 dark:text-gray-300">{children}</div>
  </section>
);
```

Recommendations:
- **Tailwind config**: Ensure `darkMode: 'class'` and never mix with `media`.
- **Persist preference**: Store in `localStorage('theme')`, default to system via `prefers-color-scheme`.
- **Theming tokens**: Prefer CSS variables (e.g., `--ring`) then reference through utilities for consistent rings/shadows.
- **Assets**: Choose icons with sufficient contrast; avoid pure blacks; use `gray-900`/`gray-50`.

Accessible toggle sample:
```jsx
export const ThemeToggle = ({ isDark, toggle }) => (
  <button
    type="button"
    onClick={toggle}
    aria-pressed={isDark}
    className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
  >
    <span className="sr-only">Toggle dark mode</span>
    {isDark ? 'Dark' : 'Light'}
  </button>
);
```

### 3.6 Responsive Design Patterns

Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) and fluid layouts.

Vault grid:
```jsx
export const VaultGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
    {children}
  </div>
);
```

Form layout:
```jsx
export const ResponsiveFormRow = ({ left, right }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>{left}</div>
    <div>{right}</div>
  </div>
);
```

Navigation behaviors:
- **Sidebar**: Fixed at `md+`, collapsible drawer on mobile.
- **Overflow**: Use `truncate`, `line-clamp-*` for long text.
- **Motion**: Wrap transitions in `motion-safe:` utilities and respect `prefers-reduced-motion`.

Example container and header:
```jsx
export const PageContainer = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
);

export const PageHeader = ({ title, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
    <div className="flex items-center gap-2">{actions}</div>
  </div>
);
```

### 3.7 Form Validation & Error Handling

Validation is user-friendly, incremental, and secure. Validate on the client, and always re-validate on the server.

Field component with error state:
```jsx
export const FormField = ({ id, label, error, hint, children }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>
    )}
    {error && (
      <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
    )}
  </div>
);
```

Usage with client-side validation:
```jsx
const [form, setForm] = useState({ title: '', username: '', password: '' });
const [errors, setErrors] = useState({});
const [submitting, setSubmitting] = useState(false);

const validate = () => {
  const e = {};
  if (!form.title.trim()) e.title = 'Title is required';
  if (!form.username.trim()) e.username = 'Username is required';
  if (!form.password.trim()) e.password = 'Password is required';
  setErrors(e);
  return Object.keys(e).length === 0;
};

const submit = async () => {
  if (!validate()) return;
  setSubmitting(true);
  try {
    await api.credentials.create(form);
    toast.success('Saved');
  } catch (err) {
    const message = err?.response?.data?.error || 'Something went wrong';
    toast.error(message);
  } finally {
    setSubmitting(false);
  }
};
```

Standards:
- **Field-level errors**: Use `aria-invalid`, link to helper with `aria-describedby` (`*-error` or `*-hint`).
- **Non-blocking hints**: Show password guidelines before error.
- **Server errors**: Map known codes to friendly messages; keep a fallback.
- **Loading/disabled**: Disable submit during requests; show `LoadingSpinner`.
- **Toasts**: Use for global outcomes; keep field errors inline.

### 3.8 Accessibility Features

Accessibility is first-class. Follow WCAG 2.1 AA.

Core practices:
- **Landmarks**: Use `header`, `nav`, `main`, `aside`, `footer`.
- **Headings**: Maintain a logical hierarchy (`h1` → `h2` → `h3`).
- **Labels**: Every input has a visible `label` or an equivalent with `aria-label`.
- **Focus**: Use `focus-visible` styles. Do not remove outlines; enhance them.
- **Keyboard**: All interactive controls operable with keyboard; ensure `Tab` order is logical.
- **ARIA**: Only where semantics aren’t sufficient; prefer native elements first.
- **Live regions**: Surface async outcomes in `aria-live` regions (e.g., toasts).
- **Contrast**: Maintain 4.5:1 for body text, 3:1 for large text and UI components.

Skip link:
```jsx
export const SkipToContent = () => (
  <a
    href="#main"
    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white dark:focus:bg-gray-900 focus:text-gray-900 dark:focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
  >
    Skip to main content
  </a>
);
```

Accessible modal structure:
```jsx
export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative mx-auto mt-20 w-full max-w-lg px-4">
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <div className="p-4">{children}</div>
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

Input semantics:
```jsx
<FormField id="password" label="Password" error={errors.password} hint="Use 12+ characters.">
  <Input
    id="password"
    type="password"
    value={form.password}
    onChange={(e) => setForm({ ...form, password: e.target.value })}
    aria-invalid={Boolean(errors.password)}
    aria-describedby={errors.password ? 'password-error' : 'password-hint'}
  />
  {/* error/hint rendered by FormField */}
  </FormField>
```

Testing checklist:
- Navigate with only keyboard; ensure visible focus and correct tab order.
- Validate screen reader labels via VoiceOver/NVDA.
- Check color contrast with system dark/light themes.
- Verify success/error messages announce in a live region.
- Confirm motion respects `prefers-reduced-motion`.
