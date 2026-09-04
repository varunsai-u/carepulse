from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import date
from database import SessionLocal
from models import Patient, VitalRecord
from analysis import analyze_vitals, calculate_priority
from ai_service import generate_explanation

class PatientCreate(BaseModel):
    name: str
    date_of_birth: date
    gender: str

class PatientResponse(BaseModel):
    id: int
    name: str
    date_of_birth: date
    gender: str

    model_config = {
        "from_attributes": True
    }

class VitalRecordResponse(BaseModel):
    id: int
    patient_id: int
    recorded_at: date
    hba1c: float
    systolic_bp: int
    diastolic_bp: int

    model_config = {
        "from_attributes": True
    }

class TrendResponse(BaseModel):
    trend: str
    change: float


class PriorityResponse(BaseModel):
    score: int
    priority: str
    reasons: list[str]


class PatientSummaryResponse(BaseModel):
    id: int
    name: str
    date_of_birth: date
    gender: str
    severity: str
    score: int


class LatestValuesResponse(BaseModel):
    hba1c: float
    systolic_bp: int
    diastolic_bp: int


class AnalysisResponse(BaseModel):
    patient_id: int
    latest_values: LatestValuesResponse
    analysis: dict[str, TrendResponse]
    priority: PriorityResponse
    


class VitalRecordCreate(BaseModel):
    recorded_at: date
    hba1c: float = Field(gt=0, lt=30)
    systolic_bp: int = Field(gt=0, lt=300)
    diastolic_bp: int = Field(gt=0, lt=200)


app = FastAPI(title="CarePulse API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to CarePulse"}


@app.get("/patients", response_model=list[PatientResponse])
def get_patients():
    db = SessionLocal()

    try:
        patients = db.query(Patient).all()
        return patients
    finally:
        db.close()


@app.post("/patients")
def create_patient(patient_data: PatientCreate):
    db = SessionLocal()

    try:
        patient = Patient(
            name=patient_data.name,
            date_of_birth=patient_data.date_of_birth,
            gender=patient_data.gender
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

        return patient
    finally:
        db.close()


@app.get("/patients/summary", response_model=list[PatientSummaryResponse])
def get_patient_summary():
    db = SessionLocal()

    try:
        patients = db.query(Patient).all()
        summaries = []

        for patient in patients:
            records = (
                db.query(VitalRecord)
                .filter(VitalRecord.patient_id == patient.id)
                .order_by(VitalRecord.recorded_at)
                .all()
            )

            if not records:
                summaries.append({
                    "id": patient.id,
                    "name": patient.name,
                    "date_of_birth": patient.date_of_birth,
                    "gender": patient.gender,
                    "severity": "unknown",
                    "score": 0
                })
                continue

            vital_analysis = analyze_vitals(records)

            latest_record = records[-1]

            latest_values = {
                "hba1c": latest_record.hba1c,
                "systolic_bp": latest_record.systolic_bp,
                "diastolic_bp": latest_record.diastolic_bp
            }

            priority = calculate_priority(
                vital_analysis,
                latest_values
            )

            summaries.append({
                "id": patient.id,
                "name": patient.name,
                "date_of_birth": patient.date_of_birth,
                "gender": patient.gender,
                "severity": priority["priority"],
                "score": priority["score"]
            })

        return summaries

    finally:
        db.close()


@app.get(
    "/patients/{patient_id}/vitals",
    response_model=list[VitalRecordResponse]
)
def get_patient_vitals(patient_id: int):
    db = SessionLocal()

    try:
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id)
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        records = (
            db.query(VitalRecord)
            .filter(VitalRecord.patient_id == patient_id)
            .order_by(VitalRecord.recorded_at)
            .all()
        )

        return records

    finally:
        db.close()


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int):
    db = SessionLocal()

    try:
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id)
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        db.query(VitalRecord).filter(
            VitalRecord.patient_id == patient_id
        ).delete()

        db.delete(patient)
        db.commit()

        return {
            "message": "Patient and vital records deleted successfully"
        }

    finally:
        db.close()


@app.get("/patients/{patient_id}/ai-explanation")
def get_ai_explanation(patient_id: int):
    db = SessionLocal()

    try:
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id)
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        records = (
            db.query(VitalRecord)
            .filter(VitalRecord.patient_id == patient_id)
            .order_by(VitalRecord.recorded_at)
            .all()
        )

        if not records:
            raise HTTPException(
                status_code=404,
                detail="No vital records found for this patient"
            )

        vital_analysis = analyze_vitals(records)

        latest_record = records[-1]

        latest_values = {
            "hba1c": latest_record.hba1c,
            "systolic_bp": latest_record.systolic_bp,
            "diastolic_bp": latest_record.diastolic_bp
        }

        priority = calculate_priority(
            vital_analysis,
            latest_values
        )

        patient_analysis = {
            "latest_values": latest_values,
            "analysis": vital_analysis,
            "priority": priority
        }

        ai_explanation = generate_explanation(patient_analysis)

        return {
            "patient_id": patient_id,
            "ai_explanation": ai_explanation
        }

    finally:
        db.close()


@app.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int):
    db = SessionLocal()

    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        return patient
    finally:
        db.close()


@app.post(
    "/patients/{patient_id}/vitals",
    response_model=VitalRecordResponse
)
def create_vital_record(patient_id: int, vital_data: VitalRecordCreate):
    db = SessionLocal()

    try:
        patient = db.query(Patient).filter(
            Patient.id == patient_id
        ).first()

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        vital_record = VitalRecord(
            patient_id=patient_id,
            recorded_at=vital_data.recorded_at,
            hba1c=vital_data.hba1c,
            systolic_bp=vital_data.systolic_bp,
            diastolic_bp=vital_data.diastolic_bp
        )

        db.add(vital_record)
        db.commit()
        db.refresh(vital_record)

        return vital_record
    finally:
        db.close()


@app.get(
    "/patients/{patient_id}/analysis",
    response_model=AnalysisResponse
)
def analyze_patient(patient_id: int):
    db = SessionLocal()

    try:
        patient = db.query(Patient).filter(
            Patient.id == patient_id
        ).first()

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        records = (
            db.query(VitalRecord)
            .filter(VitalRecord.patient_id == patient_id)
            .order_by(VitalRecord.recorded_at)
            .all()
        )

        if not records:
            raise HTTPException(
                status_code=404,
                detail="No vital records found for this patient"
            )

        vital_analysis = analyze_vitals(records)

        latest_record = records[-1]

        latest_values = {
        "hba1c": latest_record.hba1c,
        "systolic_bp": latest_record.systolic_bp,
        "diastolic_bp": latest_record.diastolic_bp
        }

        priority = calculate_priority(vital_analysis, latest_values)

        patient_analysis = {
            "latest_values": latest_values,
            "analysis": vital_analysis,
            "priority": priority
        }


        return {
            "patient_id": patient_id,
            "latest_values": latest_values,
            "analysis": vital_analysis,
            "priority": priority,
            
        }

    finally:
        db.close()