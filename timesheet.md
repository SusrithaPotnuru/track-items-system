**Part 1: Project Overview, Architecture, UI, Tech Stack, Folder Structure
PROJECT SCOPE**
This application is intended for internal company usage only.
The primary objective is to simplify employee productivity tracking and automate weekly productivity reporting.
The application will allow administrators and managers to manage employees, projects, holidays, daily productivity entries, weekly reports, monthly reports, email reports, and analytics.
The system should minimize manual work, eliminate spreadsheet-based tracking, automatically calculate productivity metrics, and provide management with accurate reports.
The application should be scalable, maintainable, secure, and suitable for future enhancements such as attendance, leave management, payroll integration, and employee self-service modules.
You are an Expert Senior Full Stack Software Engineer with over 15 years of experience in designing and developing enterprise web applications.
Your task is to build a complete production-ready Full Stack Productivity Timesheet Management System.
This application will be used by a company to record the daily work completed by employees and automatically generate weekly productivity reports.
This is NOT a traditional attendance system.
This is NOT a payroll system.
This application is only for tracking daily productivity, completed work items, working hours, holidays, and generating weekly reports for management.
\--------------------------------------------------
Primary Objective
The company wants to know
• How many work items each employee completed every day.
• Weekly productivity of every employee.
• Monthly productivity.
• Department-wise productivity.
• Project-wise productivity.
• Automatically generate weekly reports.
• Send weekly reports to managers through email.
The application should reduce manual work and automatically calculate everything.
\--------------------------------------------------
Technology Stack
Frontend
React.js
Vite
Tailwind CSS
React Router DOM
Axios
React Hook Form
React Icons
Framer Motion
Recharts
Backend
Node.js
Express.js
Database
MongoDB
ODM
Mongoose
Authentication
JWT
Password Hashing
bcryptjs
Validation
express-validator
Environment
dotenv
Email
Nodemailer
Scheduler
node-cron
File Upload
Multer
Report Generation
PDF
Excel
CSV
\--------------------------------------------------
Coding Standards
Use modern JavaScript (ES2023)
Use async/await everywhere.
Never use callback hell.
Create reusable components.
Avoid duplicate code.
Follow SOLID Principles.
Follow DRY Principle.
Keep code readable.
Use meaningful variable names.
Separate business logic from controllers.
Use Services.
Use Middlewares.
Validate every request.
Create centralized error handling.
Use proper HTTP status codes.
Follow REST API standards.
\--------------------------------------------------
Project Structure
Create two folders.
client/
server/
Inside client
src/
components/
layouts/
pages/
hooks/
services/
context/
assets/
utils/
styles/
Inside server
config/
controllers/
middlewares/
models/
routes/
services/
validators/
utils/
uploads/
reports/
emails/
logs/
\--------------------------------------------------
Responsive Design
Application must work perfectly on
Desktop
Laptop
Tablet
Mobile
\--------------------------------------------------
Design Theme
Professional
Corporate
Modern
Minimal
Clean
Fast
Simple
Elegant
\--------------------------------------------------
Color Palette
Primary
Blue
Secondary
White
Background
Light Gray
Text
Dark Gray
Success
Green
Warning
Orange
Danger
Red
\--------------------------------------------------
Animations
Use Framer Motion.
Smooth page transitions.
Smooth sidebar animation.
Fade animations.
Card hover animations.
Button hover effects.
Loading animations.
Skeleton loading.
\--------------------------------------------------
Navigation
Create Responsive Sidebar.
Dashboard
Employees
Projects
Daily Entries
Holiday Calendar
Weekly Reports
Monthly Reports
Email History
Settings
Profile
Logout
Sidebar should collapse.
Top Navbar should contain
Application Name
Notifications
User Profile
Logout
\--------------------------------------------------
Dashboard
Dashboard should look like an enterprise software.
Top Cards
Total Employees
Today's Entries
Weekly Productivity
Monthly Productivity
Pending Entries
Total Holidays
Generated Reports
Recent Emails
\--------------------------------------------------
Charts
Daily Productivity
Weekly Productivity
Monthly Productivity
Department Productivity
Project Productivity
Employee Comparison
\--------------------------------------------------
Dashboard Widgets
Today's Pending Entries
Recent Activities
Latest Reports
Upcoming Holidays
Quick Actions
\--------------------------------------------------
Quick Actions
Add Employee
Create Entry
Generate Report
Send Email
Add Holiday
\--------------------------------------------------
Search
Global Search
Search employee
Search project
Search reports
Search holidays
\--------------------------------------------------
Filters
Department
Project
Week
Month
Year
Employee
\--------------------------------------------------
Empty States
Whenever no data exists,
display beautiful illustrations
with action buttons.
\--------------------------------------------------
Error Pages
Create
401
403
404
500
pages.
\--------------------------------------------------
Loading
Use Skeleton Loading.
No blank pages.
\--------------------------------------------------
Theme
Support
Light Theme
Dark Theme
Save theme in Local Storage.
\--------------------------------------------------
Notifications
Use beautiful Toast Notifications.
Employee Added
Project Added
Holiday Added
Report Generated
Email Sent
Delete Success
Update Success
Error
\--------------------------------------------------
Confirmation Dialogs
Before Delete
Before Logout
Before Report Generation
Before Email Sending
\--------------------------------------------------
Pagination
Every listing page should have
Pagination
Search
Sorting
Filtering
Export
\--------------------------------------------------
Export
Support
PDF
Excel
CSV
\--------------------------------------------------
Future Ready Architecture
Write code that can easily support
Attendance Module
Leave Management
Payroll
Employee Login
Manager Login
Multi Branch
Multiple Companies
without major code changes.
\--------------------------------------------------
The generated code should be production-ready and not just a UI prototype.
Do not use mock data unless specifically required.
Build clean, scalable, maintainable architecture from the beginning.
Wait for the next specification before implementing business modules.
**Part 2: Authentication, Dashboard, Employee, Project Modules**
Continue building the Productivity Timesheet Management System.
Do not recreate the project.
Use the existing project structure from the previous prompt.
Follow MVC Architecture.
Follow REST API Standards.
Use reusable React components.
Never duplicate code.
====================================================
AUTHENTICATION MODULE
Create secure JWT Authentication.
Only two roles are required.
1\. Admin
2\. Manager
===================================================
Login Page
Fields
Email
Password
Remember Me
Forgot Password
Login Button
Show Password Toggle
Validation
Email is required
Password is required
Invalid email format
Display backend validation errors.
====================================================
Authentication Flow
User logs in.
Backend validates credentials.
Password must be compared using bcrypt.
Generate JWT Token.
Return
User Information
Role
Token
Store JWT in secure storage.
Redirect user to Dashboard.
====================================================
Protected Routes
Only authenticated users can access
Dashboard
Employees
Projects
Daily Entries
Reports
Settings
If token expires
Automatically logout
Redirect to Login.
====================================================
Middleware
Create
authMiddleware
roleMiddleware
Only Admin can
Create Employees
Delete Employees
Create Projects
Delete Projects
Holiday Management
Settings
Manager can only
View Dashboard
View Employees
View Reports
Generate Reports
====================================================
USER MODEL
Fields
Full Name
Email
Password
Role
Status
Created At
Updated At
====================================================
DASHBOARD
Create dashboard APIs.
Dashboard should calculate dynamically.
Cards
Total Employees
Active Employees
Inactive Employees
Today's Entries
Weekly Productivity
Monthly Productivity
Pending Entries
Projects
Departments
Generated Reports
Emails Sent
====================================================
Recent Activities
Latest Employee Added
Latest Entry
Latest Report
Latest Holiday
Latest Email
====================================================
Quick Actions
Add Employee
Create Entry
Generate Weekly Report
Generate Monthly Report
Send Email
====================================================
EMPLOYEE MANAGEMENT
Create complete CRUD.
Employee Fields
Employee ID
Employee Name
Email
Phone Number
Department
Designation
Joining Date
Status
Photo
Address
Notes
====================================================
Employee Table
Columns
Photo
Employee ID
Name
Department
Designation
Email
Phone
Status
Actions
====================================================
Employee Actions
Create
Update
Delete
View
Search
Pagination
Sorting
Export
====================================================
Employee Search
Search by
Employee ID
Employee Name
Email
Department
Designation
====================================================
Employee Filters
Department
Status
Joining Year
====================================================
Employee Profile Page
Display complete information.
Photo
Personal Information
Department
Designation
Joining Date
Total Projects
Weekly Productivity
Monthly Productivity
Recent Entries
====================================================
Validation
Employee ID unique
Email unique
Phone unique
Required fields validation
====================================================
PROJECT MANAGEMENT
Create complete CRUD.
Project Fields
Project Name
Project Code
Description
Department
Start Date
End Date
Status
Priority
Assigned Employees
====================================================
Project Table
Project Code
Project Name
Department
Statu
Priority
Employees Count
Actions
====================================================
Project Actions
Create
Edit
Delete
View
Search
Pagination
Sorting
====================================================
Project Search
Project Name
Project Code
Department
====================================================
Project Status
Planning
Active
Completed
On Hold
Cancelled
====================================================
Project Priority
Low
Medium
High
Critical
====================================================
Project Details Page
Display
Project Information
Assigned Employees
Weekly Productivity
Monthly Productivity
Total Completed Items
Recent Entries
====================================================
Assignment
Allow assigning multiple employees to one project.
Allow one employee to work on multiple projects.
Implement proper many-to-many relationship.
====================================================
DATABASE MODELS
Create MongoDB Models.
Users
Employees
Projects
Departments
====================================================
Relationships
Department
↓
Employees
↓
Projects
====================================================
API STRUCTURE
Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/profile
PUT /api/auth/change-password
===================================================
Dashboard
GET /api/dashboard
====================================================
Employees
GET /api/employees
GET /api/employees/:id
POST /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id
====================================================
Projects
GET /api/projects
GET /api/projects/:id
POST /api/projects
PUT /api/projects/:id
DELETE /api/projects/:id
====================================================
BACKEND
Create Controllers
Auth Controller
Dashboard Controller
Employee Controller
Project Controller
====================================================
Create Services
Auth Service
Dashboard Service
Employee Service
Project Service
====================================================
Create Validators
Login Validation
Employee Validation
Project Validation
====================================================
Create Middlewares
JWT Authentication
Role Authorization
Validation Error Handler
Global Error Handler
====================================================
FRONTEND PAGES
Create
Login
Dashboard
Employees
Employee Details
Add Employee
Edit Employee
Projects
Project Details
Add Project
Edit Project
Profile
====================================================
REACT FEATURES
Use
React Router
Axios Service Layer
React Hook Form
Context API
Protected Routes
Reusable Tables
Reusable Forms
Reusable Buttons
Reusable Modal
Reusable Confirmation Dialog
Reusable Search Component
Reusable Pagination Component
Reusable Loading Skeleton
Reusable Empty State
====================================================
UI REQUIREMENTS
Professional Enterprise Design.
Rounded Cards.
Smooth Animations.
Modern Forms.
Sticky Header.
Responsive Sidebar.
Responsive Tables.
Mobile Friendly.
====================================================
Do not use mock data.
Connect frontend with backend APIs.
Use MongoDB.
Every CRUD operation should work completely.
Generate production-ready code only.
Wait for the next specification before implementing Daily Entries, Holidays, Reports and Email modules.
**Part 3: Daily Entries, Holidays, Reports, Email, Scheduler**
Continue building the existing Productivity Timesheet Management System.
Do not recreate the application.
Continue from the existing project.
Use the same architecture, folder structure, coding standards and design system.
Implement the following modules.
====================================================
DAILY PRODUCTIVITY ENTRY MODULE
This is the core module of the application.
Purpose
Employees perform multiple tasks every day.
The company wants to know
How many work items were completed
How many hours were spent
Which project they worked on
Weekly productivity
Monthly productivity
====================================================
ENTRY CREATION
Admin or Manager can create entries.
Fields
Date
Employee
Department
Project
Task Name
Task Description
Completed Items
Working Hours
Remarks
Status
====================================================
STATUS
Draft



