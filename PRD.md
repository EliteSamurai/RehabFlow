RehabFlow - Product Requirements Document (PRD)
Executive Summary
RehabFlow is a specialized patient communication SaaS platform designed to reduce no-shows, improve treatment compliance, and enhance patient outcomes for physical therapy and rehabilitation clinics through intelligent SMS automation, therapy-specific messaging, and recovery-focused engagement.

Target Market: Physical therapy clinics, rehabilitation centers, sports medicine practices, and occupational therapy clinics Primary Value Proposition: Reduce no-shows by 40-60% and improve patient compliance/outcomes through intelligent communication Revenue Model: SaaS subscription + per-message pricing

1. Problem Analysis
Market Pain Points
No-Show Crisis: PT clinics lose $150-400 per missed appointment
Compliance Issues: 60% of patients don't complete prescribed therapy programs
Communication Gap: 95% SMS read rate vs 20% email open rate
Generic Solutions: Current tools lack therapy-specific messaging and compliance tracking
Revenue Loss: Poor patient retention and incomplete treatment programs
Manual Processes: Staff spending hours on reminder calls and follow-ups
Competitive Landscape
Generic SMS platforms (Twilio, MessageBird) - lack healthcare expertise
Healthcare CRMs (Athena, Epic) - overkill for PT clinics, expensive
EMR systems (WebPT, TheraOffice) - limited communication features
General appointment reminder tools - not therapy-specific
Market Opportunity
Market Size: $40B+ physical therapy industry growing at 7.1% CAGR
Target Customers: 39,000+ PT practices in US, 65% are small clinics (1-5 therapists)
Pricing Power: $199-499/month for significant ROI through improved compliance
2. MVP Scope
✅ IN SCOPE (MVP)
Core SMS Platform
Appointment reminders (24h, 4h, 1h before)
No-show recovery sequences
Home exercise reminders (daily/weekly)
Progress check-ins and motivation
Treatment-specific messaging (post-surgical, sports injury, chronic pain)
Patient opt-in/opt-out management
Practice Management
Single clinic onboarding
Staff user management (admin, therapist, assistant roles)
Basic patient database with injury/condition tracking
Treatment plan import/export
Compliance & Progress Tracking
Home exercise completion tracking
Pain level monitoring
Progress milestone celebrations
Treatment adherence scoring
Recovery timeline messaging
Analytics & Reporting
No-show rate tracking
Treatment compliance rates
Message delivery/response rates
Patient outcome correlation
ROI dashboard
Billing & Payments
Stripe integration
Monthly subscription billing
Per-message overage charges
Usage tracking
❌ OUT OF SCOPE (Future Phases)
Multi-location support
Advanced AI/ML features
Mobile applications
Complex EMR integrations
Telehealth features
Exercise video library
Advanced outcome analytics
API for third-party integrations
3. Technical Architecture
Frontend Stack
Next.js 14 + TypeScript
├── App Router (Server Components)
├── Tailwind CSS + ShadCN UI
├── React Hook Form + Zod validation
├── TanStack Query (React Query)
├── Framer Motion (animations)
└── Lucide React (icons)
Backend Architecture
Next.js API Routes
├── RESTful endpoints
├── Middleware (auth, rate limiting)
├── Input validation (Zod)
├── Error handling & logging
└── Vercel deployment
Database & Infrastructure
Supabase Stack
├── PostgreSQL database
├── Row Level Security (RLS)
├── Built-in authentication
├── Real-time subscriptions
├── Database backups
└── Edge functions
External Services
Third-Party Integrations
├── Twilio (SMS delivery)
├── Stripe (payments & billing)
├── Vercel (hosting & CDN)
├── Supabase (database & auth)
└── Resend (email fallbacks)
Security & Compliance
HIPAA Compliance: BAA with all vendors
Data Encryption: At rest and in transit
Access Control: Role-based permissions
Audit Logging: All data access tracked
GDPR Compliance: EU data protection
4. User Flows
Practice Owner Onboarding
1. Sign Up
   ├── Email + password
   ├── Practice information
   └── Phone number verification

2. Practice Setup
   ├── Clinic details (name, address, phone)
   ├── Business hours
   ├── Therapist invitation
   └── Payment method setup

3. Initial Configuration
   ├── Import patient list (CSV)
   ├── Set up treatment types
   ├── Configure message templates
   └── Set reminder preferences

4. Go Live
   ├── Test SMS delivery
   ├── Staff training
   └── First campaign launch
Patient Treatment Journey
Initial Evaluation
├── Welcome SMS with clinic info
├── Pre-appointment instructions
├── What to bring/wear
└── Insurance verification reminder

