import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const String _hiveBoxName = 'settings';
const String _themeKey = 'theme_mode';

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light) {
    _loadPersistedTheme();
  }

  /// Read the persisted theme mode from Hive on startup.
  Future<void> _loadPersistedTheme() async {
    try {
      final box = await Hive.openBox<dynamic>(_hiveBoxName);
      final value = box.get(_themeKey) as String?;
      if (value != null) {
        state = _fromString(value);
      }
    } catch (_) {
      // If Hive isn't ready yet, keep the default.
    }
  }

  /// Set the theme mode explicitly and persist the choice.
  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    try {
      final box = await Hive.openBox<dynamic>(_hiveBoxName);
      await box.put(_themeKey, _toString(mode));
    } catch (_) {
      // Persist is best-effort; the in-memory state is already updated.
    }
  }

  /// Toggle between light and dark modes.
  Future<void> toggleTheme() async {
    final next =
        state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    await setThemeMode(next);
  }

  // ---- serialisation helpers ----

  static String _toString(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.dark:
        return 'dark';
      case ThemeMode.light:
        return 'light';
      case ThemeMode.system:
        return 'system';
    }
  }

  static ThemeMode _fromString(String value) {
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.light;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>(
  (ref) => ThemeNotifier(),
);
