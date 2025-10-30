# KONE Internal Retrospective Tool - Product Requirement Document

**Author:** Product Dev Team

**Version:** 1.0

---

## 1. Executive Summary

This document defines the product requirements for the internal retrospective tool developed for KONE.  
The purpose of the tool is to streamline agile retrospectives across distributed and hybrid teams, enable consistent improvement tracking, integrate with KONE systems, and ensure compliance with enterprise security and data governance standards.

---

## 2. Scope

### In Scope

- Retrospective board creation and templates
- Team check-in, idea capture, grouping, and voting
- Action item assignment and tracking
- Dashboards and analytics
- Security and access control
- Data export (CSV/Excel)

---

## 3. Stakeholders

| Role                | Responsibility                                     |
| ------------------- | -------------------------------------------------- |
| Scrum Masters       | Create retros, facilitate sessions, assign actions |
| Team Members        | Participate, share feedback, vote, and comment     |          
| Tool Administrators | Manage users, templates, integrations              |

---

## 4. High-Level Requirements

1. Template Manager
2. Action Tracker
3. Analytics and Reporting
4. Security and Administration
5. User and Access Management
6. Responsive, Accessible UI

---

## 5. User Requirements

### 5.1 Team Members

- Log in/Sign up.
- Join retrospective boards via invite.
- Submit feedback anonymously or with name visible.
- Vote on cards, comment, and group similar ideas.
- View retrospectives.

### 5.2 Scrum Masters / Facilitators (Admins)

- Create and schedule retrospectives.
- Select or customize templates (Start/Stop/Continue, Mad-Sad-Glad).
- Enable anonymity, configure voting limits, and set timers.
- Group similar cards.
- Assign action items with owner and due date.
- Export results (CSV/Excel).

---

## 6. Technical Specifications

### 6.1 Architecture & Platform

- **Technologies** TypeScript, Tailwind CSS, PostgreSQL.
- **Authentication:** KONE mail (@kone.com), bcrypt.
- **Authorization:** Role-Based Access Control (RBAC).
- **Data storage:** PostgreSQL (structured).

### 6.2 UI/UX

- Dashboard.
- Board view with customizable columns and phases.
- Voting and anonymity modes.
- Timer and facilitation tools.
- Admin console: templates, reports.
- Fully responsive design.

### 6.3 Data Model

| Entity     | Description                                        |
| ---------- | -------------------------------------------------- |
| User       | Profile, role, authentication details              |
| Template   | Structure, default phases, anonymity settings      |
| Card       | Votes, comments, feedback                          |
| ActionItem | Owner, status, due date                            |

### 6.4 Security & Compliance

- Password encryption.
- Access control by role.

---

## 7. Appendix

- Reference documentation: TeamRetro, Reetro, EasyRetro.
- Example templates: “Start/Stop/Continue”, “Mad/Sad/Glad”, etc.
- User roles: Team Member, Scrum Master (Admin).

---

**End of Document**
