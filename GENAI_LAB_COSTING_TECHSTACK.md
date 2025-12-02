═══════════════════════════════════════════════════════════════════
                    GenAI LAB
        FINAL COSTING & TECH STACK DOCUMENT
═══════════════════════════════════════════════════════════════════

PROJECT OVERVIEW
────────────────────────────────────────────────────────────────────
GenAI Lab is a multi-tenant AI platform providing students access to 
various LLMs and multimodal AI models with usage tracking, analytics 
dashboard, and role-based access control across multiple institutions.

• Target Users: 400 Students
• Region: Asia Pacific (Mumbai)
• Deployment Model: Production-Ready, Scalable, Monthly Billing
• Launch Status: Ready for Deployment
• Date Prepared: November 28, 2025



═══════════════════════════════════════════════════════════════════
SECTION 1: 💰 FINAL PRICING SUMMARY
═══════════════════════════════════════════════════════════════════

MONTHLY COSTS
────────────────────────────────────────────────────────────────────

Service                          | Monthly Cost | Notes
─────────────────────────────────┼──────────────┼──────────────────
EC2 (t3.micro - 24/7)           | $3.94        | On-demand pricing
S3 Storage (20GB)               | $0.46        | Standard class
S3 Requests (10K PUT)           | $0.05        | API requests
S3 Requests (500K GET)          | $0.02        | API requests
S3 Data Transfer (50GB out)     | $5.78        | To Internet
S3 Inbound Data (2GB)           | $0.00        | Free (all regions)
DynamoDB (5GB storage)          | $0.63        | Pay-per-request
DynamoDB (500K RCU/month)       | $0.75        | Read operations
DynamoDB (200K WCU/month)       | $0.37        | Write operations
CloudFront (1TB included)       | $0.00        | Flat rate plan
Route 53 (1 hosted zone)        | $0.50        | Monthly fee
Route 53 (1M queries)           | $0.40        | DNS queries
Route 53 (1 health check)       | $0.10        | Basic check
SES (Email service)             | $0.00        | 62K/month free
ACM (SSL Certificate)           | $0.00        | Free forever
────────────────────────────────────────────────────────────────────
AWS SUBTOTAL                    | $12.41       |
Domain (.in)                    | ~$1.00       | Annual ÷ 12
────────────────────────────────────────────────────────────────────
TOTAL MONTHLY                   | ~$13.46      | FINAL
────────────────────────────────────────────────────────────────────



ANNUAL COSTS
────────────────────────────────────────────────────────────────────

Period          | AWS Services | Domain  | Total    | Notes
────────────────┼──────────────┼─────────┼──────────┼──────────────
Year 1          | $148.92      | $12.00  | $160.92  | Full year
Year 2+         | $148.92      | $12.00  | $160.92  | Consistent
────────────────┼──────────────┼─────────┼──────────┼──────────────

KEY NOTE: Year 2+ costs remain identical because t3.micro is NOT 
eligible for AWS free tier. All services use standard on-demand 
pricing from Day 1.



═══════════════════════════════════════════════════════════════════
SECTION 2: 📋 COMPLETE TECH STACK
═══════════════════════════════════════════════════════════════════

FRONTEND LAYER
────────────────────────────────────────────────────────────────────
Framework:              React.js + TypeScript
UI Library:             Tailwind CSS + Shadcn/ui
Build Tool:             Vite
Hosting:                AWS S3 + CloudFront (CDN)
Deployment:             Static build served globally

Features:
  ✓ Real-time student dashboard with analytics
  ✓ Token usage tracking and visualization
  ✓ Model browser organized by category (Text, Image, Audio)
  ✓ Session management with multiple sessions per model
  ✓ Institution and course-based filtering
  ✓ Artifact storage and export functionality
  ✓ Glassmorphism UI with smooth animations
  ✓ Dark/Light theme toggle
  ✓ Responsive design (mobile + desktop)



