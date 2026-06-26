import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'auth_provider.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class PatientState {
  final List<Map<String, dynamic>> patients;
  final Map<String, dynamic>? selectedPatient;
  final bool isLoading;
  final String? error;
  final int totalCount;
  final int currentPage;

  const PatientState({
    this.patients = const [],
    this.selectedPatient,
    this.isLoading = false,
    this.error,
    this.totalCount = 0,
    this.currentPage = 1,
  });

  PatientState copyWith({
    List<Map<String, dynamic>>? patients,
    Map<String, dynamic>? selectedPatient,
    bool? isLoading,
    String? error,
    int? totalCount,
    int? currentPage,
    bool clearError = false,
    bool clearSelectedPatient = false,
  }) {
    return PatientState(
      patients: patients ?? this.patients,
      selectedPatient: clearSelectedPatient
          ? null
          : (selectedPatient ?? this.selectedPatient),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      totalCount: totalCount ?? this.totalCount,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class PatientNotifier extends StateNotifier<PatientState> {
  PatientNotifier(this._ref) : super(const PatientState());

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

  // ---- public API ----

  /// Fetch the paginated list of patients.
  Future<void> loadPatients({int page = 1, int perPage = 20}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.get(
        ApiConfig.patients,
        queryParameters: {'page': page, 'per_page': perPage},
      );
      final data = response.data;
      final List<Map<String, dynamic>> items;
      final int total;

      if (data is Map<String, dynamic>) {
        items = List<Map<String, dynamic>>.from(
          (data['patients'] ?? data['items'] ?? data['data'] ?? [])
              as Iterable,
        );
        total = (data['total'] ?? items.length) as int;
      } else if (data is List) {
        items = List<Map<String, dynamic>>.from(data);
        total = items.length;
      } else {
        items = [];
        total = 0;
      }

      state = state.copyWith(
        patients: items,
        isLoading: false,
        totalCount: total,
        currentPage: page,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ??
            'Failed to load patients',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Fetch a single patient by [id].
  Future<void> loadPatient(int id) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.get(ApiConfig.patient(id));
      final patient = response.data as Map<String, dynamic>;
      state = state.copyWith(
        selectedPatient: patient,
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ??
            'Failed to load patient',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Create a new patient record.
  Future<bool> createPatient(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.post(ApiConfig.patients, data: data);
      final created = response.data as Map<String, dynamic>;
      state = state.copyWith(
        patients: [...state.patients, created],
        totalCount: state.totalCount + 1,
        isLoading: false,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ??
            'Failed to create patient',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Update an existing patient by [id].
  Future<bool> updatePatient(int id, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.put(ApiConfig.patient(id), data: data);
      final updated = response.data as Map<String, dynamic>;

      final updatedList = state.patients.map((p) {
        if (p['id'] == id) return updated;
        return p;
      }).toList();

      state = state.copyWith(
        patients: updatedList,
        selectedPatient:
            state.selectedPatient?['id'] == id ? updated : null,
        isLoading: false,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ??
            'Failed to update patient',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Delete a patient by [id].
  Future<bool> deletePatient(int id) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _dio.delete(ApiConfig.patient(id));
      state = state.copyWith(
        patients: state.patients.where((p) => p['id'] != id).toList(),
        totalCount: state.totalCount - 1,
        isLoading: false,
        clearSelectedPatient: state.selectedPatient?['id'] == id,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ??
            'Failed to delete patient',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Search patients by [query] string.
  Future<void> searchPatients(String query) async {
    if (query.trim().isEmpty) {
      return loadPatients();
    }
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.get(
        ApiConfig.patients,
        queryParameters: {'search': query},
      );
      final data = response.data;
      final List<Map<String, dynamic>> items;

      if (data is Map<String, dynamic>) {
        items = List<Map<String, dynamic>>.from(
          (data['patients'] ?? data['items'] ?? data['data'] ?? [])
              as Iterable,
        );
      } else if (data is List) {
        items = List<Map<String, dynamic>>.from(data);
      } else {
        items = [];
      }

      state = state.copyWith(
        patients: items,
        totalCount: items.length,
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ?? 'Search failed',
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Clear the currently selected patient.
  void clearSelectedPatient() {
    state = state.copyWith(clearSelectedPatient: true);
  }

  /// Clear any displayed error.
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final patientProvider =
    StateNotifierProvider<PatientNotifier, PatientState>(
  (ref) => PatientNotifier(ref),
);
