#include "manual_control.h"
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

namespace {
QueueHandle_t g_queue;
}
namespace manual_control {
bool begin() {
  g_queue = xQueueCreate(1, sizeof(control::ManualCommand));
  return g_queue != nullptr;
}
bool submit(const control::ManualCommand& command) {
  if (!g_queue || !command.valid || command.target == ManualTarget::UNKNOWN) return false;
  return xQueueOverwrite(g_queue, &command) == pdTRUE;
}
bool submitCloud(const control::ManualCommand& command) {
  if (!g_queue || !command.valid || command.target == ManualTarget::UNKNOWN) return false;
  if (command.duration_ms == 0 || command.duration_ms > 30UL * 60UL * 1000UL) return false;
  return xQueueOverwrite(g_queue, &command) == pdTRUE;
}
bool take(control::ManualCommand& out) {
  return g_queue && xQueueReceive(g_queue, &out, 0) == pdTRUE;
}
}