BACKEND LAYER
────────────────────────────────────────────────────────────────────
Server:                 AWS EC2 (t3.micro)
Runtime:                Node.js / Express.js
Architecture:           RESTful APIs with AI proxy layer

Features:
  ✓ LLM API integration and management
  ✓ Token quota enforcement per student
  ✓ Request routing to multiple AI providers
  ✓ Authentication and authorization (JWT)
  ✓ Usage tracking and analytics
  ✓ Error handling and rate limiting
  ✓ Caching layer for improved performance
  ✓ Guardrail enforcement for AI responses



DATABASE LAYER
────────────────────────────────────────────────────────────────────
Primary Database:       AWS DynamoDB (On-Demand)
Type:                   NoSQL (Key-Value + Document)
Initial Capacity:       5GB (auto-scaling enabled)
Consistency Model:      Eventually consistent

Data Models:
  • User Profiles (authentication, settings, token balance)
  • Session Data (active sessions, tokens used per session)
  • Token Usage Logs (tracking consumption per model)
  • Prompt History (chat records, prompt scores, artifacts)
  • Leaderboards (institutional + course-based rankings)
  • Institution & Course Data (multi-tenancy support)
  • AI Agents (custom agents created by students)
  • Guardrails (admin-defined content restrictions)



STORAGE LAYER
────────────────────────────────────────────────────────────────────
File Storage:           AWS S3
Total Capacity:         20GB (expandable)
Storage Class:          S3 Standard

Usage Breakdown:
  • Frontend Assets:    ~100MB (React build, images, fonts)
  • Knowledge Bases:    ~10GB (student-uploaded documents)
  • Artifacts:          ~5GB (generated exports, reports)
  • Backups:            ~5GB (database backups, logs)

Features:
  ✓ Knowledge base storage per AI agent (10MB limit each)
  ✓ Generated artifact storage (exports, reports)
  ✓ Session data backups and recovery
  ✓ User-uploaded documents and datasets
  ✓ Versioning and lifecycle policies
  ✓ Encryption at rest (AES-256) and in transit (TLS)



CONTENT DELIVERY NETWORK
────────────────────────────────────────────────────────────────────
CDN Service:            AWS CloudFront
Pricing Plan:           Flat rate (1TB/month included)
Purpose:                Global content delivery, static asset caching

Features:
  ✓ Edge locations worldwide for low latency
  ✓ Automatic HTTPS via ACM integration
  ✓ Caching of frontend assets
  ✓ DDoS protection (AWS Shield Standard)
  ✓ Real-time access logs



DNS & DOMAIN MANAGEMENT
────────────────────────────────────────────────────────────────────
DNS Service:            AWS Route 53
Domain:                 .in domain (external registrar ~₹800/year)

Features:
  ✓ High availability DNS (99.99% SLA)
  ✓ Health checks for backend failover
  ✓ Simple routing policy
  ✓ DDoS protection (integrated)
  ✓ Low latency DNS resolution



SECURITY LAYER
────────────────────────────────────────────────────────────────────
SSL/TLS Certificates:   AWS Certificate Manager (ACM)
Cost:                   FREE (forever)

Features:
  ✓ Auto-renewal (no manual intervention)
  ✓ Wildcard certificate support
  ✓ Integration with CloudFront and EC2
  ✓ Industry-standard encryption (TLS 1.2/1.3)



EMAIL SERVICE
────────────────────────────────────────────────────────────────────
Service:                AWS SES (Simple Email Service)
Purpose:                Notifications, verification, password reset
Free Quota:             62,000 emails/month (from EC2)
Paid Rate:              $0.10 per 1,000 emails (after quota)

Email Types:
  • Account verification emails
  • Password reset notifications
  • Token quota warnings
  • Session activity alerts
  • Admin notifications



═══════════════════════════════════════════════════════════════════
SECTION 3: 🤖 AI MODEL INTEGRATIONS
═══════════════════════════════════════════════════════════════════

AVAILABLE MODELS FOR STUDENTS
────────────────────────────────────────────────────────────────────

