def calculate_trend(values):
    if len(values) < 2:
        return {
            "trend": "insufficient_data",
            "change": 0
        }
    change = round(values[-1] - values[0], 2)

    if abs(change) < 0.5:
        return {
            "trend": "stable",
            "change": change
        }

    increasing = 0
    decreasing = 0

    for i in range(1, len(values)):
        if values[i] > values[i - 1]:
            increasing += 1
        elif values[i] < values[i - 1]:
            decreasing += 1

    

    if increasing == len(values) - 1:
        trend = "increasing"
    elif decreasing == len(values) - 1:
        trend = "decreasing"
    else:
        trend = "mixed"

    return {
        "trend": trend,
        "change": change
    }
def analyze_hba1c(records):
    values = [record.hba1c for record in records]

    return calculate_trend(values)
def analyze_vitals(records):
    hba1c_values = [record.hba1c for record in records]
    systolic_values = [record.systolic_bp for record in records]
    diastolic_values = [record.diastolic_bp for record in records]

    return {
        "hba1c": calculate_trend(hba1c_values),
        "systolic_bp": calculate_trend(systolic_values),
        "diastolic_bp": calculate_trend(diastolic_values)
    }
def calculate_priority(analysis, latest_values):
    score = 0
    reasons = []

    if analysis["hba1c"]["trend"] == "increasing":
        score += 30
        reasons.append("HbA1c is consistently increasing")

    if analysis["systolic_bp"]["trend"] == "increasing":
        score += 25
        reasons.append("Systolic blood pressure is consistently increasing")

    if analysis["diastolic_bp"]["trend"] == "increasing":
        score += 20
        reasons.append("Diastolic blood pressure is consistently increasing")

    increasing_count = sum(
        1
        for metric in analysis.values()
        if metric["trend"] == "increasing"
    )

    if increasing_count >= 2:
        score += 25
        reasons.append("Multiple measurements show worsening trends")

    if latest_values["hba1c"] > 7.0:
        score += 10
        reasons.append("Latest HbA1c is above the prototype threshold")

    if latest_values["systolic_bp"] > 140:
        score += 10
        reasons.append("Latest systolic blood pressure is above the prototype threshold")

    if latest_values["diastolic_bp"] > 90:
        score += 10
        reasons.append("Latest diastolic blood pressure is above the prototype threshold")

    score = min(score, 100)

    if score >= 60:
        priority = "high"
    elif score >= 30:
        priority = "medium"
    else:
        priority = "low"
    if not reasons:
        reasons.append("No worsening trends detected")
    return {
        "score": score,
        "priority": priority,
        "reasons": reasons
    }