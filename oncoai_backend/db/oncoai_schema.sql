-- =====================================================================
-- OncoAI — Tumor Board Coordination Core
-- PostgreSQL DDL
-- Target: PostgreSQL 14+
--
-- Run as a role with CREATE privileges on the target database, e.g.:
--   psql -d oncoai -f oncoai_schema.sql
--
-- Notes on PII handling (read before using in production):
--   - patients.encrypted_full_name / encrypted_phone / encrypted_next_of_kin_contact
--     are bytea columns intended for pgcrypto's pgp_sym_encrypt/pgp_sym_decrypt.
--   - The encryption KEY must never live in this database or in source control.
--     Pass it at query time from an application secrets manager / KMS, e.g.:
--       INSERT INTO patients (encrypted_full_name, ...)
--       VALUES (pgp_sym_encrypt('Jane Doe', :encryption_key), ...);
--       SELECT pgp_sym_decrypt(encrypted_full_name, :encryption_key) FROM patients ...;
--   - identifier_hash should be a one-way hash (e.g. HMAC-SHA256) of the hospital
--     MRN/national ID, computed in the application layer, used for lookups
--     without storing the raw ID in plaintext.
--
-- Notes on audit logging:
--   - The audit trigger reads two session variables that the application must
--     set per request/transaction:
--       SET LOCAL app.current_user_id = '<uuid of acting user>';
--       SET LOCAL app.client_ip       = '<request ip>';
--     If unset, these default to NULL — audit rows are still written, just
--     without actor attribution, which should be treated as an application bug.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), pgp_sym_encrypt/decrypt


-- ---------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
    'coordinator', 'oncologist', 'surgeon', 'radiologist', 'pathologist',
    'remote_specialist', 'nurse', 'nutritionist', 'administrator', 'researcher'
);

CREATE TYPE case_status AS ENUM (
    'awaiting_workup', 'ready_for_tb', 'presented', 'treatment_decided', 'closed'
);

CREATE TYPE case_complexity AS ENUM ('simple', 'complex');

CREATE TYPE workup_type AS ENUM ('imaging', 'pathology', 'lab', 'dental', 'other');

CREATE TYPE workup_status AS ENUM ('ordered', 'in_progress', 'complete');

CREATE TYPE meeting_mode AS ENUM ('in_person', 'hybrid', 'virtual');

CREATE TYPE comm_channel AS ENUM ('sms', 'whatsapp', 'call', 'in_person');

CREATE TYPE comm_direction AS ENUM ('outbound', 'inbound');

CREATE TYPE consent_type AS ENUM ('data_use', 'tb_discussion', 'remote_consult', 'research_use');

CREATE TYPE consent_method AS ENUM ('verbal', 'written', 'sms_confirmation');

CREATE TYPE concern_level AS ENUM ('not_concerned', 'somewhat_concerned', 'very_concerned');

CREATE TYPE preference_category AS ENUM ('A', 'B', 'C');  -- A=low, B=moderate, C=high concern

CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');


-- ---------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------

