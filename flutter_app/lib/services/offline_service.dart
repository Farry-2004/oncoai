import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:oncoai/services/api_service.dart';

class OfflineService {
  static const String _patientsBoxName = 'patients_cache';
  static const String _dashboardBoxName = 'dashboard_cache';
  static const String _mutationsBoxName = 'pending_mutations';

  late Box<String> _patientsBox;
  late Box<String> _dashboardBox;
  late Box<String> _mutationsBox;

  final Connectivity _connectivity = Connectivity();

  /// Initialize Hive and open all required boxes.
  /// Call this once during app startup (e.g. in `main()`).
  Future<void> init() async {
    await Hive.initFlutter();
    _patientsBox = await Hive.openBox<String>(_patientsBoxName);
    _dashboardBox = await Hive.openBox<String>(_dashboardBoxName);
    _mutationsBox = await Hive.openBox<String>(_mutationsBoxName);
  }

  // ---------------------------------------------------------------------------
  // Connectivity
  // ---------------------------------------------------------------------------

  /// Check whether the device currently has network connectivity.
  Future<bool> get isOnline async {
    final result = await _connectivity.checkConnectivity();
    return !result.contains(ConnectivityResult.none);
  }

  // ---------------------------------------------------------------------------
  // Patient cache
  // ---------------------------------------------------------------------------

  /// Store a list of patient maps locally.
  Future<void> cachePatients(List<Map<String, dynamic>> patients) async {
    await _patientsBox.put('all', jsonEncode(patients));
  }

  /// Retrieve the locally cached patient list.
  List<Map<String, dynamic>> getCachedPatients() {
    final raw = _patientsBox.get('all');
    if (raw == null) return [];
    try {
      final decoded = jsonDecode(raw) as List<dynamic>;
      return decoded.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Dashboard cache
  // ---------------------------------------------------------------------------

  /// Store dashboard data locally.
  Future<void> cacheDashboard(Map<String, dynamic> data) async {
    await _dashboardBox.put('data', jsonEncode(data));
  }

  /// Retrieve the locally cached dashboard data.
  Map<String, dynamic>? getCachedDashboard() {
    final raw = _dashboardBox.get('data');
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Mutation queue (offline-first writes)
  // ---------------------------------------------------------------------------

  /// Queue a mutation to be replayed when the device comes back online.
  Future<void> queueMutation(
      String method, String url, Map<String, dynamic>? body) async {
    final mutation = {
      'method': method,
      'url': url,
      'body': body,
      'created_at': DateTime.now().toIso8601String(),
    };
    await _mutationsBox.add(jsonEncode(mutation));
  }

  /// Replay all pending mutations against the API and clear the queue.
  ///
  /// Returns the number of mutations that were successfully synced.
  Future<int> syncPendingMutations() async {
    final api = ApiService();
    int synced = 0;
    final keysToDelete = <dynamic>[];

    for (final key in _mutationsBox.keys) {
      final raw = _mutationsBox.get(key);
      if (raw == null) continue;

      try {
        final mutation = jsonDecode(raw) as Map<String, dynamic>;
        final method = mutation['method'] as String;
        final url = mutation['url'] as String;
        final body = mutation['body'] as Map<String, dynamic>?;

        switch (method.toUpperCase()) {
          case 'POST':
            await api.post(url, data: body);
            break;
          case 'PUT':
            await api.put(url, data: body);
            break;
          case 'DELETE':
            await api.delete(url, data: body);
            break;
          default:
            break;
        }

        keysToDelete.add(key);
        synced++;
      } catch (_) {
        // Stop syncing on first failure to preserve ordering.
        break;
      }
    }

    for (final key in keysToDelete) {
      await _mutationsBox.delete(key);
    }

    return synced;
  }

  /// Clear all cached data and pending mutations.
  Future<void> clearAll() async {
    await _patientsBox.clear();
    await _dashboardBox.clear();
    await _mutationsBox.clear();
  }
}