Submitted



Approved



Rejected



====================================================



MULTIPLE TASKS



One employee can perform multiple tasks on the same day.



Allow adding multiple task rows.



Example



Date



23-06-2026



Employee



Rahul



Task 1



Testing



Completed Items



22



Hours



3



Task 2



Bug Fix



Completed Items



18



Hours



2



Task 3



Documentation



Completed Items



10



Hours



3



Automatically calculate



Total Items



Total Hours



====================================================



VALIDATIONS



Completed Items



Cannot be negative.



Hours



Cannot exceed 24.



Future dates



Not allowed.



Duplicate task names for same project and date should not be allowed.



====================================================



AUTO CALCULATIONS



Daily Total Items



Daily Total Hours



Average Items Per Hour



Average Hours Per Task



====================================================



EDIT RULES



Draft



Can Edit



Submitted



Cannot Edit



Approved



Read Only



Rejected



Can Edit Again



====================================================



====================================================



WORKING CALENDAR



Create Working Calendar Settings.



Admin should configure



Working Days



Week Off Days



Example



Saturday



Sunday



Or



Sunday Only



Do not hardcode weekends.



====================================================



HOLIDAY MANAGEMENT



Admin CRUD



Fields



Holiday Name



Holiday Date



Holiday Type



Description



====================================================



