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

Your job is to explain the existing result clearly and briefly.

STRICT OUTPUT FORMAT:

Priority: <priority level> (<score>/100)

Key observations:
• <observation>
• <observation>
• <observation>

Why this contributed to the priority:
• <reason>
• <reason>
• <reason>

Summary:
<1-2 short sentences>

RULES:
- Keep the entire response under 120 words.
- Use short bullet points.
- Put each bullet on its own line.
- Leave a blank line between sections.
- Do not write one large paragraph.
- Do not diagnose the patient.
- Do not recommend treatment.
- Do not change or recalculate the priority.
- Do not invent information.
- Do not infer missing measurements.
- "change" means the difference between the FIRST recorded
  measurement and the LATEST recorded measurement.
- Clearly distinguish observed measurements, trends, and the
  existing priority score.
- The prototype thresholds are system-defined thresholds, not
  clinical guidelines.

Patient analysis:
{patient_analysis}
"""
    )

    return response.output_text