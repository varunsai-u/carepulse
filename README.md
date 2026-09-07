# CarePulse 🩺☁️

**CarePulse** is a small learning project I built to explore **Azure, backend development, PostgreSQL, AI integration, and cloud deployment** by building a complete application rather than only completing labs.

It is an educational prototype that uses **synthetic patient data** to analyse health trends, prioritise records for review, and generate an AI explanation of the result.

> ⚠️ CarePulse is not a medical diagnostic system. The thresholds and prioritisation rules are prototype-defined and are not clinical guidelines.

---

## 🚀 What It Does

CarePulse allows users to:

- Create and view patient records
- Store historical vital measurements
- Analyse changes in HbA1c and blood pressure
- Calculate a priority score using deterministic rules
- View Low / Medium / High priority
- See the reasons behind the calculated priority
- Generate an AI explanation using Azure OpenAI / Microsoft Foundry

The important design choice is:

```text
Patient Data
     ↓
Python Trend Analysis
     ↓
Deterministic Priority Calculation
     ↓
Priority Score
     ↓
Azure OpenAI
     ↓
AI Explanation
```

**AI explains the result; it does not decide the priority.**

---

# 🏗️ Architecture

```text
                   USER
                     │
                     ▼
             React + Vite
                     │
                     ▼
          Azure Static Web Apps
                     │
                  HTTP API
                     │
                     ▼
              FastAPI Backend
              Azure App Service
                 │        │
                 │        ▼
                 │    Azure OpenAI
                 │
                 ▼
       Azure PostgreSQL
       Flexible Server
```

---

# 💻 Local Development

I first built and tested the application locally before deploying it to Azure.

The local setup consists of:

```text
React + Vite
      ↓
FastAPI
      ↓
PostgreSQL (Docker)
      ↓
Azure OpenAI
```

### Frontend

The frontend was built using **React and Vite**.

Vite was used for:

- Local development
- Building the production frontend

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

The production build is generated inside:

```text
frontend/dist/
```

### Backend

The backend was built using **Python and FastAPI**.

It provides REST APIs for:

- Patients
- Vital records
- Trend analysis
- Priority calculation
- AI explanations

The backend can be started locally with:

```bash
python -m fastapi dev main.py
```

### Database

For local development, PostgreSQL runs inside Docker.

The backend connects to it using:

```text
DATABASE_URL=postgresql+psycopg://carepulse:carepulse_dev@localhost:5432/carepulse
```

### AI

The backend connects to the Azure OpenAI / Microsoft Foundry model deployment using the OpenAI Python SDK.

The AI configuration is provided through environment variables.

---

# ☁️ Azure Deployment

After getting the application working locally, I deployed the same application architecture to Azure.

The cloud setup is:

```text
React + Vite
      ↓
Azure Static Web Apps
      ↓
Azure App Service
      ↓
Azure PostgreSQL Flexible Server
      ↓
Azure OpenAI / Microsoft Foundry
```

### Frontend

The React application is built using:

```bash
npm run build
```

The generated `dist` folder is deployed to **Azure Static Web Apps**.

### Backend

The FastAPI application is deployed to **Azure App Service**.

The backend uses the same Python application developed locally.

Azure App Service provides the hosted environment for the FastAPI API.

### Database

The local PostgreSQL database is replaced by:

**Azure Database for PostgreSQL – Flexible Server**

The application code remains PostgreSQL-based; only the database connection configuration changes.

### AI

The deployed backend connects to the Azure-hosted model deployment for generating explanations.

---

# 📊 Priority Algorithm

CarePulse uses deterministic Python rules to calculate a priority score.

### Trend points

| Condition                                        | Points |
| ------------------------------------------------ | -----: |
| HbA1c consistently increasing                    |    +30 |
| Systolic BP consistently increasing              |    +25 |
| Diastolic BP consistently increasing             |    +20 |
| Two or more measurements consistently increasing |    +25 |

### Latest-value points

| Condition                | Points |
| ------------------------ | -----: |
| Latest HbA1c > 7.0       |    +10 |
| Latest systolic BP > 140 |    +10 |
| Latest diastolic BP > 90 |    +10 |

The score is capped at 100.

```text
0–29     → LOW
30–59    → MEDIUM
60–100   → HIGH
```

The change for a measurement is calculated as:

```text
latest value - first recorded value
```

> These are prototype-defined rules for this project and are not clinical thresholds.

---

# 🤖 AI Integration

The AI functionality is implemented in the backend.

The process is:

```text
Patient ID
    ↓
Retrieve records from PostgreSQL
    ↓
Run Python analysis
    ↓
Calculate priority
    ↓
Send analysis to Azure OpenAI
    ↓
Generate explanation
    ↓
Return explanation to frontend
```

The AI receives the calculated result and explains:

- Key observations
- Trends
- Reasons contributing to the priority
- Overall summary

It is explicitly instructed not to recalculate or change the priority.

---

# 🔌 API Endpoints