Holiday Types



National Holiday



Festival Holiday



Company Holiday



Emergency Holiday



====================================================



Behavior



If selected date is Holiday



Display



Holiday



Disable entry creation.



====================================================



If selected date is Week Off



Display



Week Off



Disable entry creation.



====================================================



Calendar View



Create beautiful monthly calendar.



Different colors



Working Day



Holiday



Week Off



Today



====================================================



REPORTS



Generate reports dynamically.



====================================================



WEEKLY REPORT



Automatically calculate



Monday



Tuesday



Wednesday



Thursday



Friday



Saturday



Sunday



====================================================



For each employee calculate



Completed Items



Working Hours



Average Productivity



====================================================



Also calculate



Department Total



Project Total



Overall Company Total



====================================================



MONTHLY REPORT



Calculate



Working Days



Week Offs



Holidays



Completed Items



Working Hours



Average Productivity



Best Day



Worst Day



====================================================



TOP PERFORMERS



Automatically display



Top 5 Employees



Lowest 5 Employees



Highest Department



Highest Project



====================================================



CUSTOM REPORT



Allow selecting



Start Date



End Date



Generate report.



====================================================



REPORT HISTORY



Store every generated report.



Fields



Report Name



Generated By



Generated Date



Report Type



Download Count



====================================================