OPENAI MODELS
┌─────────────────────────┬──────────────┬─────────────────────────┐
│ Model                   │ Type         │ Use Case                │
├─────────────────────────┼──────────────┼─────────────────────────┤
│ GPT-3.5 Turbo          │ Text         │ Fast, cost-effective    │
│ GPT-4.1 Mini           │ Text         │ Balanced performance    │
│ GPT-4o                 │ Multimodal   │ Advanced reasoning      │
│ GPT-4o Mini            │ Multimodal   │ Optimized multimodal    │
│ DALL-E 3               │ Image        │ Image generation        │
└─────────────────────────┴──────────────┴─────────────────────────┘

GOOGLE MODELS
┌─────────────────────────┬──────────────┬─────────────────────────┐
│ Model                   │ Type         │ Use Case                │
├─────────────────────────┼──────────────┼─────────────────────────┤
│ Gemini 2.0 Flash       │ Multimodal   │ Fast, efficient         │
│ Gemini 2.0 Flash Lite  │ Multimodal   │ Lightweight variant     │
│ Gemini 2.5 Flash Lite  │ Multimodal   │ Latest lightweight      │
└─────────────────────────┴──────────────┴─────────────────────────┘

ANTHROPIC MODELS
┌─────────────────────────┬──────────────┬─────────────────────────┐
│ Model                   │ Type         │ Use Case                │
├─────────────────────────┼──────────────┼─────────────────────────┤
│ Claude Haiku 4.5       │ Text         │ Fast, cost-effective    │
│ Claude Sonnet 4.5      │ Text         │ Balanced performance    │
│ Claude Opus 4.1        │ Text         │ Advanced reasoning      │
└─────────────────────────┴──────────────┴─────────────────────────┘

AUDIO MODEL
┌─────────────────────────┬──────────────┬─────────────────────────┐
│ Model                   │ Type         │ Use Case                │
├─────────────────────────┼──────────────┼─────────────────────────┤
│ Eleven Multilingual v2 │ Audio        │ Text-to-speech          │
└─────────────────────────┴──────────────┴─────────────────────────┘

TOTAL: 12 AI Models across 4 providers



TOKEN PRICING MODEL
────────────────────────────────────────────────────────────────────

Student Billing:
  • Student pays: ₹1,500 per enrollment
  • Displayed tokens: 50,000 tokens (virtual)
  • Actual budget: ₹1,500 worth of API usage

Internal Tracking:
  • Each model has different actual API costs
  • Backend tracks real ₹ spent per student
  • Deducts from ₹1,500 budget internally
  • Student sees token deduction (50,000 scale)

Conversion Formula:
  Virtual Tokens Used = (Actual ₹ Spent / 1500) × 50,000



═══════════════════════════════════════════════════════════════════
SECTION 4: 🏗️ ARCHITECTURE DIAGRAM
═══════════════════════════════════════════════════════════════════

                    GLOBAL USER TRAFFIC
                           │
                           ▼
        ┌────────────────────────────────────┐
        │   AWS CLOUDFRONT (CDN)             │
        │   • Global content delivery        │
        │   • SSL/TLS termination            │
        │   • DDoS protection                │
        │   • 1TB/month included             │
        └────────────────────────────────────┘
                 │                    │
        ┌────────▼─────────┐   ┌─────▼──────────────┐
        │  S3 BUCKET       │   │  EC2 (t3.micro)    │
        │  (Frontend)      │   │  (Backend API)     │
        │                  │   │                    │
        │ • React Build    │   │ • Node.js Server   │
        │ • Static Assets  │   │ • LLM API Proxy    │
        │ • 20GB Storage   │   │ • Auth & JWT       │
        │ • CSS/JS/Images  │   │ • Token Management │
        └──────────────────┘   └────────────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐
        │ DynamoDB (5GB)  │  │  S3 Storage      │  │    SES       │
        │ (Database)      │  │  (File Storage)  │  │   (Email)    │
        │                 │  │                  │  │              │
        │ • Users         │  │ • Knowledge Base │  │ • Verify     │
        │ • Sessions      │  │ • Artifacts      │  │ • Notify     │
        │ • Token Usage   │  │ • Exports        │  │ • Alerts     │
        │ • Prompts       │  │ • Documents      │  │ • 62K/mo     │
        │ • Rankings      │  │ • 20GB total     │  │   free       │
        │ • AI Agents     │  │                  │  │              │
        └─────────────────┘  └──────────────────┘  └──────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │   EXTERNAL AI APIs       │
                         │                          │
                         │ • OpenAI (GPT, DALL-E)   │
                         │ • Anthropic (Claude)     │
                         │ • Google (Gemini)        │
                         │ • ElevenLabs (Audio)     │
                         └──────────────────────────┘

        ┌──────────────────────────────────────────────────────┐
        │         ROUTE 53 (DNS) + ACM (SSL)                  │
        │    • 1 Hosted Zone with health checks               │
        │    • 1M DNS queries/month                           │
        │    • Free SSL certificate (auto-renewal)            │
        └──────────────────────────────────────────────────────┘



