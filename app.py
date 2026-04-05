from flask import Flask, render_template, request, jsonify
from nlp_parser import extract_symptoms_from_text

app = Flask(__name__)

# -----------------------------
# Chronic disease risk mapping
# -----------------------------
CHRONIC_RISK_MAP = {
    "none": 0,
    "tonsillitis": 0,
    "mild_allergy": 0,

    "thyroid_disorder": 1,
    "migraine": 1,
    "anemia": 1,
    "recurrent_gastritis": 1,

    "asthma": 2,
    "diabetes": 2,
    "hypertension": 2,
    "epilepsy": 2,

    "heart_disease": 3,
    "kidney_disease": 3,
    "immunocompromised": 3
}

CHRONIC_TIER_POINTS = {0: 0, 1: 3, 2: 8, 3: 12}


def get_chronic_risk_tier(chronic_list):
    if not chronic_list:
        return 0
    tiers = [CHRONIC_RISK_MAP.get(item, 0) for item in chronic_list]
    return max(tiers) if tiers else 0


def fever_level_to_temp(level):
    """
    Convert user fever level to estimated temperature
    """
    level = (level or "").lower()
    if level == "low":
        return 99.5
    if level == "mid":
        return 101.0
    if level == "high":
        return 103.0
    return 98.6


def emergency_override(data):
    if data["chest_pain"] == 1:
        return True, "Chest pain present"
    if data["temperature_f"] >= 103.5:
        return True, "Very high fever"
    if data["pain_score"] >= 9:
        return True, "Severe pain"
    if (
        data["fever"] == 1 and
        data["nausea_vomiting"] == 1 and
        data["dizziness_weakness"] == 1 and
        data["symptom_days"] >= 2
    ):
        return True, "Systemic risk pattern (fever + vomiting + weakness)"
    return False, ""


def calculate_score(data, chronic_tier):
    score = 0
    reasons = []

    if data["fever"] == 1:
        score += 8
        reasons.append("Fever present")

    if data["temperature_f"] >= 102:
        score += 10
        reasons.append("High temperature")
    elif data["temperature_f"] >= 100:
        score += 5

    if data["symptom_days"] >= 5:
        score += 6
        reasons.append("Symptoms for multiple days")

    if data["headache"] == 1:
        score += 4
    if data["body_joint_pain"] == 1:
        score += 5
    if data["nausea_vomiting"] == 1:
        score += 7
        reasons.append("Nausea/Vomiting")
    if data["diarrhea"] == 1:
        score += 6
        reasons.append("Diarrhea")
    if data["stomach_pain"] == 1:
        score += 5
    if data["cold_cough_throat"] == 1:
        score += 3
    if data["dizziness_weakness"] == 1:
        score += 8
        reasons.append("Weakness/Dizziness")

    # breathing is weighted, not emergency override
    if data["breathing_difficulty"] == 1:
        score += 9
        reasons.append("Breathing discomfort")

    if data["chest_pain"] == 1:
        score += 20
        reasons.append("Chest pain")

    if data["pain_score"] >= 8:
        score += 10
        reasons.append("High pain score")
    elif data["pain_score"] >= 5:
        score += 5

    score += CHRONIC_TIER_POINTS[chronic_tier]
    if chronic_tier > 0:
        reasons.append(f"Chronic risk tier {chronic_tier}")

    return min(score, 100), reasons


def score_to_priority(score):
    if score >= 45:
        return "High"
    elif score >= 25:
        return "Medium"
    return "Low"