Allow



Download



Delete



Search



====================================================



EXPORT



Generate



PDF



Excel



CSV



PDF should contain



Company Logo



Company Name



Week



Date Range



Employee Summary



Department Summary



Project Summary



Grand Total



Generated By



Generated Date



====================================================



EMAIL MODULE



Use Nodemailer.



Create Email Settings page.



Fields



SMTP Host



SMTP Port



SMTP Username



SMTP Password



Sender Name



Sender Email



====================================================



SEND REPORT



Fields



To



CC



BCC



Subject



Message



Attachment



====================================================



Attach generated PDF automatically.



Store email history.



====================================================



EMAIL HISTORY



Store



Receiver



Subject



Date



Status



Attachment



====================================================



Status



Success



Failed



Pending



====================================================



SCHEDULER



Use node-cron.



Automatically generate report.



Admin should configure



Frequency



Weekly



Monthly



Custom



====================================================



Weekly Example



Every Friday



6 PM



Generate report.



Attach PDF.



Send Email.



Store Report.



Store Email History.



====================================================



SETTINGS



Company Name



Company Logo



Company Address



Manager Email



Default Working Hours



Default Week Off



Default Report Format



====================================================



NOTIFICATIONS



Show notifications for



Entry Saved



Entry Submitted



Report Generated



