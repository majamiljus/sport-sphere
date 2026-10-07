# SportSphere

SportSphere is a full-stack sports platform for discovering sports facilities, booking courts and training sessions, finding teammates, purchasing sports equipment, and managing sports venues.

The application provides separate experiences for **athletes** and **sports-facility employees**, with tools for reservations, promotions, training sessions, ratings, equipment, orders, and facility management.

## Tech Stack

- **Frontend:** Angular 20
- **Backend:** Node.js, Express.js
- **Database:** MongoDB

## Architecture

```text
Angular 20
   │
   │ HTTP / REST
   ▼
Node.js + Express.js
   │
   ▼
MongoDB
```

## Main Features

### Public Experience

Visitors can:

- Browse available sports facilities
- View top-rated facilities
- Search by city, sport, and facility type
- Browse active promotions
- View facility details before creating an account
- Register as an athlete or sports-facility employee
- Sign in and recover a forgotten password

![SportSphere home page](screenshots/home.png)

### Authentication and Registration

SportSphere includes login, password recovery, password reset, and role-based registration flows.

<details>
<summary><strong>View authentication screens</strong></summary>

#### Login

![Login](screenshots/login.png)

#### Forgotten Password

![Forgotten password](screenshots/forgot-password.png)

#### Reset Password

![Reset password](screenshots/reset-password.png)

#### Athlete Registration

![Athlete registration](screenshots/registration-athlete.png)

#### Employee Registration

![Employee registration](screenshots/registration-employee.png)

</details>

## Athlete Features

Registered athletes can manage their profile and use the platform for the complete sports experience.

### Profile and Preferences

Athletes can update their personal information, profile picture, and favorite sports.

![Athlete profile](screenshots/athlete-profile.png)

### Facility Search and Reservations

Athletes can browse sports facilities, inspect available courts or halls, view weekly availability, apply active promotions, and reserve an available time slot.

![Facility booking](screenshots/facility-booking.png)

### Find Teammates

Users can publish ads when they need additional players for a game, request to join other users' games, and manage incoming requests.

![Teammate ads](screenshots/teammate-ads.png)

### Individual Training

Athletes can select a facility, sport, court, trainer, date, and available time slot for an individual training session. Applicable promotions can also be selected during booking.

![Individual training](screenshots/individual-training.png)

### Ratings and Reviews

Users can rate facilities after eligible reservations and leave comments about their experience.

![Ratings and reviews](screenshots/ratings.png)

### Sports Equipment Store

The integrated store allows athletes to browse equipment by sport and add products to their cart.

![Sports equipment store](screenshots/store.png)

### Shopping Cart and Orders

Users can change quantities, remove products, review the total price, and place an order.

![Shopping cart](screenshots/shopping-cart.png)

### Personal Statistics

Athletes can review visual statistics for played and reserved sessions, monthly activity, and sports-equipment spending.

![Athlete statistics](screenshots/statistics.png)

## Employee Features

Sports-facility employees have a separate interface for managing the facilities assigned to them.

### Employee Profile and Reports

Employees can update their profile, review the facilities they manage, and generate monthly PDF reports.

![Employee profile](screenshots/employee-profile.png)

### Facility Management

Employees can create and update sports facilities, courts, halls, working hours, and related facility data. Facilities can also be imported from JSON.

![Facility management](screenshots/employee-facilities.png)

### Reservations and Training Sessions

Employees can review facility reservations and individual training sessions and manage their status.

![Employee reservations and training](screenshots/employee-reservations-training.png)

### Interactive Calendar

The calendar provides a weekly overview of reservations and training sessions for each facility and court.

![Employee calendar](screenshots/employee-calendar.png)

### Promotions, Equipment, and Orders

Employees can create and update promotions, manage the sports-equipment catalog and inventory, and process incoming orders.

![Employee promotions](screenshots/employee-promotions.png)

![Equipment and orders](screenshots/employee-equipment-orders.png)

## Administrator Features

Administrators use a separate protected interface for reviewing registrations and managing the main entities in the system.

### Administrator Login

The administrator has a dedicated login screen separated from the regular athlete and employee authentication flow.

![Administrator login](screenshots/admin-login.png)

### User Account Management

Administrators can browse registered athletes and employees, filter accounts, edit user information, and remove accounts when necessary.

![Administrator account management](screenshots/admin-accounts.png)

### Registration Requests

New athlete and employee accounts can require administrator approval. Administrators can review submitted information and approve or reject registration requests.

![Administrator registration requests](screenshots/admin-registration-requests.png)

### Sports Facility Requests

When employees submit new sports facilities, administrators can review facility information, available sports, court types, working hours, and the employee who submitted the request before approving or rejecting it.

![Administrator facility requests](screenshots/admin-facility-requests.png)

### Trainer Management

Administrators can browse active trainers, filter them by sport, review their specialization, rating, hourly price, and assigned facility, and deactivate trainer accounts.

![Administrator trainer management](screenshots/admin-trainers.png)

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB
- Angular CLI, or use `npx` for Angular commands

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

The backend must be able to connect to your MongoDB instance using the configuration provided by the project.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npx ng serve
```

Then open:

```text
http://localhost:4200
```

## Project Structure

A typical project layout is:

```text
SportSphere/
├── frontend/       # Angular 20 application
├── backend/        # Node.js / Express.js API
├── screenshots/    # README screenshots
└── README.md
```

## Screenshots

Additional screenshots are available in the [`screenshots`](screenshots) directory.
