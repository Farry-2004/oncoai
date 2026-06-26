import 'package:dio/dio.dart';
import 'package:oncoai/config/api_config.dart';
import 'package:oncoai/services/api_service.dart';

class ClinicalService {
  final ApiService _api = ApiService();

  // ---------------------------------------------------------------------------
  // Lab Results
  // ---------------------------------------------------------------------------

  /// Fetch all lab results for a patient.
  Future<List<Map<String, dynamic>>> getLabResults(int patientId) async {
    try {
      final response = await _api.get(
        ApiConfig.patientLabResults(patientId),
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

  /// Create a lab result for a patient.
  Future<Map<String, dynamic>> createLabResult(
      int patientId, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.patientLabResults(patientId),
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Delete a lab result by its own [id].
  Future<void> deleteLabResult(int id) async {
    try {
      await _api.delete('${ApiConfig.labResults}/$id');
    } on DioException {
      rethrow;
    }
  }

  // ---------------------------------------------------------------------------
  // Pathology Reports
  // ---------------------------------------------------------------------------

  /// Fetch all pathology reports for a patient.
  Future<List<Map<String, dynamic>>> getPathologyReports(
      int patientId) async {
    try {
      final response = await _api.get(
        ApiConfig.patientPathology(patientId),
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

  /// Create a pathology report for a patient.
  Future<Map<String, dynamic>> createPathologyReport(
      int patientId, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.patientPathology(patientId),
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Delete a pathology report by its own [id].
  Future<void> deletePathologyReport(int id) async {
    try {
      await _api.delete('${ApiConfig.pathologyReports}/$id');
    } on DioException {
      rethrow;
    }
  }

  // ---------------------------------------------------------------------------
  // Imaging Results
  // ---------------------------------------------------------------------------

  /// Fetch all imaging results for a patient.
  Future<List<Map<String, dynamic>>> getImagingResults(int patientId) async {
    try {
      final response = await _api.get(
        ApiConfig.patientImaging(patientId),
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

  /// Create an imaging result for a patient.
  Future<Map<String, dynamic>> createImagingResult(
      int patientId, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.patientImaging(patientId),
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Delete an imaging result by its own [id].
  Future<void> deleteImagingResult(int id) async {
    try {
      await _api.delete('${ApiConfig.imagingResults}/$id');
    } on DioException {
      rethrow;
    }
  }

  // ---------------------------------------------------------------------------
  // Referrals
  // ---------------------------------------------------------------------------

  /// Fetch all referrals for a patient.
  Future<List<Map<String, dynamic>>> getReferrals(int patientId) async {
    try {
      final response = await _api.get(
        ApiConfig.patientReferrals(patientId),
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

  /// Create a referral for a patient.
  Future<Map<String, dynamic>> createReferral(
      int patientId, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.patientReferrals(patientId),
        data: data,
      );
      return response.data as Map<String, dynamic>;
    } on DioException {
      rethrow;
    }
  }

  /// Delete a referral by its own [id].
  Future<void> deleteReferral(int id) async {
    try {
      await _api.delete('${ApiConfig.referrals}/$id');
    } on DioException {
      rethrow;
    }
  }
}