Report Downloaded



Email Sent



Scheduler Completed



====================================================



DATABASE COLLECTIONS



Entries



Tasks



Holidays



Reports



EmailHistory



Settings



====================================================



Create MongoDB Models.



Create Controllers.



Create Services.



Create Routes.



Create Validators.



====================================================



REACT PAGES



Daily Entries



Add Entry



Edit Entry



Entry Details



Holiday Calendar



Holiday Management



Weekly Reports



Monthly Reports



Custom Reports



Generate Report



Email Settings



Send Report



Email History



Settings



====================================================



BACKEND APIS



Entries



GET



POST



PUT



DELETE



Holidays



GET



POST



PUT



DELETE



Reports



Generate Weekly



Generate Monthly



Generate Custom



Download Report



Delete Report



Emails



Send Report



Get History



Scheduler



Run Manually



View Logs



====================================================



UI



Professional Corporate Dashboard.



Beautiful Calendar.



Interactive Tables.



Charts.



Responsive Layout.



Sticky Headers.



Reusable Components.



Mobile Friendly.



====================================================



Connect everything with MongoDB.



No mock data.



Generate production-ready code.



Wait for the next specification before implementing advanced analytics, audit logs, deployment and optimization.



**Part 4: Database Schema, APIs, Validations, Business Logic**



Continue building the existing Productivity Timesheet Management System.



Do not recreate the project.



Do not change the existing architecture.



Continue using React.js, Node.js, Express.js and MongoDB.



Maintain production-ready quality.



=========================================================

ADVANCED DASHBOARD ANALYTICS

=========================================================



Create a powerful analytics dashboard.



Dashboard should calculate everything dynamically.



Show the following KPI cards



• Total Employees

• Active Employees

• Total Projects

• Total Departments

• Today's Productivity

• Weekly Productivity

• Monthly Productivity

• Average Productivity

• Pending Entries

• Approved Entries

• Rejected Entries

• Total Holidays

• Generated Reports

• Emails Sent



=========================================================



CHARTS



Create interactive charts.



Use Recharts.



Charts



Daily Productivity Trend



Weekly Productivity Trend



Monthly Productivity Trend



Department Productivity



Project Productivity



Employee Productivity Comparison



Working Hours Trend



Items Completed Trend



=========================================================



TOP PERFORMERS



Display



Top 5 Employees



Top 5 Departments



Top 5 Projects



Lowest Productivity Employees



Lowest Productivity Departments



Highest Productivity Day



Lowest Productivity Day



=========================================================



PRODUCTIVITY SCORE



Create Productivity Score.



Formula



Completed Items



Working Hours



Target



Average Productivity



Generate score from 0 to 100.



Performance Levels



Excellent



Very Good



Good



Average



Needs Improvement



=========================================================



TARGET MANAGEMENT



Each Employee should have



Daily Target



Weekly Target



Monthly Target



Automatically compare



Completed



Pending



Exceeded



Achievement Percentage


=========================================================



ACTIVITY TIMELINE



Create a complete Activity Timeline module for every Daily Entry and Weekly Report.



The system should automatically track every important action performed by users.



Each timeline record should include:



\* Action Type

\* User Name

\* User Role

\* Date

\* Time

\* Previous Value (if applicable)

\* New Value (if applicable)

\* Remarks (optional)



Track the following activities:



\* Entry Created

\* Entry Updated

\* Entry Submitted

\* Entry Approved

\* Entry Rejected

\* Entry Reopened