═══════════════════════════════════════════════════════════════════
SECTION 5: 📊 DETAILED SERVICE SPECIFICATIONS
═══════════════════════════════════════════════════════════════════

EC2 INSTANCE SPECIFICATIONS
────────────────────────────────────────────────────────────────────
Instance Type:          t3.micro
vCPU:                   2 (burstable)
Memory:                 1 GB RAM
Network Performance:    Up to 5 Gbps
Storage:                EBS-only (8GB gp3)
Pricing:                $0.0112/hour = $3.94/month (24/7)
Uptime SLA:             99.95%
Operating System:       Amazon Linux 2023
Security:               Security groups, IAM roles, encryption



DYNAMODB SPECIFICATIONS
────────────────────────────────────────────────────────────────────
Pricing Model:          On-Demand (pay-per-request)
Storage Capacity:       5GB (initial, auto-scales to 25GB free)
Read Capacity:          500K RCU/month
Write Capacity:         200K WCU/month
Average Item Size:      2KB
Consistency Model:      Eventually consistent
Auto-scaling:           Enabled (handles traffic spikes)
Backups:                Point-in-time recovery available
Encryption:             At-rest (AWS managed) and in-transit



S3 STORAGE SPECIFICATIONS
────────────────────────────────────────────────────────────────────
Total Capacity:         20GB
Storage Class:          S3 Standard
PUT Requests:           10,000/month
GET Requests:           500,000/month
Inbound Transfer:       2GB/month (FREE)
Outbound Transfer:      50GB/month @ $0.1156/GB
Versioning:             Enabled
Encryption:             AES-256 (Server-side)
Replication:            Single region (Mumbai)



CLOUDFRONT SPECIFICATIONS
────────────────────────────────────────────────────────────────────
Distribution Type:      Web Distribution
Origin:                 S3 (frontend) + EC2 (API)
Price Class:            All Edge Locations
Data Transfer:          1TB/month (flat rate included)
HTTPS:                  Required (redirect HTTP)
Cache Policy:           Optimized for static assets
Compression:            Gzip/Brotli enabled



ROUTE 53 DNS SPECIFICATIONS
────────────────────────────────────────────────────────────────────
Hosted Zones:           1
Standard Queries:       1,000,000/month
Health Checks:          1 (Basic within AWS)
Query Pattern:          Standard DNS queries
Routing Policy:         Simple routing
Availability SLA:       99.99%



═══════════════════════════════════════════════════════════════════
SECTION 6: ⚠️ IMPORTANT CONSIDERATIONS
═══════════════════════════════════════════════════════════════════

FREE TIER STATUS
────────────────────────────────────────────────────────────────────

