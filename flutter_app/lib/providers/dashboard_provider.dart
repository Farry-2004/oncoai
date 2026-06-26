import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'auth_provider.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class DashboardState {
  /// High-level stats (total patients, active cases, etc.).
  final Map<String, dynamic> stats;

  /// Cancer-type distribution breakdown.
  final List<Map<String, dynamic>> cancerDistribution;

  /// Patient journey progress percentages.
  final List<Map<String, dynamic>> journeyProgress;

  /// Stage distribution data.
  final List<Map<String, dynamic>> stageDistribution;

  /// Workup completion metrics.
  final Map<String, dynamic> workupCompletion;

  /// Tumor board statistics.
  final Map<String, dynamic> tbStats;

  /// Demographic breakdown.
  final Map<String, dynamic> demographics;

  /// Trend data over time.
  final List<Map<String, dynamic>> trends;

  final bool isLoading;
  final String? error;

  const DashboardState({
    this.stats = const {},
    this.cancerDistribution = const [],
    this.journeyProgress = const [],
    this.stageDistribution = const [],
    this.workupCompletion = const {},
    this.tbStats = const {},
    this.demographics = const {},
    this.trends = const [],
    this.isLoading = false,
    this.error,
  });

  DashboardState copyWith({
    Map<String, dynamic>? stats,
    List<Map<String, dynamic>>? cancerDistribution,
    List<Map<String, dynamic>>? journeyProgress,
    List<Map<String, dynamic>>? stageDistribution,
    Map<String, dynamic>? workupCompletion,
    Map<String, dynamic>? tbStats,
    Map<String, dynamic>? demographics,
    List<Map<String, dynamic>>? trends,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return DashboardState(
      stats: stats ?? this.stats,
      cancerDistribution: cancerDistribution ?? this.cancerDistribution,
      journeyProgress: journeyProgress ?? this.journeyProgress,
      stageDistribution: stageDistribution ?? this.stageDistribution,
      workupCompletion: workupCompletion ?? this.workupCompletion,
      tbStats: tbStats ?? this.tbStats,
      demographics: demographics ?? this.demographics,
      trends: trends ?? this.trends,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class DashboardNotifier extends StateNotifier<DashboardState> {
  DashboardNotifier(this._ref) : super(const DashboardState());

  final Ref _ref;

  Dio get _dio {
    final token = _ref.read(authProvider).token;
    return Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ),
    );
  }

  // ---- helpers ----

  List<Map<String, dynamic>> _toListOfMaps(dynamic raw) {
    if (raw is List) {
      return List<Map<String, dynamic>>.from(raw);
    }
    return [];
  }

  Map<String, dynamic> _toMap(dynamic raw) {
    if (raw is Map<String, dynamic>) return raw;
    return {};
  }

  // ---- public API ----

  /// Load summary statistics (admin stats endpoint).
  Future<void> loadStats() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.get(ApiConfig.adminStats);
      state = state.copyWith(
        stats: _toMap(response.data),
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error:
            e.response?.data?['detail']?.toString() ?? 'Failed to load stats',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Load all analytics endpoints in parallel.
  Future<void> loadAnalytics() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final results = await Future.wait([
        _dio.get(ApiConfig.analyticsCancer),
        _dio.get(ApiConfig.analyticsJourney),
        _dio.get(ApiConfig.analyticsStage),
        _dio.get(ApiConfig.analyticsWorkup),
        _dio.get(ApiConfig.analyticsTB),
        _dio.get(ApiConfig.analyticsDemographics),
        _dio.get(ApiConfig.analyticsTrends),
      ]);

      state = state.copyWith(
        cancerDistribution: _toListOfMaps(results[0].data),
        journeyProgress: _toListOfMaps(results[1].data),
        stageDistribution: _toListOfMaps(results[2].data),
        workupCompletion: _toMap(results[3].data),
        tbStats: _toMap(results[4].data),
        demographics: _toMap(results[5].data),
        trends: _toListOfMaps(results[6].data),
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ??
            'Failed to load analytics',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Convenience: reload both stats and analytics.
  Future<void> refresh() async {
    await Future.wait([loadStats(), loadAnalytics()]);
  }

  /// Clear any displayed error.
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>(
  (ref) => DashboardNotifier(ref),
);
