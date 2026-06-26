import 'package:dio/dio.dart';
import 'package:oncoai/config/api_config.dart';
import 'package:oncoai/services/api_service.dart';

class PatientService {
  final ApiService _api = ApiService();

  /// Fetch a paginated list of patients with optional search filter.
  Future<List<Map<String, dynamic>>> getPatients({
    String? search,
    int? skip,
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (skip != null) queryParams['skip'] = skip;
      if (limit != null) queryParams['limit'] = limit;

      final response = await _api.get(
        ApiConfig.patients,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final data = response.data;
      if (data is List) {
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } on DioException {
      rethrow;
    }
  }

  /// Fetch a single patient by [id].
  Future<Map<String, dynamic>> getPatient(int id) async {
    try {
      final response = await _api.get(ApiConfig.patient(id));
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Create a new patient record.
  Future<Map<String, dynamic>> createPatient(
      Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.patients,
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Update an existing patient by [id].
  Future<Map<String, dynamic>> updatePatient(
      int id, Map<String, dynamic> data) async {
    try {
      final response = await _api.put(
        ApiConfig.patient(id),
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Delete a patient by [id].
  Future<void> deletePatient(int id) async {
    try {
      await _api.delete(ApiConfig.patient(id));
    } on DioException {
      rethrow;
    }
  }
}