| Method | Endpoint                        | Purpose                         |
| ------ | ------------------------------- | ------------------------------- |
| GET    | `/`                             | Basic API response              |
| GET    | `/patients`                     | Get all patients                |
| POST   | `/patients`                     | Create patient                  |
| GET    | `/patients/summary`             | Patient overview and priority   |
| GET    | `/patients/{id}`                | Get patient details             |
| GET    | `/patients/{id}/vitals`         | Get patient vitals              |
| POST   | `/patients/{id}/vitals`         | Add vital record                |
| DELETE | `/patients/{id}`                | Delete patient                  |
| GET    | `/patients/{id}/analysis`       | Detailed deterministic analysis |
| GET    | `/patients/{id}/ai-explanation` | Generate AI explanation         |

---

# 📁 Project Structure

```text
carepulse/
│
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── analysis.py
│   ├── ai_service.py
│   ├── test_ai.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

---

# 🧑‍💻 Run CarePulse Locally

Anyone can clone this repository and run the project locally.

## 1. Clone the repository

```bash
git clone https://github.com/varunsai-u/carepulse.git
cd carepulse
```

---

## 2. Start PostgreSQL

Make sure **Docker Desktop** is installed and running.

Create the PostgreSQL container:

```bash
docker run --name carepulse-postgres \
  -e POSTGRES_USER=carepulse \
  -e POSTGRES_PASSWORD=carepulse_dev \
  -e POSTGRES_DB=carepulse \
  -p 5432:5432 \
  -d postgres
```

If the container already exists:

```bash
docker start carepulse-postgres
```

---

# 🐍 3. Set Up the Backend

Go to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

### macOS / Linux

```bash
source .venv/bin/activate
```

### Windows

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 🔐 4. Configure Backend Environment

Create:

```text
backend/.env
```

Add:

```text
DATABASE_URL=postgresql+psycopg://carepulse:carepulse_dev@localhost:5432/carepulse

AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT=your_azure_openai_deployment
```

You need your own Azure OpenAI / Microsoft Foundry model deployment to use the AI functionality.

**Never commit your `.env` file or API key to GitHub.**

---

# ▶️ 5. Start the Backend

From the `backend` directory:

```bash
python -m fastapi dev main.py
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI documentation is available at:

```text
http://localhost:8000/docs
```

---

# ⚛️ 6. Set Up the Frontend

Open another terminal.

```bash
cd carepulse/frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/.env
```

Add:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

---

# 🔄 Local Application Flow

Once everything is running:

```text
Browser
   ↓
React Frontend
   ↓
FastAPI
   ↓
PostgreSQL
```

When AI explanation is requested:

```text
Browser
   ↓
React
   ↓
FastAPI
   ↓
PostgreSQL
   ↓
Python Analysis
   ↓
Azure OpenAI
   ↓
FastAPI
   ↓
React
```

---

# 🌐 Environment Configuration

The same application can run locally or in Azure by changing environment variables.

### Local frontend

```text
VITE_API_BASE_URL=http://localhost:8000
```

### Cloud frontend

```text
VITE_API_BASE_URL=https://YOUR-AZURE-BACKEND.azurewebsites.net
```

The frontend does not contain database credentials or Azure OpenAI secrets.

---

# 🔒 Security Notes

- `.env` files are excluded using `.gitignore`
- API keys are not committed to GitHub
- Database passwords are not committed
- Frontend `VITE_*` variables should never contain secrets
- Only synthetic patient data is used in this project

---

# 📌 Current Azure Services

| Azure Service                                   | Purpose                 |
| ----------------------------------------------- | ----------------------- |
| Azure Static Web Apps                           | React frontend hosting  |
| Azure App Service                               | FastAPI backend hosting |
| Azure Database for PostgreSQL – Flexible Server | Cloud database          |
| Microsoft Foundry / Azure OpenAI                | AI explanations         |
| Azure Monitor                                   | Request monitoring      |
| Cost Management / Budgets                       | Cost tracking           |

---

# 📚 What I Learned

This project helped me understand how to connect different technologies into one working application:

- React + Vite
- FastAPI
- REST APIs
- PostgreSQL
- SQLAlchemy
- Docker
- Azure App Service
- Azure Static Web Apps
- Azure PostgreSQL
- Azure OpenAI / Microsoft Foundry
- OpenAI Python SDK
- Environment variables
- Git and GitHub
- Cloud deployment
- Azure monitoring

The main goal was to **learn Azure by actually building something**, rather than only completing individual labs.

---

# 🔮 Future Improvements

Possible future additions include:

- Microsoft Entra ID authentication
- Azure Key Vault
- Managed Identity
- Azure Blob Storage
- Azure Functions
- Event-driven processing
- Azure Health Data Services / FHIR
- Automated testing
- More advanced analytics
- Production-grade security

---

# ⚠️ Disclaimer

CarePulse is an **educational portfolio project** using synthetic patient data.

It is not intended to:

- Diagnose medical conditions
- Recommend treatment
- Replace healthcare professionals
- Make real clinical decisions

The prioritisation thresholds and scoring system are created specifically for this prototype.

---

## 👨‍💻 Author

**Varunsai Upputuri**

Built as a hands-on project to explore:

**Azure ☁️ + AI 🤖 + Backend 🐍 + PostgreSQL 🗄️ + Cloud Deployment 🚀**
