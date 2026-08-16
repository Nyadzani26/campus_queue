# SPU SmartQueue

A web-based queue management system developed for **Sol Plaatje University (SPU)**. SmartQueue streamlines on-campus student services across university departments, reducing physical congestion and providing real-time visibility into queue status, estimated wait times, and daily service analytics.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [One-Command Setup (Windows)](#one-command-setup-windows)
- [User Roles & Workflows](#user-roles--workflows)
- [API Overview](#api-overview)
- [Contributing & Development Notes](#contributing--development-notes)

---

## Overview

SmartQueue organizes campus department traffic through synchronized digital queues. Students join queues electronically and track their position in real time from any device on campus. Staff members manage counter queues with atomic ticket calling and service tracking, while administrators monitor departmental flow and throughput through daily operational reports.

### Supported Campus Departments
- **ICT Helpdesk** (ICT)
- **Finance Department** (FIN)
- **Printing & Copy Centre** (PRT)
- **Student Records** (REC)
- **Accommodation Services** (ACC)

---

## Key Features

- **Self-Service Student Portal**: Students register with their student number, view live department queues, join queues, and receive real-time ticket updates and wait estimates.
- **Counter Operations Dashboard**: Staff call next tickets, begin service, mark completion, or flag no-shows, with live queue visibility.
- **Daily Queue Cycles**: Automatic daily queue lifecycle management per department with race-safe atomic ticket numbering.
- **Administrative Reporting**: Per-department metrics including tickets issued, completed, cancelled, no-shows, and average wait/service durations.
- **Secure Authentication**: Django REST Framework token-based authentication with strict role-based access control (Student, Staff, Admin).
- **Responsive SPU-Themed UI**: Built using semantic HTML5, Vanilla CSS design tokens reflecting SPU's institutional identity, and Vanilla JavaScript with non-blocking feedback modals.

---

## Architecture & Tech Stack

- **Backend Framework**: Django 5.2 & Django REST Framework (DRF)
- **Database**: SQLite (local development)
- **Authentication**: DRF Token Authentication (`rest_framework.authtoken`)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (Single Page Application architecture)
- **Environment Management**: `python-decouple`
- **Static Assets**: WhiteNoise

---

## Project Structure

```
service-driven-system-development/
├── accounts/                  # User model, authentication views, serializers, admin
│   ├── models.py              # Custom User model (roles: Student, Staff, Admin)
│   ├── serializers.py         # Registration, Login, and Profile serializers
│   ├── views.py               # Auth endpoints (register, login, logout, profile)
│   └── urls.py
├── queues/                    # Core queue engine and operational logic
│   ├── models.py              # Department, Queue, and Ticket models
│   ├── serializers.py         # Queue and Ticket serializers with computed stats
│   ├── views.py               # Counter operations, student join/status, reports
│   ├── permissions.py         # Role-based permission classes
│   └── management/commands/   # init_db command to seed university departments
├── smartqueue/                # Project configuration root
│   ├── settings.py            # Application settings and DRF configuration
│   ├── urls.py                # Root routing
│   ├── wsgi.py
│   └── asgi.py
├── static/                    # Frontend styling and scripts
│   ├── css/style.css          # SPU design system & responsive layout
│   └── js/
│       ├── api.js             # API client & token storage wrapper
│       └── app.js             # SPA routing, dashboard rendering, polling
├── templates/
│   └── index.html             # Single-page interface template
├── manage.py
├── requirements.txt
├── setup.ps1                  # PowerShell automated setup script
└── .env.example
```

---

## Getting Started

### Prerequisites

- **Python 3.10+** (Python 3.11 recommended)
- **Git**

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Nyadzani26/campus_queue.git
cd campus_queue
```

#### 2. Create and activate a virtual environment
On Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
On Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

> **Note for Windows users:** If your project path exceeds standard Windows path length limitations, you can create the virtual environment in a shorter path such as `C:\spu_venv`.

#### 3. Install dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure environment variables
Create a `.env` file from the provided example:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
DJANGO_SECRET_KEY=your-secure-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### 5. Run migrations
```bash
python manage.py migrate
```

#### 6. Initialize campus departments
```bash
python manage.py init_db
```

#### 7. Create an administrator account
```bash
python manage.py createsuperuser
```

#### 8. Start the development server (Uvicorn ASGI)
```bash
uvicorn smartqueue.asgi:application --reload --port 8000
```
or with Django:
```bash
python manage.py runserver
```
Visit **`http://127.0.0.1:8000`** in your browser.

---

## 🧪 Interactive API Testing (Swagger UI & OpenAPI)

An interactive OpenAPI / Swagger UI interface is available for direct API testing:
- **Interactive Swagger UI**: [`http://127.0.0.1:8000/api/docs/`](http://127.0.0.1:8000/api/docs/)
- **ReDoc Documentation**: [`http://127.0.0.1:8000/api/redoc/`](http://127.0.0.1:8000/api/redoc/)
- **OpenAPI Schema (JSON)**: [`http://127.0.0.1:8000/api/schema/`](http://127.0.0.1:8000/api/schema/)

You can test endpoints directly from the Swagger UI using the **"Authorize"** button with your token (`Token <your_token>`) and click **"Try it out"**.

---

### One-Command Setup (Windows)

A PowerShell setup script is included to automate environment setup, migration, and department seeding:
```powershell
.\setup.ps1
```

---

## User Roles & Workflows

### 1. Student
- **Registration**: Students create their account using the registration tab with their first name, last name, email, student number, username, and password.
- **Queueing**: Once logged in, students see all active campus departments, their live queue count, and average wait times.
- **Tickets**: Clicking "Join Queue" issues a unique department ticket (e.g. `ICT-001`). The active ticket banner displays live position updates and estimated wait time.

### 2. Department Staff
- Staff accounts are created by an administrator via the Django Admin console (`/admin/`) and assigned to a specific department.
- Upon logging in, staff access the counter dashboard:
  - View current queue status and waiting count.
  - Click **Call Next Customer** to draw the next ticket.
  - Mark a ticket as **Served** once assistance is complete or **No Show** if the student did not appear.
  - Pause or reopen the department queue.

### 3. Administrator
- Access the Django Admin interface at `/admin/` for user management and system settings.
- Access the web interface at `/` to review daily department operational summaries and throughput metrics.

---

## API Overview

### Authentication (`/api/auth/`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register student account | Public |
| `POST` | `/api/auth/login/` | Obtain auth token | Public |
| `POST` | `/api/auth/logout/` | Revoke auth token | Authenticated |
| `GET` | `/api/auth/profile/` | Current user profile | Authenticated |

### Departments & Tickets (`/api/`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/departments/` | List departments with live queue stats | Authenticated |
| `POST` | `/api/departments/<id>/join/` | Join department queue | Student |
| `GET` | `/api/tickets/active/` | Active ticket status and position | Authenticated |
| `POST` | `/api/tickets/<id>/cancel/` | Cancel active ticket | Student |

### Staff Operations (`/api/staff/`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/staff/queue/` | Department queue snapshot & waiting list | Staff |
| `POST` | `/api/staff/call-next/` | Call next waiting ticket | Staff |
| `POST` | `/api/staff/tickets/<id>/serve/` | Mark ticket as served | Staff |
| `POST` | `/api/staff/tickets/<id>/no-show/` | Mark ticket as no-show | Staff |
| `POST` | `/api/staff/queue/status/` | Toggle queue status (open/paused/closed) | Staff |

### Operational Reports (`/api/reports/`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reports/summary/` | Daily report summary (date query optional) | Admin |

---

## License

Developed for academic and operational use at Sol Plaatje University. All rights reserved.
