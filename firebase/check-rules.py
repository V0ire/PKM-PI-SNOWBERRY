from pathlib import Path

rules = Path(__file__).with_name("firestore.rules").read_text()
required = [
    "request.auth != null",
    "owner_uid",
    "device_uid",
    "allow read, write: if false",
    "'growlight', 'pump', 'humidifier'",
    "'soil_adc_dry', 'soil_adc_wet', 'gpio', 'polarity'",
    "d.updated_by == request.auth.uid",
    "d.issued_by == request.auth.uid",
]
missing = [text for text in required if text not in rules]
assert not missing, f"Rules guard hilang: {missing}"
assert "allow read, write: if true" not in rules
print("firestore rules static check: lolos")