CREATE TABLE hospitals (
    hospital_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    region        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    user_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id    UUID NOT NULL REFERENCES hospitals(hospital_id) ON DELETE RESTRICT,
    full_name      TEXT NOT NULL,
    role           user_role NOT NULL,
    specialty      TEXT,
    contact        TEXT,
    password_hash  TEXT NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patients (
    patient_id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier_hash                 TEXT NOT NULL UNIQUE,
    encrypted_full_name             BYTEA,
    dob                             DATE,
    gender                          TEXT,
    encrypted_phone                 BYTEA,
    encrypted_next_of_kin_contact   BYTEA,
    region                          TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE socioeconomic_factors (
    patient_id                UUID PRIMARY KEY REFERENCES patients(patient_id) ON DELETE RESTRICT,
    transportation_concern    BOOLEAN NOT NULL DEFAULT false,
    housing_concern           BOOLEAN NOT NULL DEFAULT false,
    financial_concern         BOOLEAN NOT NULL DEFAULT false,
    support_system_concern    BOOLEAN NOT NULL DEFAULT false,
    notes                     TEXT,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patient_preferences (
    patient_id          UUID PRIMARY KEY REFERENCES patients(patient_id) ON DELETE RESTRICT,
    travel_concern       concern_level,
    financial_concern    concern_level,
    risk_tolerance       concern_level,
    radiation_openness   concern_level,
    category             preference_category,
    collected_via        comm_channel,
    collected_at         TIMESTAMPTZ,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cases (
    case_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id            UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    opened_by             UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    suspected_diagnosis   TEXT NOT NULL,
    complexity            case_complexity NOT NULL DEFAULT 'simple',
    status                case_status NOT NULL DEFAULT 'awaiting_workup',
    opened_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE diagnostic_workup (
    workup_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id            UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    type               workup_type NOT NULL,
    status             workup_status NOT NULL DEFAULT 'ordered',
    assigned_provider  UUID REFERENCES users(user_id) ON DELETE SET NULL,
    result_summary     TEXT,
    file_reference     TEXT,   -- object storage key for scan / slide / recording
    completed_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meetings (
    meeting_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_date    DATE NOT NULL,
    meeting_time    TIME,
    mode            meeting_mode NOT NULL DEFAULT 'hybrid',
    coordinator_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meeting_cases (
    meeting_id           UUID NOT NULL REFERENCES meetings(meeting_id) ON DELETE CASCADE,
    case_id              UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    presentation_order   INT,
    PRIMARY KEY (meeting_id, case_id)
);

CREATE TABLE recommendations (
    recommendation_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id              UUID NOT NULL REFERENCES cases(case_id) ON DELETE RESTRICT,
    meeting_id           UUID REFERENCES meetings(meeting_id) ON DELETE SET NULL,
    recommended_action   TEXT NOT NULL,
    vote_breakdown       JSONB,
    rationale            TEXT,
    decided_by           UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE communications_log (
    comm_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id       UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    case_id          UUID REFERENCES cases(case_id) ON DELETE SET NULL,
    channel          comm_channel NOT NULL,
    direction        comm_direction NOT NULL,
    content_summary  TEXT,
    sent_by          UUID REFERENCES users(user_id) ON DELETE SET NULL,
    sent_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consent_records (
    consent_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    consent_type  consent_type NOT NULL,
    method        consent_method NOT NULL,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    log_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action       audit_action NOT NULL,
    entity_type  TEXT NOT NULL,
    entity_id    UUID,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address   INET
);


-- ---------------------------------------------------------------------
-- Indexes (beyond PK/UNIQUE already created above)
-- ---------------------------------------------------------------------
CREATE INDEX idx_users_hospital_role        ON users (hospital_id, role);
CREATE INDEX idx_cases_status               ON cases (status);
CREATE INDEX idx_cases_patient              ON cases (patient_id);
CREATE INDEX idx_workup_case_status         ON diagnostic_workup (case_id, status);
CREATE INDEX idx_meeting_cases_meeting      ON meeting_cases (meeting_id);
CREATE INDEX idx_meeting_cases_case         ON meeting_cases (case_id);
CREATE INDEX idx_recommendations_case       ON recommendations (case_id);
CREATE INDEX idx_comms_patient              ON communications_log (patient_id);
CREATE INDEX idx_comms_case                 ON communications_log (case_id);
CREATE INDEX idx_audit_user                 ON audit_log (user_id);
CREATE INDEX idx_audit_entity               ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_occurred_at          ON audit_log (occurred_at);


-- ---------------------------------------------------------------------
-- updated_at maintenance trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_socioeconomic_updated_at
    BEFORE UPDATE ON socioeconomic_factors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_preferences_updated_at
    BEFORE UPDATE ON patient_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_workup_updated_at
    BEFORE UPDATE ON diagnostic_workup
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------
-- Audit logging trigger
--
-- Applied to the tables that carry clinical / decision-relevant data.
-- Relies on session variables set by the application per transaction:
--   SET LOCAL app.current_user_id = '<uuid>';
--   SET LOCAL app.client_ip       = '<inet>';
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
    acting_user   UUID;
    acting_ip     INET;
    affected_id   UUID;
BEGIN
    BEGIN
        acting_user := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        acting_user := NULL;
    END;

    BEGIN
        acting_ip := current_setting('app.client_ip', true)::INET;
    EXCEPTION WHEN OTHERS THEN
        acting_ip := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        affected_id := (to_jsonb(OLD)->>(TG_ARGV[0]))::UUID;
    ELSE
        affected_id := (to_jsonb(NEW)->>(TG_ARGV[0]))::UUID;
    END IF;

    INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address)
    VALUES (
        acting_user,
        lower(TG_OP)::audit_action,
        TG_TABLE_NAME,
        affected_id,
        acting_ip
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Each call's first argument is the name of that table's primary key column,
-- used to pull entity_id out of the row dynamically.
CREATE TRIGGER trg_audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION log_audit('patient_id');

CREATE TRIGGER trg_audit_cases
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION log_audit('case_id');

CREATE TRIGGER trg_audit_workup
    AFTER INSERT OR UPDATE OR DELETE ON diagnostic_workup
    FOR EACH ROW EXECUTE FUNCTION log_audit('workup_id');

CREATE TRIGGER trg_audit_recommendations
    AFTER INSERT OR UPDATE OR DELETE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION log_audit('recommendation_id');


-- ---------------------------------------------------------------------
-- Convenience views for the coordinator dashboard
-- ---------------------------------------------------------------------

-- Cases ready to be scheduled for tumor board, with preference category
-- and socioeconomic flags surfaced for triage at a glance.
CREATE VIEW v_tb_ready_queue AS
SELECT
    c.case_id,
    c.patient_id,
    c.suspected_diagnosis,
    c.complexity,
    c.opened_at,
    pp.category            AS preference_category,
    sf.transportation_concern,
    sf.financial_concern,
    sf.support_system_concern
FROM cases c
LEFT JOIN patient_preferences pp ON pp.patient_id = c.patient_id
LEFT JOIN socioeconomic_factors sf ON sf.patient_id = c.patient_id
WHERE c.status = 'ready_for_tb'
ORDER BY c.opened_at ASC;

-- Outstanding (incomplete) diagnostic items per open case — drives the
-- "what's blocking this patient from tumor board" view.
CREATE VIEW v_open_workup_items AS
SELECT
    dw.case_id,
    dw.workup_id,
    dw.type,
    dw.status,
    dw.assigned_provider,
    c.suspected_diagnosis,
    c.opened_at
FROM diagnostic_workup dw
JOIN cases c ON c.case_id = dw.case_id
WHERE dw.status <> 'complete'
ORDER BY c.opened_at ASC;


-- ---------------------------------------------------------------------
-- Example seed data (safe to delete — illustrative only)
-- ---------------------------------------------------------------------
-- INSERT INTO hospitals (name, region) VALUES
--     ('Muhimbili National Hospital', 'Dar es Salaam'),
--     ('Ocean Road Cancer Institute', 'Dar es Salaam');
--
-- INSERT INTO users (hospital_id, full_name, role, specialty, contact, password_hash)
-- SELECT hospital_id, 'Coordinator Demo', 'coordinator', NULL, '+255700000000', 'replace_with_real_hash'
-- FROM hospitals WHERE name = 'Ocean Road Cancer Institute';