\* Report Generated

\* Report Downloaded

\* Report Sent via Email

\* Email Delivery Status

\* Scheduler Executed

\* Holiday Created

\* Holiday Updated

\* Employee Created

\* Project Created



Display the timeline in chronological order with timestamps.



Example Timeline



24-Jun-2026 10:15 AM

Entry Created



24-Jun-2026 11:45 AM

Task Updated



24-Jun-2026 03:20 PM

Entry Submitted



26-Jun-2026 05:30 PM

Weekly Report Generated



26-Jun-2026 05:35 PM

Report Approved



26-Jun-2026 05:40 PM

Report Sent via Email



Every timeline event should be immutable.



Users must never be able to edit or delete timeline records.



Store all timeline events in MongoDB.



Provide filters for:



\* Employee

\* Date Range

\* Action Type

\* Project



Display the timeline on:



\* Employee Profile

\* Daily Entry Details

\* Weekly Report Details

\* Admin Audit Page



This timeline should help management understand the complete history of every productivity entry and report.



=========================================================



AUDIT LOGS



Create complete audit logging.



Track



Login



Logout



Employee Created



Employee Updated



Employee Deleted



Project Created



Project Updated



Holiday Added



Holiday Deleted



Entry Created



Entry Updated



Report Generated



Report Downloaded



Email Sent



Settings Updated



=========================================================



Audit Log Fields



Action



Module



User



Role



IP Address



Browser



Operating System



Date



Time



=========================================================



Create Audit Log Page.



Search



Filter



Export



=========================================================



BULK IMPORT



Allow CSV Import.



Import



Employees



Projects



Departments



Validate data before importing.



Skip duplicate records.



Generate import summary.



=========================================================



EXPORT



Support



CSV



Excel



PDF



Export



Employees



Projects



Reports



Audit Logs



Email History



=========================================================



SEARCH



Create Global Search.



Search



Employee



Project



Department



Report



Holiday



Email History



=========================================================



ADVANCED FILTERS



Date Range



Department



Project



Employee



Status



Month



Year



=========================================================



SETTINGS MODULE



Create Settings page.



General Settings



Company Name



Company Logo



Company Address



Phone



Email



Timezone



Currency



Language



=========================================================



Productivity Settings



Working Hours



Week Off



Default Report Format



Daily Target



Weekly Target



Monthly Target



=========================================================



Email Settings



SMTP Host



SMTP Port



SMTP Username



SMTP Password



Sender Email



Sender Name



=========================================================



Security Settings



Session Timeout



Password Policy



Maximum Login Attempts



JWT Expiry



=========================================================



USER PROFILE



Allow user to



Update Name



Change Password



Upload Profile Picture



Update Phone



Update Address



=========================================================



SECURITY



Protect all APIs.



Sanitize inputs.



Validate every request.



Prevent duplicate submissions.



Handle expired JWT tokens.



Implement proper CORS configuration.



Never expose sensitive information.



Store passwords using bcrypt.



Use environment variables.



=========================================================



ERROR HANDLING



Centralized Error Handler.



Meaningful API Responses.



Validation Errors



Authentication Errors



Authorization Errors



Database Errors



404



500



=========================================================



LOGGING



Create server logs.



Store



Errors



Warnings



Email Logs



Scheduler Logs



=========================================================



BACKUP



Create API to backup MongoDB data.



Allow restore from backup.



=========================================================



PERFORMANCE



Implement



Pagination



Lazy Loading



Code Splitting



Image Optimization



API Response Optimization



MongoDB Indexing



=========================================================



REUSABLE COMPONENTS



Create reusable



Table



Button



Modal



Input



Dropdown



Date Picker



Search Box



Pagination



Confirmation Dialog



Loader



Skeleton



Empty State



=========================================================



ACCESSIBILITY



Keyboard Navigation



Proper Labels



ARIA Support



Responsive Tables



High Contrast Support



=========================================================



DOCUMENTATION



Generate



README