Treatment Phase
├── Appointment reminders
│   ├── 24h: Prep instructions
│   ├── 4h: Final reminder
│   └── 1h: "See you soon"
├── Home exercise reminders
│   ├── Daily exercise prompts
│   ├── Progress check-ins
│   └── Motivation messages
├── Progress milestones
│   ├── Week 2: "Great progress!"
│   ├── Week 4: "Halfway there!"
│   └── Week 6: "Almost done!"
└── Outcome tracking
    ├── Pain level surveys
    ├── Functional assessments
    └── Satisfaction feedback
No-Show Recovery
Patient No-Shows
├── Immediate follow-up (15 min)
│   ├── "We missed you" message
│   ├── Reschedule link
│   └── Treatment importance reminder
├── 24h follow-up
│   ├── Reschedule reminder
│   ├── Progress impact explanation
│   └── Alternative times offered
├── 48h follow-up
│   ├── Therapist concern message
│   ├── Recovery timeline impact
│   └── Personal call scheduling
└── 7-day follow-up
    ├── Recovery goal check-in
    ├── Motivation and support
    └── Re-engagement campaign
Home Exercise Compliance
Exercise Program Setup
├── Treatment-specific programs
│   ├── Post-surgical protocols
│   ├── Sports injury rehab
│   ├── Chronic pain management
│   └── General strengthening
├── Personalized scheduling
│   ├── Best time preferences
│   ├── Frequency settings
│   └── Reminder customization
├── Progress tracking
│   ├── Completion confirmations
│   ├── Difficulty feedback
│   ├── Pain level monitoring
│   └── Modification requests
└── Motivation system
    ├── Progress celebrations
    ├── Streak tracking
    ├── Goal achievements
    └── Therapist encouragement
5. Database Schema
Multi-Tenant Architecture
sql
-- Core tenant table
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  specialty VARCHAR(100), -- orthopedic, sports, neurological, etc.
  timezone VARCHAR(50) DEFAULT 'UTC',
  business_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own clinic" ON clinics
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM clinic_users WHERE clinic_id = id
  ));
User Management
sql
-- Clinic staff (therapists, assistants, admin)
CREATE TABLE clinic_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'therapist', -- admin, therapist, assistant
  specialization VARCHAR(100), -- orthopedic, sports, neuro, etc.
  license_number VARCHAR(50),
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clinic_id, user_id)
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  credentials VARCHAR(100), -- PT, DPT, OTR, etc.
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Patient Management
sql
-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  emergency_contact JSONB,
  primary_condition VARCHAR(255),
  injury_date DATE,
  referral_source VARCHAR(100),
  insurance_info JSONB,
  goals TEXT,
  opt_in_sms BOOLEAN DEFAULT true,
  opt_in_email BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatment plans
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES clinic_users(id),
  condition VARCHAR(255) NOT NULL,
  treatment_type VARCHAR(100), -- post-surgical, sports injury, chronic pain
  goals TEXT,
  frequency_per_week INTEGER DEFAULT 2,
  estimated_duration_weeks INTEGER DEFAULT 6,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES clinic_users(id),
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type VARCHAR(100), -- evaluation, treatment, re-evaluation
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, no-show, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Exercise & Compliance Tracking
sql
-- Exercise programs
CREATE TABLE exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  condition_type VARCHAR(100), -- post-surgical, sports injury, etc.
  exercises JSONB, -- array of exercises with instructions
  frequency VARCHAR(50), -- daily, 3x/week, etc.
  duration_weeks INTEGER DEFAULT 6,
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patient exercise assignments
CREATE TABLE patient_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  exercise_program_id UUID REFERENCES exercise_programs(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  start_date DATE,
  target_completion_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, modified, discontinued
  modifications TEXT,
  therapist_notes TEXT
);

-- Exercise completion logs
CREATE TABLE exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_exercise_id UUID REFERENCES patient_exercises(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  duration_minutes INTEGER,
  difficulty_rating INTEGER, -- 1-5 scale
  pain_level_before INTEGER, -- 0-10 scale
  pain_level_after INTEGER, -- 0-10 scale
  notes TEXT,
  compliance_score DECIMAL(3,2) -- 0.00-1.00
);

-- Progress tracking
CREATE TABLE patient_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  assessment_date DATE,
  pain_level INTEGER, -- 0-10 scale
  functional_score INTEGER, -- varies by assessment type
  range_of_motion JSONB, -- joint-specific measurements
  strength_score INTEGER,
  notes TEXT,
  therapist_id UUID REFERENCES clinic_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
