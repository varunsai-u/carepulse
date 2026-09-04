import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

client = OpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    base_url=f"{AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/v1/"
)


def generate_explanation(patient_analysis):
    response = client.responses.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        input=f"""
You are an explanation assistant for CarePulse.

CarePulse uses deterministic rules to calculate patient-review priority.
The priority has ALREADY been calculated. You must NOT change, question,
or recalculate the priority.

Your job is only to explain the evidence in clear, professional language.

Important:
- "change" means the difference between the FIRST recorded measurement
  and the LATEST recorded measurement.
- Do not describe "change" as a change since the previous measurement.
- Do not diagnose the patient.
- Do not recommend treatment.
- Do not invent information that is not present in the data.
- Clearly distinguish between observed measurements, trends, and the
  existing priority score.
- Do not infer or reconstruct missing measurements.
- Do not offer to perform additional analysis.
Patient analysis:
{patient_analysis}
"""
    )

    return response.output_text