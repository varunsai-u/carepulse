from sqlalchemy import String, ForeignKey, Date
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    date_of_birth: Mapped[Date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(20))

class VitalRecord(Base):
    __tablename__ = "vital_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    recorded_at: Mapped[Date] = mapped_column(Date)
    hba1c: Mapped[float] = mapped_column()
    systolic_bp: Mapped[int] = mapped_column()
    diastolic_bp: Mapped[int] = mapped_column()