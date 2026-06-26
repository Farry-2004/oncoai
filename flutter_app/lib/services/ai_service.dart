import 'package:dio/dio.dart';
import 'package:oncoai/config/api_config.dart';
import 'package:oncoai/services/api_service.dart';

class AiService {
  final ApiService _api = ApiService();

  /// Run AI orchestration for a patient with the specified agent list.
  ///
  /// [agents] is a list of agent identifiers to run (e.g.
  /// `["pathology", "imaging", "labs"]`).
  Future<Map<String, dynamic>> orchestrate(
      int patientId, List<String> agents) async {
    try {
      final response = await _api.post(
        ApiConfig.orchestrate,
        data: {
          'patient_id': patientId,
          'agents': agents,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Generate an AI summary for a patient.
  Future<Map<String, dynamic>> summarize(int patientId) async {
    try {
      final response = await _api.post(
        ApiConfig.summarize,
        data: {
          'patient_id': patientId,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Fetch the tumor-board summary text for a patient.
  Future<String> getBoardSummary(int patientId) async {
    try {
      final response = await _api.get(
        ApiConfig.boardSummary(patientId),
      );

      final data = response.data;
      if (data is Map<String, dynamic>) {
        return data['summary'] as String? ?? '';
      }
      if (data is String) {
        return data;
      }
      return '';
    } on DioException {
      rethrow;
    }
  }
}