Installation Guide



Environment Variables



API Documentation



Folder Structure



Project Overview



=========================================================



TESTING



Prepare project structure for



Unit Testing



Integration Testing



API Testing



=========================================================



DEPLOYMENT



Project should be deployment ready.



Frontend



Vercel



Netlify



Backend



Render



Railway



Database



MongoDB Atlas



Environment Variables



Production Configuration



=========================================================



FINAL REQUIREMENTS



No mock data.



No placeholder logic.



Every CRUD operation should work.



Every API should be connected.



Frontend should consume backend APIs.



Use reusable architecture.



Generate clean, maintainable and scalable code.



The application should be ready for real company usage.



Wait for the final specification before adding AI features or future enhancements.



Part 5: UI/UX Guidelines, Code Standards, Deployment, Final Instructions



Continue building the existing Productivity Timesheet Management System.



Do not restart the project.



Do not regenerate already completed files.



Always continue from the existing codebase.



========================================================



GENERAL DEVELOPMENT RULES



Before writing code,



Analyze the requirement completely.



Break the requirement into small reusable modules.



Think before coding.



Never generate duplicate components.



Never generate duplicate APIs.



Reuse existing services.



Reuse existing hooks.



Reuse existing utilities.



Follow enterprise architecture.



========================================================



CODING ORDER



Always implement in this order.



1\.



Database Model



↓



2\.



Validation



↓



3\.



Service Layer



↓



4\.



Controller



↓



5\.



Routes



↓



6\.



Backend Testing



↓



7\.



Frontend Page



↓



8\.



API Integration



↓



9\.



UI Polish



↓



10\.



Final Testing



Never skip any step.



========================================================



DATABASE



Normalize data.



Avoid duplicate fields.



Use references.



Create indexes.



Enable timestamps.



Use proper validation.



========================================================



API DESIGN



Use REST standards.



Always return JSON.



Success format



{

success,

message,

data

}



Error format



{

success,

message,

errors

}



========================================================



FRONTEND



Never write large components.



Split into reusable components.



Example



Entry Table



Entry Form



Employee Card



Employee Modal



Project Modal



Charts



Filters



Pagination



Loader



Search



Calendar



========================================================



STATE MANAGEMENT



Use Context API.



Avoid unnecessary prop drilling.



Separate API logic.



Separate business logic.



========================================================



FORMS



Every form should support



Validation



Reset



Cancel



Loading



Error Messages



Success Messages



========================================================



TABLES



Every table should support



Search



Sorting



Pagination



Column Filters



Responsive View



CSV Export



Excel Export



PDF Export



========================================================



SEARCH



Global Search



Debounce Search



Server Side Search



========================================================



LOADING



Every API call



Loading Spinner



Skeleton



Disable Button



========================================================



DELETE



Never delete immediately.



Always show confirmation dialog.



========================================================



REPORTS



Reports should be generated dynamically.



Never hardcode values.



========================================================



EMAIL



Validate email.



Retry failed email.



Store email history.



========================================================



SCHEDULER



Log every execution.



Store execution status.



Retry failed execution.



========================================================



ERROR HANDLING



Never expose server errors.



Always return friendly messages.



========================================================



SECURITY



Hash passwords.



Protect routes.



Validate JWT.



Sanitize inputs.



========================================================



PERFORMANCE



Lazy Load Pages.



Memoize Components.



Optimize Mongo Queries.



Optimize API Calls.



========================================================



CODE QUALITY



Reusable



Readable



Maintainable



Scalable



Production Ready



========================================================



UI GUIDELINES



Rounded cards



Soft shadows



Modern typography



Consistent spacing



Sticky navbar



Responsive sidebar



Smooth animations



Professional dashboard



Modern tables



Beautiful forms



Dark Mode



Light Mode



========================================================



RESPONSIVE BREAKPOINTS



Mobile



Tablet



Laptop



Desktop



========================================================



ACCESSIBILITY



Keyboard Navigation



