import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const String _hiveBoxName = 'settings';
const String _localeKey = 'locale';

/// Supported locales for the OncoAI app.
const List<Locale> supportedLocales = [
  Locale('en'), // English
  Locale('sw'), // Swahili
];

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _loadPersistedLocale();
  }

  /// Read the persisted locale from Hive on startup.
  Future<void> _loadPersistedLocale() async {
    try {
      final box = await Hive.openBox<dynamic>(_hiveBoxName);
      final code = box.get(_localeKey) as String?;
      if (code != null) {
        state = Locale(code);
      }
    } catch (_) {
      // If Hive isn't ready yet, keep the default.
    }
  }

  /// Change the app locale and persist the choice.
  Future<void> setLocale(Locale locale) async {
    state = locale;
    try {
      final box = await Hive.openBox<dynamic>(_hiveBoxName);
      await box.put(_localeKey, locale.languageCode);
    } catch (_) {
      // Persist is best-effort; the in-memory state is already updated.
    }
  }

  /// Toggle between English and Swahili.
  Future<void> toggleLocale() async {
    final next =
        state.languageCode == 'en' ? const Locale('sw') : const Locale('en');
    await setLocale(next);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>(
  (ref) => LocaleNotifier(),
);
