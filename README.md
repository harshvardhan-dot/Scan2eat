🍽️ Scan2Eat

Smart Meal Management for Hostels

Scan2Eat is a web-based hostel meal management system designed to simplify how students access meals and how hostel administrators manage meal distribution.

Instead of relying on physical meal cards, registers, or manual verification, Scan2Eat uses a QR-based digital system to make meal verification faster, simpler, and easier to manage.

Scan2Eat is being developed as the first module of HostelOS, a broader hostel management platform.

---

🌐 Live Demo

🚀 Scan2Eat is live:
https://scan2eat-web-beta.vercel.app/

---

🎯 The Problem

Traditional hostel mess systems often rely on:

- Physical meal cards
- Manual verification
- Paper registers
- Difficult meal tracking
- Limited visibility for hostel administrators
- Time-consuming verification during peak meal hours

Scan2Eat aims to replace this process with a simple digital workflow.

---

💡 The Solution

Scan2Eat provides a centralized web application where hostel meal access can be managed digitally.

The system is designed around QR-based verification, allowing meal eligibility and usage to be handled through a faster and more structured workflow.

Student
   │
   ▼
Scan2Eat Web App
   │
   ▼
QR / Meal Verification
   │
   ▼
Backend API
   │
   ▼
Database
   │
   ▼
Meal Record / Access Status

---

✨ Key Features

- 📱 Web-based interface
- 🔳 QR-based meal management
- 👤 Student-oriented workflow
- 🍽️ Digital meal verification
- 📊 Structured meal records
- 🔐 Backend-driven validation
- 🗄️ Persistent database storage
- 📱 Responsive design
- ☁️ Cloud deployment
- 🏠 Designed specifically for hostel environments

---

🏗️ Project Architecture

Scan2Eat follows a modern web application architecture with separate frontend, backend, and data layers.

┌───────────────────────┐
│       User Device     │
│   Mobile / Desktop    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│       Frontend        │
│     Scan2Eat Web      │
└───────────┬───────────┘
            │
         REST API
            │
            ▼
┌───────────────────────┐
│        Backend        │
│   Application Logic   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│       Database        │
│ Students / Meals / QR │
└───────────────────────┘

---

📁 Repository Structure

Scan2eat/
│
├── apps/             # Application source code
├── docs/             # Architecture and project documentation
├── scratch/          # Experimental/development work
├── scripts/          # Project utility scripts
│
├── package.json
├── package-lock.json
├── railway.toml
├── render.yaml
├── .gitignore
└── README.md

The project uses a monorepo-oriented structure to keep different parts of the system organized as Scan2Eat and HostelOS grow.

---

🧠 System Design

The project has been designed with more than just the UI in mind.

The repository includes work around:

- System architecture
- MongoDB schema design
- REST API design
- Application structure
- Deployment configuration
- Development roadmap

This allows Scan2Eat to evolve from a working meal-management application into a larger hostel-management platform.

---

🚀 Running Locally

1. Clone the repository

git clone https://github.com/harshvardhan-dot/Scan2eat.git

2. Enter the project

cd Scan2eat

3. Install dependencies

npm install

4. Configure environment variables

Create the required ".env" files for the application and add the necessary database/API configuration.

«Never commit ".env" files, API keys, passwords, or database credentials to GitHub.»

5. Start the development server

Use the development command configured for the relevant application inside the repository.

---

☁️ Deployment

The project includes configuration for modern cloud deployment platforms.

The frontend is currently available at:

https://scan2eat-web-beta.vercel.app/

Deployment configuration files for Render and Railway are also included in the repository.

---

🗺️ Roadmap

Scan2Eat is intended to become part of a larger hostel-management ecosystem.

Planned areas of development include:

- 🔐 Authentication and authorization
- 👨‍🎓 Student accounts
- 🧑‍💼 Admin dashboard
- 🍽️ Meal scheduling
- 🔳 Improved QR verification
- 📊 Meal analytics
- 📜 Meal history
- 🔔 Notifications
- 📈 Administrative reports
- 🏠 Additional HostelOS modules

---

🌱 Vision: HostelOS

Scan2Eat is the starting point for a broader idea: HostelOS.

The long-term goal is to build a centralized platform capable of managing multiple hostel operations instead of requiring separate manual systems for each task.

                    HostelOS
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Scan2Eat       Attendance     Complaints
   Meal System       System         System
        │
        ▼
 Future Hostel Management Modules

Scan2Eat serves as the first practical module toward that goal.

---

📚 What I Learned

Building Scan2Eat provided hands-on experience with:

- Full-stack web development
- REST API design
- Database modelling
- Authentication concepts
- QR-based workflows
- Git and GitHub
- Application architecture
- Cloud deployment
- Debugging frontend/backend integration
- Designing software around a real-world problem

---

🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit the changes
5. Push the branch
6. Open a Pull Request

---

👨‍💻 Developer

Built by Harsh Vardhan

GitHub: @harshvardhan-dot