ARIA Labels



Focus States



========================================================



TESTING



After implementing every module,



Verify



CRUD



API



Validation



Database



Frontend



Authentication



========================================================



FINAL VERIFICATION



Before considering any module complete,



Verify



Database



Backend



Frontend



Validation



Authentication



Reports



Email



Scheduler



UI



Responsiveness



========================================================



NEVER



Generate incomplete code.



Generate placeholder APIs.



Use mock data.



Ignore validation.



Ignore responsive design.



Break existing functionality.



Duplicate components.



========================================================



WHENEVER A NEW FEATURE IS REQUESTED



First analyze



Then plan



Then create database



Then backend



Then frontend



Then integrate



Then test



========================================================



PROJECT COMPLETION CHECKLIST



✔ Authentication



✔ Dashboard



✔ Employee Module



✔ Project Module



✔ Daily Entries



✔ Holiday Calendar



✔ Reports



✔ Email



✔ Scheduler



✔ Settings



✔ Audit Logs



✔ Analytics



✔ Export



✔ Search



✔ Filters



✔ Responsive UI



✔ Dark Mode



✔ Production Ready



========================================================



The final application should look like a premium enterprise software used by large companies.



The generated project should be clean enough that another developer can immediately continue working on it without restructuring anything.



Database Design (Must Add)



========================================================



DATABASE RELATIONSHIPS



Design MongoDB collections properly.



Users



↓



Employees



↓



Projects



↓



Daily Entries



↓



Tasks



↓



Reports



One Employee



↓



Many Daily Entries



One Project



↓



Many Daily Entries



One Daily Entry



↓



Many Tasks



One Department



↓



Many Employees



Never duplicate data unnecessarily.



Use ObjectId references wherever possible.



Implement proper indexing.



Business Rules



========================================================



BUSINESS RULES



One employee can create only one Daily Entry per date.



Inside that Daily Entry,



multiple tasks can be added.



Example



24-Jun



↓



Entry



↓



Testing



↓



Bug Fix



↓



Documentation



Total Items



Total Hours



should automatically calculate.



Submitted entries cannot be edited.



Approved entries become locked.



Rejected entries can be edited again.



Holiday and Week Off should never allow entry creation.



Every report should always calculate values dynamically.



Never hardcode totals.



Folder Naming Rules



========================================================



NAMING CONVENTIONS



Use camelCase



Variables



Functions



Use PascalCase



React Components



Use kebab-case



Routes



Use plural naming



employees



projects



entries



reports



Do not create unnecessary files.



Keep folders clean.



AI Instructions



========================================================



AI DEVELOPMENT INSTRUCTIONS



Before writing any code,



first analyze the requirement.



If similar functionality already exists,



reuse it.



Never regenerate files unnecessarily.



Before creating a component,



check if reusable component already exists.



Never create duplicate APIs.



Never create duplicate MongoDB models.



Always prefer reusable architecture.



Whenever uncertain,



choose the most scalable solution.





FINAL COMMAND



========================================================



FINAL EXECUTION



Build the application step-by-step.



Do not stop after creating UI.



Complete Backend.



Complete Database.



Complete API Integration.



Complete Authentication.



Complete CRUD.



Complete Report Generation.



Complete Email System.



Complete Scheduler.



Complete Dashboard.



Complete Testing.



If any feature depends on another feature,



automatically implement the dependency.



Do not ask unnecessary questions.



Use best engineering practices.



Deliver a complete production-ready enterprise application.

IMPORTANT AI EXECUTION INSTRUCTIONS



Before writing any code, analyze the entire document from beginning to end.



Never assume missing requirements.



If any requirement is unclear, infer the most scalable enterprise solution.



Always prioritize reusable architecture.



Never generate duplicate code.



Never regenerate existing files unless necessary.



Maintain consistency across frontend, backend, database, and APIs.



Treat this document as the single source of truth for the entire application.



Continue implementation until the complete application is production-ready.