Communication System
sql
-- Message templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- reminder, exercise, progress, motivation
  treatment_type VARCHAR(100), -- post-surgical, sports injury, chronic pain
  content TEXT NOT NULL,
  variables JSONB, -- {{patient_name}}, {{exercise_name}}, etc.
  send_conditions JSONB, -- when to send this message
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- reminder, exercise, compliance, motivation
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
  target_criteria JSONB, -- patient filters
  message_sequence JSONB, -- array of message templates with delays
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message logs
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  template_id UUID REFERENCES message_templates(id),
  message_type VARCHAR(50) NOT NULL, -- sms, email
  content TEXT NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- sent, delivered, failed, opened, clicked
  twilio_sid VARCHAR(255), -- Twilio message ID
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  error_message TEXT
);
Analytics & Reporting
sql
-- Analytics aggregations (for performance)
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  cancellations INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  sms_delivered INTEGER DEFAULT 0,
  sms_responded INTEGER DEFAULT 0,
  exercise_completions INTEGER DEFAULT 0,
  patient_check_ins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clinic_id, date)
);

-- Patient compliance metrics
CREATE TABLE patient_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  appointment_compliance_rate DECIMAL(5,2), -- percentage
  exercise_compliance_rate DECIMAL(5,2), -- percentage
  communication_response_rate DECIMAL(5,2), -- percentage
  progress_score INTEGER, -- 0-100
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Outcome tracking
CREATE TABLE treatment_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  initial_pain_level INTEGER,
  final_pain_level INTEGER,
  initial_function_score INTEGER,
  final_function_score INTEGER,
  treatment_satisfaction INTEGER, -- 1-5 scale
  goals_achieved BOOLEAN DEFAULT false,
  completion_date DATE,
  total_sessions INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
Billing & Usage
sql
-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  sms_included INTEGER NOT NULL,
  max_patients INTEGER,
  max_therapists INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clinic subscriptions
CREATE TABLE clinic_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sms_sent INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clinic_id, date)
);
6. Development Phases
Phase 1: Core Platform (Weeks 1-6)
 Basic authentication & clinic setup
 Patient database & treatment plan management
 SMS sending via Twilio
 Basic appointment reminder system
 Stripe subscription setup
Phase 2: Compliance Features (Weeks 7-10)
 Exercise program management
 Home exercise reminder system
 Progress tracking and check-ins
 Treatment-specific messaging templates
 No-show recovery sequences
Phase 3: Analytics & Optimization (Weeks 11-14)
 Compliance analytics dashboard
 Outcome tracking and reporting
 Patient progress visualization
 ROI and performance metrics
 A/B testing for messages
Phase 4: Launch & Iteration (Weeks 15-18)
 Beta testing with 3-5 clinics
 Performance optimization
 Bug fixes & polish
 Documentation & training materials
 Public launch
7. Success Metrics
Business Metrics
Customer Acquisition: 25 clinics in first 6 months
Revenue: $15K ARR by month 6
Churn Rate: <5% monthly churn
Customer Satisfaction: >4.5/5 rating
Product Metrics
No-Show Reduction: 40-60% decrease
Treatment Compliance: 70%+ exercise completion rate
SMS Response Rate: >75%
Patient Outcomes: 20% improvement in satisfaction scores
Technical Metrics
Uptime: 99.9% availability
API Response Time: <200ms average
SMS Delivery Latency: <30 seconds
Database Performance: <100ms query times
8. Risk Assessment
Technical Risks
SMS Delivery Issues: Twilio rate limits, carrier filtering
Database Performance: Large patient datasets, real-time analytics
Scalability: Handling multiple clinics simultaneously
Business Risks
Regulatory Changes: HIPAA compliance updates, SMS regulations
Competition: EMR providers adding communication features
Market Adoption: PT clinics resistant to new technology
Mitigation Strategies
Redundancy: Multiple SMS providers, database optimization
Compliance: Regular audits, legal consultation
Differentiation: Focus on compliance tracking and outcomes
9. Future Roadmap
Q2 2024: Multi-Location Support
Clinic chain management
Cross-location analytics
Centralized billing
Q3 2024: EMR Integrations
WebPT integration
TheraOffice connection
BreezyNotes compatibility
Q4 2024: Advanced Analytics
Predictive compliance modeling
Outcome prediction algorithms
Benchmark reporting
Q1 2025: Mobile Applications
Therapist mobile app
Patient mobile app with exercise videos
Push notifications
10. Appendix
Technical Requirements
Browser Support: Chrome 90+, Safari 14+, Firefox 88+
Mobile: Responsive design, PWA capabilities
Performance: Core Web Vitals >90
Accessibility: WCAG 2.1 AA compliance
Compliance Requirements
HIPAA: Business Associate Agreement with all vendors
GDPR: EU data protection compliance
TCPA: SMS consent management
SOC 2: Security certification (future)
Support & Documentation
User Documentation: Comprehensive guides and videos
API Documentation: Developer portal for integrations
Support Channels: Email, chat, phone support
Training: Onboarding sessions and webinars
This PRD is a living document and should be updated as requirements evolve during development.

