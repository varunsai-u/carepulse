# Manual Azure OpenAI integration test.
# This makes a real Azure OpenAI API call and may incur usage charges.
# Make sure your .env file is configured before running this script.

from ai_service import generate_explanation


test_analysis = {
    "latest_values": {
        "hba1c": 8.7,
        "systolic_bp": 162,
        "diastolic_bp": 102
    },
    "analysis": {
        "hba1c": {
            "trend": "increasing",
            "change": 1.9
        },
        "systolic_bp": {
            "trend": "increasing",
            "change": 17
        },
        "diastolic_bp": {
            "trend": "increasing",
            "change": 12
        }
    },
    "priority": {
        "score": 100,
        "priority": "high",
        "reasons": [
            "HbA1c is consistently increasing",
            "Systolic blood pressure is consistently increasing",
            "Diastolic blood pressure is consistently increasing",
            "Multiple measurements show worsening trends",
            "Latest HbA1c is above the prototype threshold",
            "Latest systolic blood pressure is above the prototype threshold",
            "Latest diastolic blood pressure is above the prototype threshold"
        ]
    }
}


explanation = generate_explanation(test_analysis)

print("\nAI EXPLANATION:\n")
print(explanation)