def generate_doctor_summary(data, predicted_priority, final_priority, score, chronic_tier, reasons, override_reason):
    symptom_list = []
    if data["headache"] == 1: symptom_list.append("headache")
    if data["body_joint_pain"] == 1: symptom_list.append("body/joint pain")
    if data["nausea_vomiting"] == 1: symptom_list.append("nausea/vomiting")
    if data["diarrhea"] == 1: symptom_list.append("diarrhea")
    if data["stomach_pain"] == 1: symptom_list.append("stomach pain")
    if data["cold_cough_throat"] == 1: symptom_list.append("cold/cough/throat irritation")
    if data["dizziness_weakness"] == 1: symptom_list.append("dizziness/weakness")
    if data["breathing_difficulty"] == 1: symptom_list.append("breathing discomfort")
    if data["chest_pain"] == 1: symptom_list.append("chest pain")

    symptoms_text = ", ".join(symptom_list) if symptom_list else "mild/general symptoms only"
    reason_text = ", ".join(reasons) if reasons else "No major risk indicators"
    fever_text = "Yes" if data["fever"] == 1 else "No"

    summary = (
        f"Student reports {data['main_complaint']} for {data['symptom_days']} day(s). "
        f"Fever: {fever_text}"
    )

    if data["fever"] == 1:
        summary += f" (Level: {data.get('fever_level', 'NA')}, Est. Temp: {data['temperature_f']}°F). "
    else:
        summary += f" (Temp baseline: {data['temperature_f']}°F). "

    summary += (
        f"Pain score: {data['pain_score']}/10. "
        f"Key symptoms: {symptoms_text}. "
        f"Chronic risk tier: {chronic_tier}. "
        f"Model urgency: {predicted_priority} ({score}/100). "
        f"Final urgency: {final_priority}. "
        f"Key reasons: {reason_text}."
    )

    if override_reason:
        summary += f" Override trigger: {override_reason}."

    return summary


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/nlp_extract", methods=["POST"])
def nlp_extract():
    data = request.get_json()
    text = data.get("text", "")
    parsed = extract_symptoms_from_text(text)
    return jsonify(parsed)


@app.route("/triage_predict", methods=["POST"])
def triage_predict():
    data = request.get_json()

    # Safe defaults
    data["fever"] = int(data.get("fever", 0))
    data["symptom_days"] = int(data.get("symptom_days", 1))
    data["pain_score"] = int(data.get("pain_score", 0))
    data["headache"] = int(data.get("headache", 0))
    data["body_joint_pain"] = int(data.get("body_joint_pain", 0))
    data["nausea_vomiting"] = int(data.get("nausea_vomiting", 0))
    data["diarrhea"] = int(data.get("diarrhea", 0))
    data["stomach_pain"] = int(data.get("stomach_pain", 0))
    data["cold_cough_throat"] = int(data.get("cold_cough_throat", 0))
    data["dizziness_weakness"] = int(data.get("dizziness_weakness", 0))
    data["chest_pain"] = int(data.get("chest_pain", 0))
    data["breathing_difficulty"] = int(data.get("breathing_difficulty", 0))

    # Fever level to temperature
    fever_level = data.get("fever_level", "")
    data["fever_level"] = fever_level
    if data["fever"] == 1:
        data["temperature_f"] = fever_level_to_temp(fever_level)
    else:
        data["temperature_f"] = 98.6
        data["fever_level"] = ""

    # Chronic tier
    chronic_conditions = data.get("chronic_conditions", [])
    chronic_tier = get_chronic_risk_tier(chronic_conditions)

    # Score and priority
    score, reasons = calculate_score(data, chronic_tier)
    predicted_priority = score_to_priority(score)

    # Emergency override
    override_flag, override_reason = emergency_override(data)
    final_priority = "High" if override_flag else predicted_priority

    # Doctor summary
    doctor_summary = generate_doctor_summary(
        data=data,
        predicted_priority=predicted_priority,
        final_priority=final_priority,
        score=score,
        chronic_tier=chronic_tier,
        reasons=reasons,
        override_reason=override_reason
    )

    return jsonify({
        "predicted_priority": predicted_priority,
        "final_priority": final_priority,
        "priority_score": score,
        "override_flag": override_flag,
        "override_reason": override_reason,
        "chronic_risk_tier": chronic_tier,
        "reason_summary": ", ".join(reasons) if reasons else "No major risk indicators",
        "doctor_summary": doctor_summary
    })


if __name__ == "__main__":
    app.run(debug=True)