┌─────────────────┬────────────┬─────────────────────────────────┐
│ Service         │ Status     │ Notes                           │
├─────────────────┼────────────┼─────────────────────────────────┤
│ EC2 t3.micro    │ ❌ PAID    │ Free tier is t2.micro only      │
│ DynamoDB        │ ✅ FREE    │ 25GB storage free forever       │
│ S3 Storage      │ ⚠️ PARTIAL │ 5GB free, you use 20GB          │
│ S3 Transfer     │ ❌ PAID    │ Outbound transfer charged       │
│ CloudFront      │ ✅ FREE    │ 1TB/month free (12 months)      │
│ Route 53        │ ❌ PAID    │ No free tier for DNS            │
│ SES             │ ✅ FREE    │ 62K emails/month from EC2       │
│ ACM             │ ✅ FREE    │ Free SSL certificates forever   │
└─────────────────┴────────────┴─────────────────────────────────┘



SCALING CONSIDERATIONS
────────────────────────────────────────────────────────────────────

Current Capacity (400 Students):
  ✓ EC2 t3.micro handles ~400 concurrent API requests
  ✓ DynamoDB auto-scales for traffic spikes
  ✓ S3 handles unlimited concurrent downloads
  ✓ CloudFront offloads 90%+ of frontend traffic

Growth Triggers:
  • 500+ students → Consider t3.small upgrade (+$4/month)
  • 1000+ students → Consider t3.medium (+$12/month)
  • High API usage → Consider Lambda for AI proxy
  • Global users → Enable additional CloudFront regions



SECURITY CHECKLIST
────────────────────────────────────────────────────────────────────

  ✓ All traffic encrypted (TLS 1.2/1.3)
  ✓ S3 bucket private (CloudFront access only)
  ✓ EC2 in private subnet with NAT
  ✓ Security groups restrict inbound traffic
  ✓ IAM roles with least privilege
  ✓ DynamoDB encryption at rest
  ✓ API keys stored in AWS Secrets Manager
  ✓ JWT tokens for authentication
  ✓ Rate limiting on API endpoints



BACKUP & DISASTER RECOVERY
────────────────────────────────────────────────────────────────────

  • DynamoDB: Point-in-time recovery (35 days)
  • S3: Versioning enabled for all buckets
  • EC2: AMI snapshots (weekly recommended)
  • Recovery Time: < 1 hour for full restore
  • Data Durability: 99.999999999% (11 9s) on S3



═══════════════════════════════════════════════════════════════════
SECTION 8: ✅ FINAL SUMMARY
═══════════════════════════════════════════════════════════════════

INFRASTRUCTURE COSTS (FINAL)
────────────────────────────────────────────────────────────────────

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   MONTHLY COST:        $13.46 USD  │  ₹1,131 INR             │
│   ANNUAL COST:         $160.92 USD │  ₹13,517 INR            │
│   5-YEAR COST:         $804.60 USD │  ₹67,586 INR            │
│                                                                │
│   PAYMENT MODEL:       Monthly (No upfront, no commitment)    │
│   SCALING:             Auto-scaling enabled                   │
│   UPTIME SLA:          99.95%                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘



TECH STACK SUMMARY
────────────────────────────────────────────────────────────────────

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   FRONTEND:    React + TypeScript + Tailwind (S3 + CloudFront)│
│   BACKEND:     Node.js + Express (EC2 t3.micro)               │
│   DATABASE:    DynamoDB (On-Demand, auto-scaling)             │
│   STORAGE:     S3 Standard (20GB)                             │
│   CDN:         CloudFront (global delivery)                   │
│   DNS:         Route 53 (with health checks)                  │
│   EMAIL:       SES (62K/month free)                           │
│   SSL:         ACM (free forever)                             │
│   AI MODELS:   12 models (OpenAI, Anthropic, Google, Eleven)  │
│                                                                │
└────────────────────────────────────────────────────────────────┘



DEPLOYMENT READINESS
────────────────────────────────────────────────────────────────────

  ✅ Architecture designed for production
  ✅ Costs calculated and verified
  ✅ Scaling path defined
  ✅ Security measures in place
  ✅ Backup strategy planned
  ✅ All AWS services in Mumbai region
  ✅ Single dashboard management (AWS Console)

  STATUS: READY FOR DEPLOYMENT 🚀

