import re
import difflib

# Common typo normalization
TYPO_MAP = {
    "feaver": "fever",
    "temprature": "temperature",
    "vomitting": "vomiting",
    "vommiting": "vomiting",
    "diarhea": "diarrhea",
    "diahrea": "diarrhea",
    "brething": "breathing",
    "dizzines": "dizziness",
    "wekaness": "weakness",
    "hedache": "headache",
    "stomch": "stomach",
    "nausia": "nausea"
}

WORD_TO_NUM = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15
}

SYMPTOM_SYNONYMS = {
    "fever": ["fever", "febrile", "high temp", "high temperature", "temperature", "hot body"],
    "headache": ["headache", "head pain", "migraine"],
    "body_joint_pain": [
        "body pain", "body ache", "joint pain", "muscle pain", "bodyache",
        "back pain", "bicep pain", "arm pain", "neck pain", "shoulder pain", "leg pain"
    ],
    "nausea_vomiting": ["nausea", "vomit", "vomiting", "throw up", "puking", "emesis"],
    "diarrhea": ["diarrhea", "loose motion", "loose motions", "watery stool"],
    "stomach_pain": ["stomach pain", "abdominal pain", "belly pain", "abdomen pain"],
    "cold_cough_throat": ["cold", "cough", "sore throat", "throat pain", "throat irritation", "runny nose"],
    "dizziness_weakness": ["dizziness", "weakness", "weak", "fatigue", "tired", "low energy"],
    "chest_pain": ["chest pain", "pain in chest", "chest discomfort"],
    "breathing_difficulty": ["breathing difficulty", "breathing issue", "breathless", "shortness of breath", "difficulty breathing"]
}


def replace_number_words(text: str) -> str:
    tokens = text.split()
    out = []
    for t in tokens:
        pure = re.sub(r"[^a-zA-Z]", "", t.lower())
        if pure in WORD_TO_NUM:
            out.append(str(WORD_TO_NUM[pure]))
        else:
            out.append(t)
    return " ".join(out)


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = replace_number_words(text)

    tokens = re.findall(r"[a-zA-Z]+|\d+|[^\w\s]", text)
    normalized_tokens = []
    for t in tokens:
        if re.match(r"^[a-zA-Z]+$", t):
            normalized_tokens.append(TYPO_MAP.get(t, t))
        else:
            normalized_tokens.append(t)

    normalized = " ".join(normalized_tokens)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def fuzzy_contains_phrase(text_words, phrase_words, cutoff=0.84):
    for pw in phrase_words:
        if pw in text_words:
            continue
        close = difflib.get_close_matches(pw, text_words, n=1, cutoff=cutoff)
        if not close:
            return False
    return True


def extract_symptoms_from_text(text: str):
    text = normalize_text(text)
    text_words = re.findall(r"[a-zA-Z]+", text)

    result = {
        "fever": None,
        "headache": None,
        "body_joint_pain": None,
        "nausea_vomiting": None,
        "diarrhea": None,
        "stomach_pain": None,
        "cold_cough_throat": None,
        "dizziness_weakness": None,
        "chest_pain": None,
        "breathing_difficulty": None,
        "symptom_days": None
    }

    def is_negated(term):
        patterns = [
            rf"\bno\s+{re.escape(term)}\b",
            rf"\bnot\s+{re.escape(term)}\b",
            rf"\bwithout\s+{re.escape(term)}\b"
        ]
        return any(re.search(p, text) for p in patterns)

    for key, synonyms in SYMPTOM_SYNONYMS.items():
        found = None
        for phrase in synonyms:
            p = normalize_text(phrase)
            p_words = re.findall(r"[a-zA-Z]+", p)

            # direct phrase
            if p in text:
                found = 0 if is_negated(p_words[-1]) else 1
                break

            # fuzzy phrase
            if fuzzy_contains_phrase(text_words, p_words):
                found = 0 if is_negated(p_words[-1]) else 1
                break

        result[key] = found

    # days extraction (supports converted number words too)
    m_days = re.search(r"(?:since\s*)?(\d+)\s*day", text)
    if m_days:
        result["symptom_days"] = int(m_days.group(1))

    return result