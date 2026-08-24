#pragma once
#include "control.h"

namespace manual_control {
bool begin();
// Local trusted UI/service code may submit only typed targets. Cloud commands
// masuk lewat submitCloud() yang memvalidasi field sebelum mengantre.
bool submit(const control::ManualCommand& command);
// Perintah dari Firestore config/commands (sudah di-parse network worker).
// Validasi ketat: target dikenal, durasi 1..30 menit. Return false = tolak.
bool submitCloud(const control::ManualCommand& command);
bool take(control::ManualCommand& out);
}