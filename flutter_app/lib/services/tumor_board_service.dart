import 'package:dio/dio.dart';
import 'package:oncoai/config/api_config.dart';
import 'package:oncoai/services/api_service.dart';

class TumorBoardService {
  final ApiService _api = ApiService();

  /// Fetch tumor boards, optionally filtered by [status].
  Future<List<Map<String, dynamic>>> getTumorBoards({String? status}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (status != null && status.isNotEmpty) queryParams['status'] = status;

      final response = await _api.get(
        ApiConfig.tumorBoards,
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

  /// Fetch all tumor boards associated with a specific patient.
  Future<List<Map<String, dynamic>>> getPatientTumorBoards(
      int patientId) async {
    try {
      final response = await _api.get(
        ApiConfig.patientTumorBoards(patientId),
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

  /// Create a new tumor board for a patient.
  Future<Map<String, dynamic>> createTumorBoard(
      int patientId, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.patientTumorBoards(patientId),
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Update an existing tumor board by [id].
  Future<Map<String, dynamic>> updateTumorBoard(
      int id, Map<String, dynamic> data) async {
    try {
      final response = await _api.put(
        '${ApiConfig.tumorBoards}/$id',
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Delete a tumor board by [id].
  Future<void> deleteTumorBoard(int id) async {
    try {
      await _api.delete('${ApiConfig.tumorBoards}/$id');
    } on DioException {
      rethrow;
    }
  }

  /// Join a tumor board meeting by [id].
  Future<Map<String, dynamic>> joinMeeting(int id) async {
    try {
      final response = await _api.post(ApiConfig.joinTumorBoard(id));
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Cast a vote on a tumor board by [id].
  Future<Map<String, dynamic>> castVote(
      int id, String vote, String? comment) async {
    try {
      final response = await _api.post(
        ApiConfig.voteTumorBoard(id),
        data: {
          'vote': vote,
          if (comment != null) 'comment': comment,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }
}
